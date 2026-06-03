import json

from api.config import get_settings
from services.gemini_service import LANGUAGE_NAMES


def _fallback_report(status: str, rule_summary: str, provider_error: str | None = None) -> dict:
    return {
        "status": status,
        "summary": rule_summary,
        "next_steps": [
            "Compare the new result with visible symptoms on the same plant.",
            "Continue monitoring with another clear leaf photo after 2-3 days.",
            "Contact a local agriculture expert if symptoms spread or the result is uncertain.",
        ],
        "source": "rule-based",
        "provider_error": provider_error,
    }


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


def _build_progress_prompt(payload) -> str:
    language_name = LANGUAGE_NAMES.get(payload.language, "English")
    return f"""
You are an agricultural assistant helping a farmer compare two plant disease scans.
Write a short, practical progress report in {language_name}.

Important safety rule:
- Confidence score indicates model certainty only. It does not directly represent disease severity.
- Do not say disease severity increased or decreased only because confidence changed.

Previous scan:
- Disease: {payload.previous.disease}
- Confidence: {round(payload.previous.confidence * 100, 1)}%
- Date: {payload.previous.scan_date or "Unknown"}
- Guidance summary: {payload.previous.guidance_summary or "Not available"}
- Disease information: {payload.previous.disease_summary or "Not available"}

Current scan:
- Disease: {payload.current.disease}
- Confidence: {round(payload.current.confidence * 100, 1)}%
- Date: {payload.current.scan_date or "Unknown"}
- Guidance summary: {payload.current.guidance_summary or "Not available"}
- Disease information: {payload.current.disease_summary or "Not available"}

Rule-based status: {payload.status}
Rule-based summary: {payload.rule_summary}

Return ONLY valid JSON with these keys:
  summary: string
  next_steps: array of 3 short strings
""".strip()


def generate_progress_report(payload) -> dict:
    settings = get_settings()
    if not settings.gemini_api_key:
        return _fallback_report(payload.status, payload.rule_summary)

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel(settings.gemini_model)
        response = model.generate_content(
            _build_progress_prompt(payload),
            generation_config={"temperature": 0.25, "response_mime_type": "application/json"},
        )
        data = _parse_json_response(response.text)
        next_steps = data.get("next_steps", [])
        if not isinstance(next_steps, list):
            next_steps = []
        return {
            "status": payload.status,
            "summary": str(data.get("summary", "")).strip() or payload.rule_summary,
            "next_steps": [str(item).strip() for item in next_steps if str(item).strip()][:3]
            or _fallback_report(payload.status, payload.rule_summary)["next_steps"],
            "source": "gemini",
            "provider_error": None,
        }
    except Exception as exc:
        return _fallback_report(payload.status, payload.rule_summary, f"Gemini: {exc}")
