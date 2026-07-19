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
    
    # OpenCV Leaf Analysis results
    leaf_detected: bool = True
    affected_area_percentage: float | None = None
    color_severity: str | None = None
    overlay_image: str | None = None



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


class ProgressPredictionPayload(BaseModel):
    disease: str
    confidence: float
    confidence_level: str | None = None
    model_mode: ModelMode | None = None
    scan_date: str | None = None
    guidance_summary: str | None = None
    disease_summary: str | None = None
    affected_area_percentage: float | None = None
    color_severity: str | None = None
    leaf_detected: bool | None = None



class ProgressReportRequest(BaseModel):
    previous: ProgressPredictionPayload
    current: ProgressPredictionPayload
    status: str
    rule_summary: str
    language: str = Field(default="en", pattern="^(en|hi|te)$")


class ProgressReportResponse(BaseModel):
    status: str
    summary: str
    next_steps: list[str]
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
    twilio_sid: str | None = None
    twilio_status: str | None = None
