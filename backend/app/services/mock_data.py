"""
Mock data service for development.
Generates realistic building data for frontend integration testing.
"""
import random
from datetime import datetime, timedelta
from typing import Optional

from app.schemas.building import (
    Building,
    BuildingLocation,
    BuildingList,
    EnergyData,
    EnergyDataPoint,
    EnergyBreakdown,
    Equipment,
    EquipmentList,
    EquipmentStatus,
    EquipmentType,
    Alert,
    AlertList,
    AlertSeverity,
    AlertStatus,
    HVACZone,
    HVACStatus,
    IAQData,
    IAQStatus,
    KPIs,
)

# Seed for reproducible data
random.seed(42)


def _now() -> datetime:
    return datetime.utcnow()


# Mock Buildings
MOCK_BUILDINGS = [
    Building(
        id="bld-001",
        name="Headquarters Tower",
        area_sqm=45000.0,
        floors=25,
        location=BuildingLocation(
            address="123 Business Avenue",
            city="New York",
            country="USA",
            latitude=40.7128,
            longitude=-74.0060,
        ),
        year_built=2015,
        building_type="Office",
        occupancy_rate=78.5,
        created_at=datetime(2024, 1, 1),
        updated_at=_now(),
    ),
    Building(
        id="bld-002",
        name="Innovation Center",
        area_sqm=28000.0,
        floors=12,
        location=BuildingLocation(
            address="456 Tech Park Drive",
            city="San Francisco",
            country="USA",
            latitude=37.7749,
            longitude=-122.4194,
        ),
        year_built=2019,
        building_type="Office",
        occupancy_rate=85.2,
        created_at=datetime(2024, 1, 1),
        updated_at=_now(),
    ),
    Building(
        id="bld-003",
        name="Distribution Hub",
        area_sqm=75000.0,
        floors=3,
        location=BuildingLocation(
            address="789 Logistics Way",
            city="Chicago",
            country="USA",
            latitude=41.8781,
            longitude=-87.6298,
        ),
        year_built=2020,
        building_type="Industrial",
        occupancy_rate=45.0,
        created_at=datetime(2024, 1, 1),
        updated_at=_now(),
    ),
]


def get_buildings() -> BuildingList:
    return BuildingList(buildings=MOCK_BUILDINGS, total=len(MOCK_BUILDINGS))


def get_building(building_id: str) -> Optional[Building]:
    for b in MOCK_BUILDINGS:
        if b.id == building_id:
            return b
    return None


def get_energy_data(
    building_id: str,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    resolution: str = "hourly",
) -> Optional[EnergyData]:
    building = get_building(building_id)
    if not building:
        return None

    now = _now()
    if not to_date:
        to_date = now
    if not from_date:
        from_date = now - timedelta(days=7)

    # Generate data points based on resolution
    data_points = []
    current = from_date

    if resolution == "hourly":
        delta = timedelta(hours=1)
        base_consumption = building.area_sqm * 0.015  # ~15 Wh/sqm/hour
    elif resolution == "daily":
        delta = timedelta(days=1)
        base_consumption = building.area_sqm * 0.36  # ~360 Wh/sqm/day
    else:  # monthly
        delta = timedelta(days=30)
        base_consumption = building.area_sqm * 10.8  # ~10.8 kWh/sqm/month

    while current <= to_date:
        # Add some variation (time of day, weekend effects)
        hour = current.hour
        weekday = current.weekday()

        # Office hours have higher consumption
        time_factor = 1.0
        if 9 <= hour <= 18 and weekday < 5:
            time_factor = 1.5
        elif weekday >= 5:
            time_factor = 0.6

        value = base_consumption * time_factor * random.uniform(0.85, 1.15)
        data_points.append(EnergyDataPoint(timestamp=current, value=round(value, 2)))
        current += delta

    total_energy = sum(dp.value for dp in data_points)

    # Calculate breakdown (typical office building)
    breakdown = EnergyBreakdown(
        hvac=round(total_energy * 0.45, 2),
        lighting=round(total_energy * 0.25, 2),
        it_equipment=round(total_energy * 0.20, 2),
        other=round(total_energy * 0.10, 2),
        total=round(total_energy, 2),
    )

    # Cost and carbon calculations
    cost_per_kwh = 0.12  # USD
    carbon_per_kwh = 0.4  # kg CO2

    return EnergyData(
        building_id=building_id,
        period_start=from_date,
        period_end=to_date,
        resolution=resolution,
        data_points=data_points,
        breakdown=breakdown,
        cost_usd=round(total_energy * cost_per_kwh, 2),
        carbon_kg=round(total_energy * carbon_per_kwh, 2),
    )


def get_equipment(building_id: str) -> Optional[EquipmentList]:
    building = get_building(building_id)
    if not building:
        return None

    equipment_templates = [
        ("AHU-1", EquipmentType.AHU, "Floor 1", 45.0),
        ("AHU-2", EquipmentType.AHU, "Floor 10", 45.0),
        ("AHU-3", EquipmentType.AHU, "Floor 20", 45.0),
        ("Chiller-1", EquipmentType.CHILLER, "Basement", 350.0),
        ("Chiller-2", EquipmentType.CHILLER, "Basement", 350.0),
        ("Boiler-1", EquipmentType.BOILER, "Basement", 200.0),
        ("VAV-1A", EquipmentType.VAV, "Floor 1 North", 5.0),
        ("VAV-1B", EquipmentType.VAV, "Floor 1 South", 5.0),
        ("CWP-1", EquipmentType.PUMP, "Basement", 15.0),
        ("CWP-2", EquipmentType.PUMP, "Basement", 15.0),
        ("CT-1", EquipmentType.COOLING_TOWER, "Roof", 25.0),
        ("Supply Fan-1", EquipmentType.FAN, "Mechanical Room", 10.0),
        ("HX-1", EquipmentType.HEAT_EXCHANGER, "Basement", 0.5),
    ]

    equipment_list = []
    status_summary = {"running": 0, "warning": 0, "alarm": 0, "offline": 0}

    for i, (name, eq_type, location, power) in enumerate(equipment_templates):
        # Generate status with weighted probability
        status_weights = [
            (EquipmentStatus.RUNNING, 0.75),
            (EquipmentStatus.WARNING, 0.15),
            (EquipmentStatus.ALARM, 0.05),
            (EquipmentStatus.OFFLINE, 0.05),
        ]
        status = random.choices(
            [s for s, _ in status_weights],
            weights=[w for _, w in status_weights],
        )[0]

        health = 95.0 if status == EquipmentStatus.RUNNING else (
            75.0 if status == EquipmentStatus.WARNING else (
                45.0 if status == EquipmentStatus.ALARM else 0.0
            )
        )
        health += random.uniform(-5, 5)
        health = max(0, min(100, health))

        eq = Equipment(
            id=f"{building_id}-{name}",
            building_id=building_id,
            name=name,
            type=eq_type,
            status=status,
            location=location,
            health_score=round(health, 1),
            last_maintenance=_now() - timedelta(days=random.randint(30, 180)),
            next_maintenance=_now() + timedelta(days=random.randint(30, 90)),
            power_kw=power * random.uniform(0.7, 1.0) if status == EquipmentStatus.RUNNING else 0,
            runtime_hours=random.uniform(5000, 25000),
        )
        equipment_list.append(eq)
        status_summary[status.value] += 1

    return EquipmentList(
        equipment=equipment_list,
        total=len(equipment_list),
        status_summary=status_summary,
    )


def get_alerts(building_id: str) -> Optional[AlertList]:
    building = get_building(building_id)
    if not building:
        return None

    alert_templates = [
        (AlertSeverity.CRITICAL, "High Temperature Alert", "Zone 3A temperature exceeded 28°C threshold"),
        (AlertSeverity.CRITICAL, "Chiller Fault", "Chiller-1 compressor fault detected"),
        (AlertSeverity.WARNING, "Filter Replacement Due", "AHU-2 filter differential pressure high"),
        (AlertSeverity.WARNING, "High CO2 Level", "Conference Room B CO2 at 1200 ppm"),
        (AlertSeverity.WARNING, "Unusual Energy Spike", "Floor 5 consumption 30% above baseline"),
        (AlertSeverity.INFO, "Maintenance Scheduled", "Quarterly HVAC inspection due next week"),
        (AlertSeverity.INFO, "Occupancy Update", "Building occupancy reached 90%"),
        (AlertSeverity.INFO, "Weather Advisory", "High outdoor temperature forecast for tomorrow"),
    ]

    alerts = []
    by_severity = {"critical": 0, "warning": 0, "info": 0}

    for i, (severity, title, message) in enumerate(alert_templates):
        # Randomly make some alerts resolved or acknowledged
        status_choice = random.choices(
            [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED],
            weights=[0.5, 0.3, 0.2],
        )[0]

        created = _now() - timedelta(hours=random.randint(1, 72))
        acknowledged = created + timedelta(minutes=random.randint(5, 60)) if status_choice != AlertStatus.ACTIVE else None
        resolved = acknowledged + timedelta(hours=random.randint(1, 24)) if status_choice == AlertStatus.RESOLVED else None

        alert = Alert(
            id=f"alert-{building_id}-{i:03d}",
            building_id=building_id,
            equipment_id=f"{building_id}-Chiller-1" if "Chiller" in title else None,
            severity=severity,
            status=status_choice,
            title=title,
            message=message,
            created_at=created,
            acknowledged_at=acknowledged,
            resolved_at=resolved,
        )
        alerts.append(alert)
        if status_choice == AlertStatus.ACTIVE:
            by_severity[severity.value] += 1

    return AlertList(alerts=alerts, total=len(alerts), by_severity=by_severity)


def get_hvac_status(building_id: str) -> Optional[HVACStatus]:
    building = get_building(building_id)
    if not building:
        return None

    zones = []
    for floor in range(1, min(building.floors + 1, 6)):  # Limit to first 5 floors for demo
        for zone_name in ["North", "South", "East", "West"]:
            base_temp = 22.0 + random.uniform(-2, 2)
            setpoint = 22.0 + random.choice([-1, 0, 1])

            zone = HVACZone(
                id=f"{building_id}-floor{floor}-{zone_name.lower()}",
                name=f"Floor {floor} {zone_name}",
                floor=floor,
                current_temp=round(base_temp, 1),
                setpoint=setpoint,
                humidity=round(45 + random.uniform(-10, 10), 1),
                occupancy=random.randint(0, 30),
                mode=random.choice(["cooling", "heating", "auto"]) if random.random() > 0.1 else "off",
            )
            zones.append(zone)

    avg_temp = sum(z.current_temp for z in zones) / len(zones)
    avg_humidity = sum(z.humidity for z in zones) / len(zones)

    return HVACStatus(
        building_id=building_id,
        zones=zones,
        total_zones=len(zones),
        avg_temperature=round(avg_temp, 1),
        avg_humidity=round(avg_humidity, 1),
        cooling_load_kw=round(building.area_sqm * 0.05 * random.uniform(0.3, 0.8), 1),
        heating_load_kw=round(building.area_sqm * 0.03 * random.uniform(0, 0.2), 1),
    )


def get_iaq_status(building_id: str) -> Optional[IAQStatus]:
    building = get_building(building_id)
    if not building:
        return None

    zones = []
    for floor in range(1, min(building.floors + 1, 5)):
        for zone_name in ["Open Office", "Conference Room", "Break Room"]:
            co2 = 400 + random.uniform(0, 800)  # 400-1200 ppm
            pm25 = random.uniform(5, 35)  # µg/m³

            # Calculate AQI (simplified)
            if co2 < 600 and pm25 < 12:
                aqi = random.randint(0, 50)
                level = "good"
            elif co2 < 800 and pm25 < 25:
                aqi = random.randint(51, 100)
                level = "moderate"
            elif co2 < 1000 and pm25 < 35:
                aqi = random.randint(101, 150)
                level = "unhealthy_sensitive"
            else:
                aqi = random.randint(151, 200)
                level = "unhealthy"

            iaq = IAQData(
                zone_id=f"{building_id}-floor{floor}-{zone_name.lower().replace(' ', '-')}",
                zone_name=f"Floor {floor} - {zone_name}",
                co2_ppm=round(co2, 0),
                pm25=round(pm25, 1),
                tvoc=round(random.uniform(50, 300), 0),
                humidity=round(45 + random.uniform(-10, 10), 1),
                temperature=round(22 + random.uniform(-2, 2), 1),
                aqi_score=aqi,
                aqi_level=level,
                timestamp=_now(),
            )
            zones.append(iaq)

    avg_aqi = int(sum(z.aqi_score for z in zones) / len(zones))
    if avg_aqi <= 50:
        overall = "good"
    elif avg_aqi <= 100:
        overall = "moderate"
    elif avg_aqi <= 150:
        overall = "unhealthy_sensitive"
    else:
        overall = "unhealthy"

    return IAQStatus(
        building_id=building_id,
        zones=zones,
        avg_aqi=avg_aqi,
        overall_level=overall,
    )


def get_kpis(building_id: str, period: str = "today") -> Optional[KPIs]:
    building = get_building(building_id)
    if not building:
        return None

    # Period multipliers
    multipliers = {
        "today": 1,
        "week": 7,
        "month": 30,
        "year": 365,
    }
    mult = multipliers.get(period, 1)

    # Base daily values
    daily_energy = building.area_sqm * 0.36  # kWh/sqm/day
    daily_cost = daily_energy * 0.12
    daily_carbon = daily_energy * 0.4

    # Calculate values
    energy = daily_energy * mult * random.uniform(0.9, 1.1)
    baseline_energy = energy * 1.22  # 22% higher baseline
    savings_kwh = baseline_energy - energy
    savings_percent = (savings_kwh / baseline_energy) * 100
    savings_usd = savings_kwh * 0.12

    # Get equipment and alerts for status
    equipment = get_equipment(building_id)
    alerts = get_alerts(building_id)

    return KPIs(
        building_id=building_id,
        period=period,
        energy_consumption_kwh=round(energy, 2),
        energy_cost_usd=round(energy * 0.12, 2),
        energy_savings_percent=round(savings_percent, 1),
        energy_savings_usd=round(savings_usd, 2),
        carbon_footprint_kg=round(energy * 0.4, 2),
        carbon_intensity=round((energy * 0.4) / building.area_sqm * 1000, 3),
        eui=round((daily_energy * 365) / building.area_sqm, 1),
        pue=round(random.uniform(1.2, 1.6), 2) if building.building_type != "Industrial" else None,
        avg_temperature=round(22 + random.uniform(-1, 1), 1),
        avg_humidity=round(45 + random.uniform(-5, 5), 1),
        comfort_score=round(random.uniform(75, 95), 1),
        equipment_uptime_percent=round(
            equipment.status_summary["running"] / equipment.total * 100 if equipment else 95, 1
        ),
        active_alerts=sum(alerts.by_severity.values()) if alerts else 0,
        maintenance_due=random.randint(1, 5),
    )


# Setpoint management (in-memory state)
_zone_setpoints: dict[str, dict] = {}


def update_setpoint(building_id: str, zone_id: str, temperature: Optional[float], humidity: Optional[float], mode: Optional[str]) -> dict:
    global _zone_setpoints

    key = f"{building_id}:{zone_id}"
    if key not in _zone_setpoints:
        _zone_setpoints[key] = {"temperature": 22.0, "humidity": 45.0, "mode": "auto"}

    applied = {}
    if temperature is not None:
        _zone_setpoints[key]["temperature"] = temperature
        applied["temperature"] = temperature
    if humidity is not None:
        _zone_setpoints[key]["humidity"] = humidity
        applied["humidity"] = humidity
    if mode is not None:
        _zone_setpoints[key]["mode"] = mode
        applied["mode"] = mode

    return applied
