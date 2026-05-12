LOCAL_GUIDANCE = {
    "healthy": {
        "explanation": "The leaf looks healthy. Keep observing the crop and continue regular care.",
        "symptoms": ["No major disease spots are visible.", "Leaf color and shape look normal."],
        "prevention": ["Water at the base of the plant.", "Remove weeds and dry leaves.", "Inspect leaves twice a week."],
        "treatment": ["No treatment is needed now.", "Use balanced fertilizer and avoid overwatering."],
        "farmer_advice": "Continue good crop care and check again if new spots appear.",
    },
    "default": {
        "explanation": "The image suggests a possible plant disease. Confirm in the field before applying treatment.",
        "symptoms": ["Leaf spots, yellowing, curling, or drying may be present.", "Disease can spread faster in humid weather."],
        "prevention": ["Remove infected leaves safely.", "Avoid overhead watering.", "Keep enough spacing between plants."],
        "treatment": ["Use crop-specific organic or recommended fungicide after local expert advice.", "Repeat inspection after 3 to 5 days."],
        "farmer_advice": "If infection is spreading quickly, contact a local agriculture officer or extension center.",
    },
}


def get_local_guidance(disease: str) -> dict:
    key = "healthy" if "healthy" in disease.lower() else "default"
    payload = LOCAL_GUIDANCE[key].copy()
    payload["source"] = "local-fallback"
    payload["provider_error"] = None
    return payload
