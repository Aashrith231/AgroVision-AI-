from fastapi import APIRouter, Header, HTTPException, status

from api.config import get_settings
from inference.predictor import predictor

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health")
def health() -> dict:
    return {"status": "ok"}


@router.get("/model-info")
def model_info(authorization: str | None = Header(default=None)) -> dict:
    if settings.admin_token:
        expected = f"Bearer {settings.admin_token}"
        if authorization != expected:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Admin access required.",
            )

    info = predictor.model_info()
    return {
        "app_name": settings.app_name,
        "environment": settings.environment,
        "model": info,
        "providers": {
            "ai_provider": settings.ai_provider,
            "ai_provider_order": settings.ai_provider_order,
            "gemini_configured": bool(settings.gemini_api_key),
            "groq_configured": bool(settings.groq_api_key),
            "groq_model": settings.groq_model if settings.groq_api_key else None,
            "nvidia_configured": bool(settings.nvidia_api_key),
            "nvidia_model": settings.nvidia_model if settings.nvidia_api_key else None,
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
