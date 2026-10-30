from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes.auth import router as auth_router
from app.api.routes.meetings import router as meetings_router
from app.core.config import get_settings
from app.db.session import engine
from app.api.routes.livekit import router as livekit_router
from app.api.routes.workspaces import router as workspaces_router


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Meeting rooms and AI-powered meeting intelligence.",
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(meetings_router, prefix="/api/v1")
app.include_router(livekit_router, prefix="/api/v1")
app.include_router(workspaces_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/health/ready", tags=["Health"])
def readiness():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database is not ready",
        ) from None

    return {
        "status": "ready",
        "database": "connected",
    }