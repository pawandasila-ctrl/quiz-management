import redis.asyncio as aioredis
import json
import logging
from config.settings import settings
import random

logger = logging.getLogger("config.database")

redis_client = aioredis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True
)

async def get_cache(key: str):
    try:
        data = await redis_client.get(key)
        if data:
            logger.info(f"⚡ [REDIS CACHE HIT] Key: {key}")
            return json.loads(data)
        logger.info(f"🛢️ [REDIS CACHE MISS] Key: {key}")
        return None
    except Exception as e:
        logger.warning(f"Redis get_cache error for key {key}: {e}")
        return None

async def set_cache(key: str, value: dict | list, expire_seconds: int = 300):
    try:
        jittered_ttl = expire_seconds + random.randint(0, 30)
        await redis_client.set(key, json.dumps(value), ex=jittered_ttl)
        logger.info(f"💾 [REDIS CACHE SAVED] Key: {key} (TTL: {jittered_ttl}s)")
    except Exception as e:
        logger.warning(f"Redis set_cache error for key {key}: {e}")

async def invalidate_pattern(pattern: str):
    try:
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)
            logger.info(f"🧹 [REDIS CACHE INVALIDATED] Purged keys: {keys}")
    except Exception as e:
        logger.warning(f"Redis invalidate_pattern error: {e}")
