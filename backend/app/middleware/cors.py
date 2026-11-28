from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.config import settings

def setup_cors(app: FastAPI) -> None:
    """Configures hardened CORS headers for backend API endpoints."""
    raw_origins = getattr(settings, "ALLOWED_ORIGINS", "*")
    origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    if not origins:
        origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True if origins != ["*"] else False,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
    )
