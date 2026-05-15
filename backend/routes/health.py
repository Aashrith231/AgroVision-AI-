from fastapi import APIRouter

from api.config import get_settings
from inference.predictor import predictor

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}


@router.get("/model-info")
def model_info() -> dict:
    info = predictor.model_info()
    return {
        "app_name": settings.app_name,
        "environment": settings.environment,
        "model": info,
        "providers": {
            "gemini_configured": bool(settings.gemini_api_key),
            "ollama_enabled": settings.ollama_enabled,
            "ollama_model": settings.ollama_model if settings.ollama_enabled else None,
            "elevenlabs_configured": bool(settings.elevenlabs_api_key and settings.elevenlabs_voice_id),
            "twilio_configured": bool(settings.twilio_account_sid and settings.twilio_auth_token),
        },
        "runtime": {
            "max_upload_mb": settings.max_upload_mb,
            "cors_mode": "allow-all" if settings.environment == "development" or settings.allow_all_origins else "restricted",
        },
    }
