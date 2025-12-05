"""
Main API router.
Aggregates all v1 API routes.
"""
from fastapi import APIRouter

from app.api.v1 import buildings, websocket, simulation

router = APIRouter(prefix="/api/v1")

# Include building routes
router.include_router(buildings.router)

# Include simulation routes (Digital Twin)
router.include_router(simulation.router)


# Report generation endpoint (placeholder)
@router.post("/reports/generate", tags=["Reports"])
async def generate_report(
    building_id: str,
    report_type: str = "energy",
    format: str = "pdf",
):
    """
    Generate a report.

    This is a placeholder for the reporting service.
    In production, this would generate PDF/Excel reports.

    - **building_id**: Building for the report
    - **report_type**: energy | esg | maintenance | summary
    - **format**: pdf | excel
    """
    return {
        "success": True,
        "message": "Report generation started",
        "job_id": f"report-{building_id}-001",
        "building_id": building_id,
        "report_type": report_type,
        "format": format,
        "status": "processing",
        "download_url": None,  # Will be populated when ready
    }
