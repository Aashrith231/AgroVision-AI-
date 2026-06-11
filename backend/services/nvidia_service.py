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


def generate_nvidia_json(prompt: str, max_tokens: int = 900) -> dict:
    settings = get_settings()
    if not settings.nvidia_api_key:
        raise RuntimeError("NVIDIA API key is not configured.")

    chat_template_kwargs: dict[str, object] = {"thinking": settings.nvidia_thinking}
    if settings.nvidia_thinking:
        chat_template_kwargs["reasoning_effort"] = "high"

    response = requests.post(
        f"{settings.nvidia_base_url.rstrip('/')}/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.nvidia_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.nvidia_model,
            "messages": [
                {
                    "role": "system",
                    "content": "You return farmer-friendly agricultural guidance as valid compact JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.25,
            "top_p": 0.95,
            "max_tokens": max_tokens,
            "stream": False,
            "chat_template_kwargs": chat_template_kwargs,
        },
        timeout=settings.nvidia_timeout_seconds,
    )
    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        detail = response.text.strip().replace("\n", " ")[:120] if response.text else str(exc)
        raise RuntimeError(f"NVIDIA HTTP {response.status_code}: {detail}") from exc

    try:
        payload = response.json()
        message = payload["choices"][0]["message"]
        content = message.get("content") or message.get("reasoning_content") or ""
    except (KeyError, IndexError, TypeError) as exc:
        raise RuntimeError(f"NVIDIA API returned an unexpected response: {response.text[:120]}") from exc

    if not str(content).strip():
        raise RuntimeError("NVIDIA API returned empty content")

    return _parse_json_response(str(content))


def generate_nvidia_guidance(disease: str, language: str) -> dict:
    prompt = (
        build_guidance_prompt(disease, language)
        + "\n\nReturn compact JSON only. Do not include markdown fences or extra explanation."
    )
    data = generate_nvidia_json(prompt)

    return {
        "explanation": str(data.get("explanation", "")).strip()
        or "The image suggests a possible plant condition. Please compare the guidance with field symptoms.",
        "symptoms": _coerce_list(data.get("symptoms"), ["Check for spots, yellowing, curling, or drying."]),
        "prevention": _coerce_list(data.get("prevention"), ["Keep the field clean and avoid excess water."]),
        "treatment": _coerce_list(data.get("treatment"), ["Remove badly infected leaves and consult a local agriculture expert."]),
        "farmer_advice": str(data.get("farmer_advice", "")).strip()
        or "Verify the AI result with actual field symptoms before spraying.",
        "source": "nvidia-deepseek",
        "provider_error": None,
    }
