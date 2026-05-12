LOCAL_GUIDANCE = {
    "background": {
        "explanation": "No clear plant leaf is visible in this image. Please upload a close-up photo of one leaf for disease diagnosis.",
        "symptoms": ["The image may contain background, soil, pot, hand, or unclear plant parts.", "Leaf disease symptoms cannot be checked without a clear leaf."],
        "prevention": ["Take the photo in good light.", "Keep one leaf centered in the frame.", "Avoid blurry or far-away images."],
        "treatment": ["No treatment suggestion is shown because a leaf was not clearly detected.", "Capture another image and run diagnosis again."],
        "farmer_advice": "Retake the photo with a single clear leaf. This helps the AI give a useful disease result.",
    },
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
    lowered = disease.lower()
    if "background" in lowered or "without_leaves" in lowered or "without leaves" in lowered:
        key = "background"
    elif "healthy" in lowered:
        key = "healthy"
    else:
        key = "default"
    payload = LOCAL_GUIDANCE[key].copy()
    payload["source"] = "local-fallback"
    payload["provider_error"] = None
    return payload
