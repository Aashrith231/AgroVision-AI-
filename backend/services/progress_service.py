import json

from api.config import get_settings
from services.gemini_service import (
    LANGUAGE_NAMES,
    PROVIDER_LABELS,
    _configured_providers,
    _next_guidance_provider,
    _provider_available,
    log_ai_provider,
    log_ai_switch,
)


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
    
    prev_area = f"{payload.previous.affected_area_percentage}%" if payload.previous.affected_area_percentage is not None else "Not available"
    prev_sev = payload.previous.color_severity or "Not available"
    curr_area = f"{payload.current.affected_area_percentage}%" if payload.current.affected_area_percentage is not None else "Not available"
    curr_sev = payload.current.color_severity or "Not available"

    return f"""
You are an agricultural assistant helping a farmer compare two plant disease scans.
Write a short, practical progress report in {language_name}.

Important safety rule:
- Confidence score indicates model certainty only. It does not directly represent disease severity.
- Do not say disease severity increased or decreased only because confidence changed.
- Use the provided "Affected Leaf Area" and "Segmented Severity" from pixel analysis as the true measure of disease progress.

Previous scan:
- Disease: {payload.previous.disease}
- Confidence: {round(payload.previous.confidence * 100, 1)}%
- Date: {payload.previous.scan_date or "Unknown"}
- Affected Leaf Area: {prev_area}
- Segmented Severity: {prev_sev}
- Guidance summary: {payload.previous.guidance_summary or "Not available"}
- Disease information: {payload.previous.disease_summary or "Not available"}

Current scan:
- Disease: {payload.current.disease}
- Confidence: {round(payload.current.confidence * 100, 1)}%
- Date: {payload.current.scan_date or "Unknown"}
- Affected Leaf Area: {curr_area}
- Segmented Severity: {curr_sev}
- Guidance summary: {payload.current.guidance_summary or "Not available"}
- Disease information: {payload.current.disease_summary or "Not available"}

Rule-based status: {payload.status}
Rule-based summary: {payload.rule_summary}

Return ONLY valid JSON with these keys:
  summary: string
  next_steps: array of 3 short strings
""".strip()


def _report_from_data(status: str, rule_summary: str, data: dict, source: str) -> dict:
    next_steps = data.get("next_steps", [])
    if not isinstance(next_steps, list):
        next_steps = []
    return {
        "status": status,
        "summary": str(data.get("summary", "")).strip() or rule_summary,
        "next_steps": [str(item).strip() for item in next_steps if str(item).strip()][:3]
        or _fallback_report(status, rule_summary)["next_steps"],
        "source": source,
        "provider_error": None,
    }


def generate_progress_report(payload) -> dict:
    settings = get_settings()
    provider_errors: list[str] = []
    prompt = _build_progress_prompt(payload)

    providers = [provider for provider in _configured_providers(settings) if provider in {"gemini", "groq", "deepseek", "static"}]
    for index, provider in enumerate(providers):
        if provider == "static":
            break
        if not _provider_available(settings, provider):
            continue

        try:
            if provider == "gemini":
                import warnings

                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", FutureWarning)
                    import google.generativeai as genai

                genai.configure(api_key=settings.gemini_api_key)
                model = genai.GenerativeModel(settings.gemini_model)
                response = model.generate_content(
                    prompt,
                    generation_config={"temperature": 0.25, "response_mime_type": "application/json"},
                )
                data = _parse_json_response(response.text)
                log_ai_provider("Gemini", settings.gemini_model)
                return _report_from_data(payload.status, payload.rule_summary, data, "gemini")

            if provider == "groq":
                from services.groq_service import generate_groq_json

                data = generate_groq_json(
                    prompt + "\n\nReturn compact JSON only. Do not include markdown fences or extra explanation.",
                    max_tokens=600,
                )
                log_ai_provider("Groq", settings.groq_model)
                return _report_from_data(payload.status, payload.rule_summary, data, "groq")

            if provider == "deepseek":
                from services.nvidia_service import generate_nvidia_json

                data = generate_nvidia_json(
                    prompt + "\n\nReturn compact JSON only. Do not include markdown fences or extra explanation.",
                    max_tokens=600,
                )
                log_ai_provider("DeepSeek", settings.nvidia_model)
                return _report_from_data(payload.status, payload.rule_summary, data, "nvidia-deepseek")
        except Exception as exc:
            provider_errors.append(f"{PROVIDER_LABELS[provider]}: {exc}")
            log_ai_switch(PROVIDER_LABELS[provider], _next_guidance_provider(settings, providers, index), exc)

    log_ai_provider("StaticFallback")
    return _fallback_report(
        payload.status,
        payload.rule_summary,
        " | ".join(provider_errors) if provider_errors else None,
    )
