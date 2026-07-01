from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    SECRET_KEY: str    
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    DATABASE_URL: str   
    ENVIRONMENT: str = "development"  
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # ── Cloudinary ────────────────────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
