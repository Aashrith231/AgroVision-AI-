from fastapi import APIRouter

from models.schemas import WhatsAppRequest, WhatsAppResponse
from services.whatsapp_service import send_whatsapp

router = APIRouter(tags=["whatsapp"])


@router.post("/send-whatsapp", response_model=WhatsAppResponse)
def whatsapp(payload: WhatsAppRequest) -> dict:
    return send_whatsapp(payload.phone, payload.disease, payload.confidence, payload.treatment, payload.prevention)
