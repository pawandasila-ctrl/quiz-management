from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
import asyncio
import logging

from config.database import engine, SessionLocal
from config.settings import settings
from config.logging import setup_logging
from config.limiter import limiter
from routers.auth import router as auth_router
from routers.admin import router as admin_router
from routers.student import router as student_router
import uvicorn

logger = logging.getLogger(__name__)
API_PREFIX = "/api"

async def _cleanup_expired_sessions() -> None:
    """Delete expired sessions once per hour to keep the sessions table lean."""
    while True:
        await asyncio.sleep(3600)
        try:
            async with SessionLocal() as db:
                result = await db.execute(
                    text("DELETE FROM sessions WHERE expires_at < now()")
                )
                await db.commit()
                if result.rowcount:
                    logger.info("Session cleanup: removed %d expired session(s).", result.rowcount)
        except Exception:
            logger.exception("Session cleanup task failed.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(settings.ENVIRONMENT)
    if settings.ENVIRONMENT == "production":
        wildcards = [o for o in settings.CORS_ORIGINS if "*" in o]
        if wildcards:
            raise RuntimeError(
                f"Wildcard CORS origins are not allowed in production: {wildcards}"
            )


    if settings.ENVIRONMENT != "testing":
        from config.database import run_migrations
        run_migrations()

    cleanup_task = asyncio.create_task(_cleanup_expired_sessions())
    logger.info("Application startup complete. Environment: %s", settings.ENVIRONMENT)
    yield
    cleanup_task.cancel()
    logger.info("Application shutdown.")


app = FastAPI(
    title="Quiz System API",
    description="Backend API for the Quiz System supporting Admin controls and Student features.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=f"{API_PREFIX}/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=f"{API_PREFIX}/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url=f"{API_PREFIX}/openapi.json" if settings.ENVIRONMENT != "production" else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

import hashlib
from fastapi.responses import Response as FastAPIResponse

@app.middleware("http")
async def etag_middleware(request: Request, call_next):
    response = await call_next(request)
    if request.method == "GET" and response.status_code == 200:
        body = b"".join([chunk async for chunk in response.body_iterator])
        etag = f'"{hashlib.md5(body).hexdigest()}"'
        
        # Check If-None-Match from client browser
        if_none_match = request.headers.get("if-none-match")
        if if_none_match and if_none_match == etag:
            res_headers = dict(response.headers)
            res_headers["ETag"] = etag
            return FastAPIResponse(status_code=304, headers=res_headers)

        res_headers = dict(response.headers)
        res_headers["ETag"] = etag
        return FastAPIResponse(
            content=body,
            status_code=response.status_code,
            headers=res_headers,
            media_type=response.media_type
        )
    return response

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    return response

# Routers
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(admin_router, prefix=API_PREFIX)
app.include_router(student_router, prefix=API_PREFIX)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all that prevents raw tracebacks from leaking into API responses."""
    logger.exception(
        "Unhandled exception on %s %s", request.method, request.url.path
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )


@app.get(f"{API_PREFIX}/health", tags=["Root"])
async def health_check():
    """Returns 200 when the service is healthy; 503 when the database is unreachable."""
    db_ok = False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        logger.warning("Health check: database unreachable.")

    payload = {
        "status": "healthy" if db_ok else "degraded",
        "database": "ok" if db_ok else "unreachable",
        "environment": settings.ENVIRONMENT,
    }
    if not db_ok:
        return JSONResponse(status_code=503, content=payload)
    return payload


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=5001, reload=True)
