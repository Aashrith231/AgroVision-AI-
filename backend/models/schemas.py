from pydantic import BaseModel, Field
from typing import Literal


ModelMode = Literal["crop", "medicinal"]


class PredictionItem(BaseModel):
    label: str
    confidence: float


class PredictionResponse(BaseModel):
    model_mode: ModelMode = "crop"
    disease: str
    confidence: float
    confidence_level: str
    warning: str | None = None
    top_predictions: list[PredictionItem]


class GuidanceRequest(BaseModel):
    disease: str
    language: str = Field(default="en", pattern="^(en|hi|te)$")


class GuidanceResponse(BaseModel):
    disease: str
    language: str
    explanation: str
    symptoms: list[str]
    prevention: list[str]
    treatment: list[str]
    farmer_advice: str
    source: str
    provider_error: str | None = None


class VoiceRequest(BaseModel):
    disease: str
    treatment: list[str] = []
    prevention: list[str] = []
    language: str = Field(default="en", pattern="^(en|hi|te)$")


class VoiceResponse(BaseModel):
    audio_base64: str
    mime_type: str
    source: str


class WhatsAppRequest(BaseModel):
    phone: str | None = None
    disease: str
    confidence: float
    treatment: list[str] = []
    prevention: list[str] = []
    language: str = Field(default="en", pattern="^(en|hi|te)$")


class WhatsAppResponse(BaseModel):
    mode: str
    sent: bool
    message: str
    wa_link: str | None = None
    twilio_error: str | None = None
