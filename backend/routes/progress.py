from fastapi import APIRouter

from models.schemas import ProgressReportRequest, ProgressReportResponse
from services.progress_service import generate_progress_report

router = APIRouter(tags=["progress"])


@router.post("/progress-report", response_model=ProgressReportResponse)
def progress_report(payload: ProgressReportRequest) -> dict:
    return generate_progress_report(payload)
