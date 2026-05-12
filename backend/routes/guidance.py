from fastapi import APIRouter

from models.schemas import GuidanceRequest, GuidanceResponse
from services.gemini_service import generate_guidance

router = APIRouter(tags=["guidance"])


@router.post("/generate-guidance", response_model=GuidanceResponse)
def guidance(payload: GuidanceRequest) -> dict:
    data = generate_guidance(payload.disease, payload.language)
    return {"disease": payload.disease, "language": payload.language, **data}
