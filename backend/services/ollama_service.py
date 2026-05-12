import json
from typing import Any

import requests

from api.config import get_settings
from services.gemini_service import build_guidance_prompt


def _coerce_list(value: Any, fallback: list[str]) -> list[str]:
    if isinstance(value, list):
        items = [str(item).strip() for item in value if str(item).strip()]
        return items or fallback
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return fallback


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(text[start : end + 1])


def generate_ollama_guidance(disease: str, language: str) -> dict:
    settings = get_settings()
    prompt = (
        build_guidance_prompt(disease, language)
        + "\n\nReturn compact JSON only. Do not include markdown fences or extra explanation."
    )
    response = requests.post(
        f"{settings.ollama_base_url.rstrip('/')}/api/generate",
        json={
            "model": settings.ollama_model,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.25,
                "num_predict": 700,
            },
        },
        timeout=settings.ollama_timeout_seconds,
    )
    response.raise_for_status()
    payload = response.json()
    data = _parse_json_response(payload.get("response", ""))

    return {
        "explanation": str(data.get("explanation", "")).strip()
        or "The image suggests a possible plant condition. Please compare the guidance with field symptoms.",
        "symptoms": _coerce_list(data.get("symptoms"), ["Check for spots, yellowing, curling, or drying."]),
        "prevention": _coerce_list(data.get("prevention"), ["Keep the field clean and avoid excess water."]),
        "treatment": _coerce_list(data.get("treatment"), ["Remove badly infected leaves and consult a local agriculture expert."]),
        "farmer_advice": str(data.get("farmer_advice", "")).strip()
        or "Verify the AI result with actual field symptoms before spraying.",
        "source": "ollama",
        "provider_error": None,
    }
