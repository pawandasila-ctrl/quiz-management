from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from config.database import init_db
from config.settings import settings
from routers.auth import router as auth_router
from routers.admin import router as admin_router
from routers.student import router as student_router
import uvicorn

API_PREFIX = "/api"

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Quiz System API",
    description="Backend API for the Quiz System supporting Admin controls and Student features.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=f"{API_PREFIX}/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=f"{API_PREFIX}/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url=f"{API_PREFIX}/openapi.json" if settings.ENVIRONMENT != "production" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(admin_router, prefix=API_PREFIX)
app.include_router(student_router, prefix=API_PREFIX)

@app.get(f"{API_PREFIX}/health", tags=["Root"])
async def root():
    return {
        "app": "Quiz System API",
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=5001, reload=True)
