import json

from api.config import get_settings
from services.local_disease_dictionary import get_local_guidance


LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "te": "Telugu"}


def build_guidance_prompt(disease: str, language: str) -> str:
    language_name = LANGUAGE_NAMES.get(language, "English")
    return f"""
You are an agricultural assistant helping small farmers.
Create simple, practical plant disease guidance in {language_name}.

Disease or class name: {disease}

Rules:
- Use farmer-friendly language.
- Avoid technical jargon.
- If the class says healthy, focus on care and prevention.
- Mention that the AI result should be verified if symptoms do not match.
- Return ONLY valid JSON with these keys:
  explanation: string
  symptoms: array of 3 short strings
  prevention: array of 4 short strings
  treatment: array of 4 short strings
  farmer_advice: string
""".strip()


def generate_guidance(disease: str, language: str) -> dict:
    settings = get_settings()
    provider_errors: list[str] = []

    lowered_disease = disease.lower()
    if "background" in lowered_disease or "without_leaves" in lowered_disease or "without leaves" in lowered_disease:
        return get_local_guidance(disease)

    if settings.gemini_api_key:
        try:
            import google.generativeai as genai

            genai.configure(api_key=settings.gemini_api_key)
            model = genai.GenerativeModel(settings.gemini_model)
            response = model.generate_content(
                build_guidance_prompt(disease, language),
                generation_config={"temperature": 0.35, "response_mime_type": "application/json"},
            )
            data = json.loads(response.text)
            return {
                "explanation": data.get("explanation", ""),
                "symptoms": data.get("symptoms", []),
                "prevention": data.get("prevention", []),
                "treatment": data.get("treatment", []),
                "farmer_advice": data.get("farmer_advice", ""),
                "source": "gemini",
                "provider_error": None,
            }
        except Exception as exc:
            provider_errors.append(f"Gemini: {exc}")

    if settings.ollama_enabled:
        try:
            from services.ollama_service import generate_ollama_guidance

            return generate_ollama_guidance(disease, language)
        except Exception as exc:
            provider_errors.append(f"Ollama: {exc}")

    fallback = get_local_guidance(disease)
    fallback["provider_error"] = " | ".join(provider_errors) if provider_errors else None
    return fallback
