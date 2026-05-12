import base64
from io import BytesIO

from api.config import get_settings


LANGUAGE_CODES = {"en": "en", "hi": "hi", "te": "te"}


def build_voice_script(disease: str, treatment: list[str], prevention: list[str]) -> str:
    treatment_text = " ".join(treatment[:3]) or "Please verify the leaf and consult a local agriculture expert."
    prevention_text = " ".join(prevention[:3]) or "Keep the field clean and avoid overwatering."
    return f"Plant disease result: {disease}. Treatment: {treatment_text}. Prevention: {prevention_text}"


def generate_voice(disease: str, treatment: list[str], prevention: list[str], language: str) -> dict:
    settings = get_settings()
    script = build_voice_script(disease, treatment, prevention)

    if settings.elevenlabs_api_key and settings.elevenlabs_voice_id:
        try:
            from elevenlabs import VoiceSettings
            from elevenlabs.client import ElevenLabs

            client = ElevenLabs(api_key=settings.elevenlabs_api_key)
            audio = client.text_to_speech.convert(
                voice_id=settings.elevenlabs_voice_id,
                model_id="eleven_multilingual_v2",
                text=script,
                output_format="mp3_44100_128",
                voice_settings=VoiceSettings(stability=0.45, similarity_boost=0.8),
            )
            audio_bytes = b"".join(audio)
            return {
                "audio_base64": base64.b64encode(audio_bytes).decode("utf-8"),
                "mime_type": "audio/mpeg",
                "source": "elevenlabs",
            }
        except Exception:
            pass

    buffer = BytesIO()
    from gtts import gTTS

    tts = gTTS(text=script, lang=LANGUAGE_CODES.get(language, "en"))
    tts.write_to_fp(buffer)
    return {
        "audio_base64": base64.b64encode(buffer.getvalue()).decode("utf-8"),
        "mime_type": "audio/mpeg",
        "source": "gtts-fallback",
    }
