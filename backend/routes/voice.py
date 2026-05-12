from fastapi import APIRouter

from models.schemas import VoiceRequest, VoiceResponse
from services.voice_service import generate_voice

router = APIRouter(tags=["voice"])


@router.post("/voice", response_model=VoiceResponse)
def voice(payload: VoiceRequest) -> dict:
    return generate_voice(payload.disease, payload.treatment, payload.prevention, payload.language)
