"""
Building API endpoints.
All endpoints for buildings, energy, equipment, alerts, HVAC, IAQ, KPIs.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas import (
    Building,
    BuildingList,
    EnergyData,
    EquipmentList,
    AlertList,
    HVACStatus,
    IAQStatus,
    KPIs,
    SetpointUpdate,
    SetpointResponse,
)
from app.config import settings

# Dynamic import based on data source config
if settings.data_source == "pleiadata":
    from app.services import real_data as data_service
else:
    from app.services import mock_data as data_service

router = APIRouter(prefix="/buildings", tags=["Buildings"])


@router.get("", response_model=BuildingList)
async def list_buildings():
    """
    Get list of all buildings.

    Returns basic information about all buildings in the system.
    """
    return data_service.get_buildings()


@router.get("/{building_id}", response_model=Building)
async def get_building(building_id: str):
    """
    Get building details.

    Returns detailed information about a specific building.
    """
    building = data_service.get_building(building_id)
    if not building:
        raise HTTPException(status_code=404, detail=f"Building {building_id} not found")
    return building


@router.get("/{building_id}/energy", response_model=EnergyData)
async def get_energy_data(
    building_id: str,
    from_date: Optional[datetime] = Query(None, alias="from", description="Start date (ISO 8601)"),
    to_date: Optional[datetime] = Query(None, alias="to", description="End date (ISO 8601)"),
    resolution: str = Query("hourly", description="Data resolution: hourly, daily, monthly"),
):
    """
    Get energy consumption data for a building.

    Returns time-series energy data with breakdown by system (HVAC, lighting, IT, other).
    Includes cost and carbon emissions calculations.

    - **from**: Start date (default: 7 days ago)
    - **to**: End date (default: now)
    - **resolution**: hourly | daily | monthly
    """
    if resolution not in ["hourly", "daily", "monthly"]:
        raise HTTPException(status_code=400, detail="Resolution must be: hourly, daily, or monthly")

    data = data_service.get_energy_data(building_id, from_date, to_date, resolution)
    if not data:
        raise HTTPException(status_code=404, detail=f"Building {building_id} not found")
    return data


@router.get("/{building_id}/equipment", response_model=EquipmentList)
async def get_equipment(building_id: str):
    """
    Get equipment list for a building.

    Returns all HVAC equipment with current status, health scores, and maintenance info.
    Status can be: running, warning, alarm, offline.
    """
    equipment = data_service.get_equipment(building_id)
    if not equipment:
        raise HTTPException(status_code=404, detail=f"Building {building_id} not found")
    return equipment


@router.get("/{building_id}/alerts", response_model=AlertList)
async def get_alerts(building_id: str):
    """
    Get alerts for a building.

    Returns all alerts with severity levels (critical, warning, info) and status.
    """
    alerts = data_service.get_alerts(building_id)
    if not alerts:
        raise HTTPException(status_code=404, detail=f"Building {building_id} not found")
    return alerts


@router.get("/{building_id}/hvac", response_model=HVACStatus)
async def get_hvac_status(building_id: str):
    """
    Get HVAC status for a building.

    Returns all HVAC zones with current temperature, setpoints, humidity, and occupancy.
    """
    status = data_service.get_hvac_status(building_id)
    if not status:
        raise HTTPException(status_code=404, detail=f"Building {building_id} not found")
    return status


@router.get("/{building_id}/iaq", response_model=IAQStatus)
async def get_iaq_status(building_id: str):
    """
    Get Indoor Air Quality (IAQ) data for a building.

    Returns IAQ metrics for all zones: CO2, PM2.5, TVOC, humidity, temperature.
    Includes AQI score and level (good, moderate, unhealthy).
    """
    status = data_service.get_iaq_status(building_id)
    if not status:
        raise HTTPException(status_code=404, detail=f"Building {building_id} not found")
    return status


@router.get("/{building_id}/kpis", response_model=KPIs)
async def get_kpis(
    building_id: str,
    period: str = Query("today", description="Period: today, week, month, year"),
):
    """
    Get KPI summary for a building.

    Returns key performance indicators:
    - Energy consumption, cost, and savings
    - Carbon footprint and intensity
    - EUI (Energy Use Intensity)
    - Comfort scores
    - Equipment uptime
    - Active alerts count
    """
    if period not in ["today", "week", "month", "year"]:
        raise HTTPException(status_code=400, detail="Period must be: today, week, month, or year")

    kpis = data_service.get_kpis(building_id, period)
    if not kpis:
        raise HTTPException(status_code=404, detail=f"Building {building_id} not found")
    return kpis


@router.post("/{building_id}/setpoints", response_model=SetpointResponse)
async def update_setpoints(building_id: str, setpoint: SetpointUpdate):
    """
    Update setpoints for a zone.

    Update temperature setpoint, humidity target, or HVAC mode for a specific zone.

    - **zone_id**: Zone identifier
    - **temperature**: Target temperature (16-30°C)
    - **humidity**: Target humidity (30-70%)
    - **mode**: cooling | heating | auto | off
    """
    building = data_service.get_building(building_id)
    if not building:
        raise HTTPException(status_code=404, detail=f"Building {building_id} not found")

    applied = data_service.update_setpoint(
        building_id,
        setpoint.zone_id,
        setpoint.temperature,
        setpoint.humidity,
        setpoint.mode,
    )

    if not applied:
        raise HTTPException(status_code=400, detail="No setpoints provided")

    return SetpointResponse(
        success=True,
        zone_id=setpoint.zone_id,
        applied_settings=applied,
        message=f"Setpoints updated for zone {setpoint.zone_id}",
    )
