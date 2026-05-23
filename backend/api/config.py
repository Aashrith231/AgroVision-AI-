from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    app_name: str = "AgroVision AI"
    environment: str = "development"
    frontend_origins: str = "http://localhost:3000"
    allow_all_origins: bool = False

    model_path: str = "../models/EfficientNetB0.h5"
    class_names_path: str = "../models/class_names.json"
    model_family: str = "efficientnet"

    medicinal_model_path: str = "../models/medicinal_disease_recognition_model.h5"
    medicinal_class_names_path: str = "../models/medicinal_disease_recognition_model_classes.json"
    medicinal_model_family: str = "raw"

    image_size: int = 224

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"

    ollama_enabled: bool = True
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen2.5-coder:7b"
    ollama_timeout_seconds: int = 90

    elevenlabs_api_key: str | None = None
    elevenlabs_voice_id: str | None = None

    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_whatsapp_from: str = "whatsapp:+14155238886"

    admin_token: str | None = None

    max_upload_mb: int = 8

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8-sig",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

    def resolve_path(self, configured_path: str) -> Path:
        path = Path(configured_path)
        if path.is_absolute():
            return path
        return (BASE_DIR / path).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
