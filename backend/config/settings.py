from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Any, Union
import json


class Settings(BaseSettings):
    SECRET_KEY: str    
    API_ENCRYPTION_KEY: str = "dev-encryption-key-must-be-32-bytes-long!"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    DATABASE_URL: str   
    REDIS_URL: str = "redis://localhost:6379/0"
    ENVIRONMENT: str = "development"  
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000"]
    COOKIE_DOMAIN: str | None = None

    # ── Cloudinary ────────────────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return ["http://localhost:3000"]
            if v.startswith("[") and v.endswith("]"):
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        return parsed
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return v
        return ["http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
