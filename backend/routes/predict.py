from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile

from api.config import get_settings
from inference.predictor import predictor
from models.schemas import PredictionResponse

router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    mode: str = Form(default="crop"),
    content_length: int | None = Header(default=None),
) -> dict:
    settings = get_settings()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if mode not in {"crop", "medicinal"}:
        raise HTTPException(status_code=400, detail="Invalid prediction mode.")

    if file.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(status_code=400, detail="Only JPG and PNG images are supported.")
    if content_length and content_length > max_bytes:
        raise HTTPException(status_code=413, detail=f"Image must be smaller than {settings.max_upload_mb} MB.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded image is empty.")
    if len(image_bytes) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Image must be smaller than {settings.max_upload_mb} MB.")

    try:
        prediction = predictor.predict(image_bytes, mode=mode)
        
        # Run OpenCV Leaf analysis for disease area percentage and overlay image
        try:
            from services.leaf_analysis_service import analyze_leaf_severity
            analysis = analyze_leaf_severity(image_bytes)
            if analysis.get("leaf_detected", False):
                prediction["leaf_detected"] = True
                prediction["affected_area_percentage"] = analysis["affected_area_percentage"]
                prediction["color_severity"] = analysis["severity"]
                prediction["overlay_image"] = analysis["overlay_image"]
            else:
                prediction["leaf_detected"] = False
        except Exception as leaf_exc:
            print(f"[Leaf Analysis Error] {leaf_exc}", flush=True)
            prediction["leaf_detected"] = False

        return prediction
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

