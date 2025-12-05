from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


# Enums
class EquipmentStatus(str, Enum):
    RUNNING = "running"
    WARNING = "warning"
    ALARM = "alarm"
    OFFLINE = "offline"


class EquipmentType(str, Enum):
    AHU = "AHU"
    VAV = "VAV"
    CHILLER = "Chiller"
    BOILER = "Boiler"
    PUMP = "Pump"
    FAN = "Fan"
    COOLING_TOWER = "Cooling Tower"
    HEAT_EXCHANGER = "Heat Exchanger"


class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class AlertStatus(str, Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


# Building schemas
class BuildingLocation(BaseModel):
    address: str
    city: str
    country: str
    latitude: float
    longitude: float


class Building(BaseModel):
    id: str
    name: str
    area_sqm: float = Field(..., description="Building area in square meters")
    floors: int
    location: BuildingLocation
    year_built: int
    building_type: str = Field(..., description="Office, Retail, Industrial, etc.")
    occupancy_rate: float = Field(..., ge=0, le=100, description="Current occupancy %")
    created_at: datetime
    updated_at: datetime


class BuildingList(BaseModel):
    buildings: list[Building]
    total: int


# Energy schemas
class EnergyDataPoint(BaseModel):
    timestamp: datetime
    value: float = Field(..., description="Energy in kWh")


class EnergyBreakdown(BaseModel):
    hvac: float = Field(..., description="HVAC energy in kWh")
    lighting: float = Field(..., description="Lighting energy in kWh")
    it_equipment: float = Field(..., description="IT equipment energy in kWh")
    other: float = Field(..., description="Other energy in kWh")
    total: float = Field(..., description="Total energy in kWh")


class EnergyData(BaseModel):
    building_id: str
    period_start: datetime
    period_end: datetime
    resolution: str = Field(..., description="hourly, daily, monthly")
    data_points: list[EnergyDataPoint]
    breakdown: EnergyBreakdown
    cost_usd: float
    carbon_kg: float = Field(..., description="Carbon emissions in kg CO2")


# Equipment schemas
class Equipment(BaseModel):
    id: str
    building_id: str
    name: str
    type: EquipmentType
    status: EquipmentStatus
    location: str = Field(..., description="Floor/Zone location")
    health_score: float = Field(..., ge=0, le=100, description="Health score 0-100%")
    last_maintenance: Optional[datetime] = None
    next_maintenance: Optional[datetime] = None
    power_kw: float = Field(..., description="Current power consumption in kW")
    runtime_hours: float = Field(..., description="Total runtime hours")


class EquipmentList(BaseModel):
    equipment: list[Equipment]
    total: int
    status_summary: dict[str, int] = Field(
        ..., description="Count by status: running, warning, alarm, offline"
    )


# Alert schemas
class Alert(BaseModel):
    id: str
    building_id: str
    equipment_id: Optional[str] = None
    severity: AlertSeverity
    status: AlertStatus
    title: str
    message: str
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None


class AlertList(BaseModel):
    alerts: list[Alert]
    total: int
    by_severity: dict[str, int] = Field(
        ..., description="Count by severity: critical, warning, info"
    )


# HVAC schemas
class HVACZone(BaseModel):
    id: str
    name: str
    floor: int
    current_temp: float = Field(..., description="Current temperature in Celsius")
    setpoint: float = Field(..., description="Target temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity %")
    occupancy: int = Field(..., description="Number of occupants")
    mode: str = Field(..., description="cooling, heating, auto, off")


class HVACStatus(BaseModel):
    building_id: str
    zones: list[HVACZone]
    total_zones: int
    avg_temperature: float
    avg_humidity: float
    cooling_load_kw: float
    heating_load_kw: float


# IAQ (Indoor Air Quality) schemas
class IAQData(BaseModel):
    zone_id: str
    zone_name: str
    co2_ppm: float = Field(..., description="CO2 level in ppm")
    pm25: float = Field(..., description="PM2.5 in µg/m³")
    tvoc: float = Field(..., description="Total VOC in ppb")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity %")
    temperature: float = Field(..., description="Temperature in Celsius")
    aqi_score: int = Field(..., ge=0, le=500, description="Air Quality Index 0-500")
    aqi_level: str = Field(..., description="good, moderate, unhealthy, etc.")
    timestamp: datetime


class IAQStatus(BaseModel):
    building_id: str
    zones: list[IAQData]
    avg_aqi: int
    overall_level: str


# KPI schemas
class KPIs(BaseModel):
    building_id: str
    period: str = Field(..., description="today, week, month, year")

    # Energy
    energy_consumption_kwh: float
    energy_cost_usd: float
    energy_savings_percent: float = Field(..., description="Savings vs baseline")
    energy_savings_usd: float

    # Carbon
    carbon_footprint_kg: float
    carbon_intensity: float = Field(..., description="kg CO2/sqm")

    # Efficiency
    eui: float = Field(..., description="Energy Use Intensity kWh/sqm/year")
    pue: Optional[float] = Field(None, description="Power Usage Effectiveness (data centers)")

    # Comfort
    avg_temperature: float
    avg_humidity: float
    comfort_score: float = Field(..., ge=0, le=100, description="Thermal comfort score")

    # Operations
    equipment_uptime_percent: float
    active_alerts: int
    maintenance_due: int


# Setpoint schemas
class SetpointUpdate(BaseModel):
    zone_id: str
    temperature: Optional[float] = Field(None, ge=16, le=30, description="Target temp in Celsius")
    humidity: Optional[float] = Field(None, ge=30, le=70, description="Target humidity %")
    mode: Optional[str] = Field(None, description="cooling, heating, auto, off")


class SetpointResponse(BaseModel):
    success: bool
    zone_id: str
    applied_settings: dict
    message: str
