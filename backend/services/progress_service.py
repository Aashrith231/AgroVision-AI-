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


def _generate_static_response(payload) -> dict:
    status = payload.status

    status_templates = {
        "improving": {
            "summary": f"Your {payload.previous.disease} condition is improving. The plant is recovering well.",
            "next_steps": [
                "Continue with your current treatment regimen for another week.",
                "Monitor the plant closely with follow-up photos to track continued recovery.",
                "Once fully recovered, maintain preventive measures to avoid reinfection."
            ]
        },
        "worsening": {
            "summary": f"Your {payload.current.disease} condition is worsening. Immediate action is needed.",
            "next_steps": [
                "Increase treatment frequency and consider alternative fungicides or pesticides.",
                "Isolate affected plants from healthy ones if possible.",
                "Contact a local agriculture expert for immediate assistance."
            ]
        },
        "stable": {
            "summary": f"Your {payload.current.disease} condition appears stable. Monitor for any changes.",
            "next_steps": [
                "Continue your current treatment plan without changes.",
                "Take photos every 2-3 days to ensure the condition doesn't worsen.",
                "Maintain good field hygiene and environmental conditions."
            ]
        },
        "unknown": {
            "summary": "Unable to determine clear progress between the two scans.",
            "next_steps": [
                "Ensure future photos are taken under similar lighting and angle for better comparison.",
                "Consult the disease guide for more information about the identified condition.",
                "Contact an agriculture specialist if symptoms are unclear."
            ]
        }
    }

    template = status_templates.get(status, status_templates["unknown"])
    return {
        "status": status,
        "summary": template["summary"],
        "next_steps": template["next_steps"],
        "source": "static",
        "provider_error": None,
    }


def generate_progress_report(payload) -> dict:
    log_ai_provider("StaticFallback")
    return _generate_static_response(payload)
