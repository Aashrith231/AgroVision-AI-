from urllib.parse import quote

from api.config import get_settings


def normalize_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    cleaned = phone.strip().replace(" ", "").replace("-", "")
    if cleaned.startswith("whatsapp:"):
        cleaned = cleaned.removeprefix("whatsapp:")
    return cleaned if cleaned.startswith("+") else f"+{cleaned}"


def build_whatsapp_message(disease: str, confidence: float, treatment: list[str], prevention: list[str]) -> str:
    treatment_text = "\n".join(f"- {item}" for item in treatment[:4]) or "- Verify symptoms before treatment."
    prevention_text = "\n".join(f"- {item}" for item in prevention[:4]) or "- Keep plants clean and avoid excess water."
    return (
        "🌱 AgroVision AI Plant Doctor Result\n\n"
        f"🦠 Disease: {disease}\n"
        f"✅ Confidence: {round(confidence * 100, 1)}%\n\n"
        f"💊 Treatment:\n{treatment_text}\n\n"
        f"🛡️ Prevention:\n{prevention_text}\n\n"
        "Please verify with field symptoms or a local agriculture expert before spraying."
    )


def send_whatsapp(phone: str | None, disease: str, confidence: float, treatment: list[str], prevention: list[str]) -> dict:
    settings = get_settings()
    message = build_whatsapp_message(disease, confidence, treatment, prevention)
    normalized_phone = normalize_phone(phone)

    if normalized_phone and settings.twilio_account_sid and settings.twilio_auth_token:
        try:
            from twilio.rest import Client

            client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
            client.messages.create(
                from_=settings.twilio_whatsapp_from,
                to=f"whatsapp:{normalized_phone}",
                body=message,
            )
            return {"mode": "twilio", "sent": True, "message": message, "wa_link": None, "twilio_error": None}
        except Exception as exc:
            wa_link = f"https://wa.me/{normalized_phone.replace('+', '')}?text={quote(message)}"
            return {
                "mode": "wa.me",
                "sent": False,
                "message": message,
                "wa_link": wa_link,
                "twilio_error": str(exc),
            }

    wa_target = normalized_phone or ""
    wa_link = f"https://wa.me/{wa_target.replace('+', '')}?text={quote(message)}"
    return {"mode": "wa.me", "sent": False, "message": message, "wa_link": wa_link, "twilio_error": None}
