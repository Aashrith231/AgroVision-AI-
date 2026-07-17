import base64
import cv2
import numpy as np

MAX_SIZE = 700

def analyze_leaf_severity(image_bytes: bytes) -> dict:
    """
    Analyzes leaf images using HSV color segmentation to identify healthy vs diseased spots.
    Returns calculated percentages, severity levels, and base64-encoded visual overlays.
    """
    # 1. Decode image from bytes in memory
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"leaf_detected": False, "error": "Invalid image format."}

    # 2. Resize to speed up pixel counting operations
    h, w = img.shape[:2]
    scale = MAX_SIZE / max(h, w)
    if scale < 1:
        img = cv2.resize(img, None, fx=scale, fy=scale)

    # 3. Segment entire leaf from dark backgrounds
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower_leaf = np.array([5, 15, 20])
    upper_leaf = np.array([100, 255, 255])
    leaf_mask = cv2.inRange(hsv, lower_leaf, upper_leaf)

    # Clean noise
    kernel = np.ones((5, 5), np.uint8)
    leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_CLOSE, kernel)
    leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_OPEN, kernel)

    total_leaf_pixels = cv2.countNonZero(leaf_mask)
    if total_leaf_pixels == 0:
        return {"leaf_detected": False, "error": "No leaf structure detected in the image."}

    # 4. Color Segmentation Masks
    # Healthy Green (Hue: 33-90)
    lower_green = np.array([33, 35, 35])
    upper_green = np.array([90, 255, 255])
    mask_green = cv2.bitwise_and(cv2.inRange(hsv, lower_green, upper_green), leaf_mask)

    # Disease Yellow (Hue: 12-32)
    lower_yellow = np.array([12, 40, 40])
    upper_yellow = np.array([32, 255, 255])
    mask_yellow = cv2.bitwise_and(cv2.inRange(hsv, lower_yellow, upper_yellow), leaf_mask)

    # Disease Brown / Necrotic Spots (Browns, Grays, and Dark Lesions)
    lower_brown1 = np.array([0, 5, 20])
    upper_brown1 = np.array([20, 255, 245])
    lower_brown2 = np.array([91, 5, 20])
    upper_brown2 = np.array([180, 255, 245])
    
    mask_brown = cv2.bitwise_or(
        cv2.inRange(hsv, lower_brown1, upper_brown1),
        cv2.inRange(hsv, lower_brown2, upper_brown2)
    )
    mask_brown = cv2.bitwise_and(mask_brown, leaf_mask)

    # 5. Overlap resolution (Prioritize green first, then yellow, then brown)
    final_healthy = mask_green
    final_yellow = cv2.bitwise_and(mask_yellow, cv2.bitwise_not(final_healthy))
    final_brown = cv2.bitwise_and(mask_brown, cv2.bitwise_not(final_healthy))
    final_brown = cv2.bitwise_and(final_brown, cv2.bitwise_not(final_yellow))

    # Shadow/Rest
    assigned_pixels = cv2.bitwise_or(cv2.bitwise_or(final_healthy, final_yellow), final_brown)
    final_shadow = cv2.bitwise_and(leaf_mask, cv2.bitwise_not(assigned_pixels))

    # 6. Calculations
    healthy_pixels = cv2.countNonZero(final_healthy)
    yellow_pixels = cv2.countNonZero(final_yellow)
    brown_pixels = cv2.countNonZero(final_brown)
    shadow_pixels = cv2.countNonZero(final_shadow)

    # Weighted disease score: brown counts fully, yellow counts at 30% weighting
    disease_pixels = brown_pixels + (0.30 * yellow_pixels)
    percentage = (disease_pixels / total_leaf_pixels) * 100

    # Severity scale classification
    if percentage < 10:
        severity = "Healthy"
    elif percentage < 25:
        severity = "Mild"
    elif percentage < 50:
        severity = "Moderate"
    elif percentage < 75:
        severity = "Severe"
    else:
        severity = "Critical"

    # 7. Generate overlay visualization image
    result = img.copy()
    result[final_healthy > 0] = (0, 255, 0)   # Green overlay for Healthy
    result[final_yellow > 0] = (0, 255, 255)  # Yellow overlay for Mild Disease
    result[final_brown > 0] = (0, 0, 255)     # Red overlay for Severe Lesions

    overlay = cv2.addWeighted(img, 0.6, result, 0.4, 0)

    # 8. Encode overlay image to Base64
    _, encoded_img = cv2.imencode(".png", overlay)
    overlay_base64 = base64.b64encode(encoded_img).decode("utf-8")

    return {
        "leaf_detected": True,
        "healthy_pixels": healthy_pixels,
        "brown_pixels": brown_pixels,
        "yellow_pixels": yellow_pixels,
        "shadow_pixels": shadow_pixels,
        "total_leaf_pixels": total_leaf_pixels,
        "affected_area_percentage": round(percentage, 2),
        "severity": severity,
        "overlay_image": f"data:image/png;base64,{overlay_base64}"
    }
