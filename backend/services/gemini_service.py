import json

from api.config import get_settings
from services.local_disease_dictionary import get_local_guidance


LANGUAGE_NAMES = {"en": "English", "hi": "Hindi", "te": "Telugu"}


def log_ai_provider(provider: str, model: str | None = None) -> None:
    model_text = f" Model={model}" if model else ""
    print(f"[AI] Provider={provider}{model_text}", flush=True)


def _short_error(error: Exception | str | None) -> str:
    if error is None:
        return ""
    text = " ".join(str(error).split())
    lowered = text.lower()
    if "read timed out" in lowered or "timed out" in lowered:
        return "request timed out"
    if text.startswith("429") or "quota exceeded" in lowered or "rate limit" in lowered:
        return "quota/rate limit exceeded"
    if "http 401" in lowered or "invalid api key" in lowered or "unauthorized" in lowered:
        return "invalid API key or unauthorized"
    if "http 403" in lowered or "forbidden" in lowered:
        return "forbidden"
    if "http 404" in lowered or "not found" in lowered:
        return "model or endpoint not found"
    if len(text) > 100:
        return text[:97] + "..."
    return text


def log_ai_switch(failed_provider: str, next_provider: str, error: Exception | str | None = None) -> None:
    reason = _short_error(error)
    if reason:
        print(f"[AI] {failed_provider} failed ({reason}), switching to {next_provider}", flush=True)
    else:
        print(f"[AI] {failed_provider} failed, switching to {next_provider}", flush=True)


PROVIDER_LABELS = {
    "gemini": "Gemini",
    "groq": "Groq",
    "deepseek": "DeepSeek",
    "ollama": "Ollama",
    "static": "StaticFallback",
}


def _normalize_provider(provider: str) -> str:
    normalized = provider.strip().lower()
    if normalized in {"nvidia", "nvidia-deepseek", "deepseek-v4-flash"}:
        return "deepseek"
    if normalized in {"staticfallback", "fallback", "local"}:
        return "static"
    return normalized


def _provider_available(settings, provider: str) -> bool:
    if provider == "gemini":
        return bool(settings.gemini_api_key)
    if provider == "groq":
        return bool(settings.groq_api_key)
    if provider == "deepseek":
        return bool(settings.nvidia_api_key)
    if provider == "ollama":
        return bool(settings.ollama_enabled)
    return provider == "static"


def _provider_model(settings, provider: str) -> str | None:
    if provider == "gemini":
        return settings.gemini_model
    if provider == "groq":
        return settings.groq_model
    if provider == "deepseek":
        return settings.nvidia_model
    if provider == "ollama":
        return settings.ollama_model
    return None


def _configured_providers(settings) -> list[str]:
    selected = _normalize_provider(settings.ai_provider)
    if selected != "auto":
        return [selected] if selected == "static" else [selected, "static"]

    providers = [_normalize_provider(provider) for provider in settings.ai_provider_order.split(",")]
    providers = [provider for provider in providers if provider in PROVIDER_LABELS]
    return providers or ["gemini", "groq", "deepseek", "ollama", "static"]


def _next_guidance_provider(settings, providers: list[str], current_index: int) -> str:
    for provider in providers[current_index + 1 :]:
        if _provider_available(settings, provider):
            return PROVIDER_LABELS[provider]
    return "StaticFallback"


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
        log_ai_provider("StaticFallback")
        return get_local_guidance(disease)

    providers = _configured_providers(settings)
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
                    build_guidance_prompt(disease, language),
                    generation_config={"temperature": 0.35, "response_mime_type": "application/json"},
                )
                data = json.loads(response.text)
                log_ai_provider("Gemini", settings.gemini_model)
                return {
                    "explanation": data.get("explanation", ""),
                    "symptoms": data.get("symptoms", []),
                    "prevention": data.get("prevention", []),
                    "treatment": data.get("treatment", []),
                    "farmer_advice": data.get("farmer_advice", ""),
                    "source": "gemini",
                    "provider_error": None,
                }

            if provider == "groq":
                from services.groq_service import generate_groq_guidance

                data = generate_groq_guidance(disease, language)
                log_ai_provider("Groq", settings.groq_model)
                return data

            if provider == "deepseek":
                from services.nvidia_service import generate_nvidia_guidance

                data = generate_nvidia_guidance(disease, language)
                log_ai_provider("DeepSeek", settings.nvidia_model)
                return data

            if provider == "ollama":
                from services.ollama_service import generate_ollama_guidance

                data = generate_ollama_guidance(disease, language)
                log_ai_provider("Ollama", settings.ollama_model)
                return data
        except Exception as exc:
            provider_errors.append(f"{PROVIDER_LABELS[provider]}: {exc}")
            log_ai_switch(PROVIDER_LABELS[provider], _next_guidance_provider(settings, providers, index), exc)

    fallback = get_local_guidance(disease)
    fallback["provider_error"] = " | ".join(provider_errors) if provider_errors else None
    log_ai_provider("StaticFallback")
    return fallback
