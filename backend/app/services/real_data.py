"""
Real data service using PLEIAData dataset.

Provides the same interface as mock_data.py but uses real data
from the PLEIAData dataset (University of Murcia, Spain).
"""
import random
from datetime import datetime, timedelta
from typing import Optional

from app.config import settings
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
from app.services.pleiadata_loader import get_loader, PLEIADataLoader


def _now() -> datetime:
    return datetime.utcnow()


def _get_loader() -> PLEIADataLoader:
    """Get PLEIAData loader instance."""
    return get_loader(settings.pleiadata_path)


# Building definitions based on PLEIAData
def _create_buildings() -> list[Building]:
    """Create building objects from PLEIAData building info."""
    buildings = []
    loader = _get_loader()

    for building_id, info in loader.BUILDING_INFO.items():
        building = Building(
            id=building_id,
            name=info["name"],
            area_sqm=info["area_sqm"],
            floors=info["floors"],
            location=BuildingLocation(
                address="Campus de Espinardo",
                city=info["city"],
                country=info["country"],
                latitude=info["latitude"],
                longitude=info["longitude"],
            ),
            year_built=info["year_built"],
            building_type=info["building_type"],
            occupancy_rate=random.uniform(60, 85),  # Estimated
            created_at=datetime(2021, 1, 1),
            updated_at=_now(),
        )
        buildings.append(building)

    return buildings


# Cache buildings
_BUILDINGS: Optional[list[Building]] = None


def _get_buildings() -> list[Building]:
    global _BUILDINGS
    if _BUILDINGS is None:
        _BUILDINGS = _create_buildings()
    return _BUILDINGS


def get_buildings() -> BuildingList:
    """Get list of all buildings."""
    buildings = _get_buildings()
    return BuildingList(buildings=buildings, total=len(buildings))


def get_building(building_id: str) -> Optional[Building]:
    """Get a single building by ID."""
    for b in _get_buildings():
        if b.id == building_id:
            return b
    return None


def _get_block_from_building_id(building_id: str) -> str:
    """Extract block letter from building ID."""
    # pleiades-a -> a, pleiades-b -> b, pleiades-c -> c
    if building_id.endswith("-a"):
        return "a"
    elif building_id.endswith("-b"):
        return "b"
    elif building_id.endswith("-c"):
        return "c"
    return "a"  # Default


def get_energy_data(
    building_id: str,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    resolution: str = "hourly",
) -> Optional[EnergyData]:
    """Get energy consumption data for a building."""
    building = get_building(building_id)
    if not building:
        return None

    now = _now()
    if not to_date:
        to_date = now
    if not from_date:
        from_date = now - timedelta(days=7)

    loader = _get_loader()
    block = _get_block_from_building_id(building_id)

    # Get real data from dataset
    energy_points = loader.get_energy_for_period(block, from_date, to_date, resolution)

    # If no real data available, generate based on patterns
    if not energy_points:
        # Fall back to pattern-based generation
        data_points = []
        current = from_date

        if resolution == "hourly":
            delta = timedelta(hours=1)
            base_consumption = building.area_sqm * 0.015
        elif resolution == "daily":
            delta = timedelta(days=1)
            base_consumption = building.area_sqm * 0.36
        else:
            delta = timedelta(days=30)
            base_consumption = building.area_sqm * 10.8

        while current <= to_date:
            hour = current.hour
            weekday = current.weekday()

            # University hours pattern (8-20, Mon-Fri)
            time_factor = 1.0
            if 8 <= hour <= 20 and weekday < 5:
                time_factor = 1.4
            elif weekday >= 5:
                time_factor = 0.5

            value = base_consumption * time_factor * random.uniform(0.9, 1.1)
            data_points.append(EnergyDataPoint(timestamp=current, value=round(value, 2)))
            current += delta
    else:
        data_points = [
            EnergyDataPoint(timestamp=p["timestamp"], value=p["value"])
            for p in energy_points
        ]

    if not data_points:
        return None

    total_energy = sum(dp.value for dp in data_points)

    # Typical university building breakdown
    breakdown = EnergyBreakdown(
        hvac=round(total_energy * 0.50, 2),  # HVAC dominant in Mediterranean climate
        lighting=round(total_energy * 0.22, 2),
        it_equipment=round(total_energy * 0.18, 2),
        other=round(total_energy * 0.10, 2),
        total=round(total_energy, 2),
    )

    # Spanish electricity costs
    cost_per_kwh = 0.15  # EUR (approximate Spanish rates)
    carbon_per_kwh = 0.25  # kg CO2 (Spanish grid is cleaner than average)

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
    """Get equipment list for a building."""
    building = get_building(building_id)
    if not building:
        return None

    # Generate equipment based on building size
    # PLEIAData contains HVAC device data
    loader = _get_loader()
    hvac_df = loader.load_hvac()

    equipment_list = []
    status_summary = {"running": 0, "warning": 0, "alarm": 0, "offline": 0}

    # Basic HVAC equipment for university building
    equipment_templates = [
        ("AHU-Main", EquipmentType.AHU, "Main Hall", 30.0),
        ("Split-AC-1", EquipmentType.AHU, "Floor 1", 3.5),
        ("Split-AC-2", EquipmentType.AHU, "Floor 2", 3.5),
        ("Heat-Pump-1", EquipmentType.HEAT_EXCHANGER, "Basement", 15.0),
        ("Fan-Coil-1", EquipmentType.FAN, "Lecture Hall", 2.5),
        ("Fan-Coil-2", EquipmentType.FAN, "Office Area", 2.5),
        ("Pump-1", EquipmentType.PUMP, "Mechanical Room", 5.0),
    ]

    # Scale equipment based on building floors
    for floor in range(1, min(building.floors + 1, 4)):
        equipment_templates.append(
            (f"VAV-F{floor}", EquipmentType.VAV, f"Floor {floor}", 2.0)
        )

    for i, (name, eq_type, location, power) in enumerate(equipment_templates):
        # Generate realistic status based on time of day
        hour = _now().hour
        is_operating_hours = 8 <= hour <= 20

        if is_operating_hours:
            status_weights = [
                (EquipmentStatus.RUNNING, 0.85),
                (EquipmentStatus.WARNING, 0.10),
                (EquipmentStatus.ALARM, 0.03),
                (EquipmentStatus.OFFLINE, 0.02),
            ]
        else:
            status_weights = [
                (EquipmentStatus.RUNNING, 0.30),
                (EquipmentStatus.WARNING, 0.05),
                (EquipmentStatus.ALARM, 0.02),
                (EquipmentStatus.OFFLINE, 0.63),
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
            power_kw=power * random.uniform(0.6, 1.0) if status == EquipmentStatus.RUNNING else 0,
            runtime_hours=random.uniform(2000, 15000),
        )
        equipment_list.append(eq)
        status_summary[status.value] += 1

    return EquipmentList(
        equipment=equipment_list,
        total=len(equipment_list),
        status_summary=status_summary,
    )


def get_alerts(building_id: str) -> Optional[AlertList]:
    """Get alerts for a building."""
    building = get_building(building_id)
    if not building:
        return None

    # Mediterranean climate specific alerts
    alert_templates = [
        (AlertSeverity.WARNING, "High Cooling Demand", "Outdoor temperature exceeds 35°C"),
        (AlertSeverity.WARNING, "Filter Status", "AHU filter differential pressure elevated"),
        (AlertSeverity.INFO, "Scheduled Maintenance", "Quarterly HVAC inspection scheduled"),
        (AlertSeverity.INFO, "Energy Report", "Weekly energy report available"),
        (AlertSeverity.CRITICAL, "Compressor Fault", "Split-AC-1 compressor overcurrent detected"),
        (AlertSeverity.WARNING, "CO2 Level High", "Lecture Hall CO2 exceeded 1000 ppm"),
    ]

    alerts = []
    by_severity = {"critical": 0, "warning": 0, "info": 0}

    for i, (severity, title, message) in enumerate(alert_templates[:random.randint(3, 6)]):
        status_choice = random.choices(
            [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED],
            weights=[0.4, 0.35, 0.25],
        )[0]

        created = _now() - timedelta(hours=random.randint(1, 48))
        acknowledged = created + timedelta(minutes=random.randint(5, 60)) if status_choice != AlertStatus.ACTIVE else None
        resolved = acknowledged + timedelta(hours=random.randint(1, 12)) if status_choice == AlertStatus.RESOLVED else None

        alert = Alert(
            id=f"alert-{building_id}-{i:03d}",
            building_id=building_id,
            equipment_id=f"{building_id}-Split-AC-1" if "Compressor" in title else None,
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
    """Get HVAC status for a building."""
    building = get_building(building_id)
    if not building:
        return None

    loader = _get_loader()
    block = _get_block_from_building_id(building_id)

    # Get real temperature and HVAC data
    base_temp = loader.get_temperature_for_time(block, _now())
    hvac_status = loader.get_hvac_status_for_time(block, _now())

    zones = []

    # Create zones based on building floors
    for floor in range(1, min(building.floors + 1, 6)):
        for zone_name in ["North", "South"]:
            # Add some variation per zone
            zone_temp = base_temp + random.uniform(-1.5, 1.5)

            # Use real HVAC setpoint and mode if available
            if hvac_status:
                setpoint = hvac_status.get("setpoint", 22.0)
                mode = hvac_status.get("mode", "auto")
            else:
                # Setpoint based on season (Murcia is hot in summer)
                month = _now().month
                if 6 <= month <= 9:  # Summer
                    setpoint = 24.0
                    mode = "cooling"
                elif month in [12, 1, 2]:  # Winter
                    setpoint = 21.0
                    mode = "heating"
                else:
                    setpoint = 22.0
                    mode = "auto"

            zone = HVACZone(
                id=f"{building_id}-floor{floor}-{zone_name.lower()}",
                name=f"Floor {floor} {zone_name}",
                floor=floor,
                current_temp=round(zone_temp, 1),
                setpoint=setpoint,
                humidity=round(50 + random.uniform(-15, 15), 1),  # Murcia can be dry
                occupancy=random.randint(0, 20),
                mode=mode if random.random() > 0.1 else "off",
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
        cooling_load_kw=round(building.area_sqm * 0.08 * random.uniform(0.3, 0.9), 1),
        heating_load_kw=round(building.area_sqm * 0.02 * random.uniform(0, 0.3), 1),
    )


def _calculate_pmv_ppd(temp: float, humidity: float, air_velocity: float = 0.1) -> tuple[float, float]:
    """
    Calculate PMV (Predicted Mean Vote) and PPD (Predicted Percentage Dissatisfied).

    Simplified ASHRAE 55 thermal comfort model.
    PMV scale: -3 (cold) to +3 (hot), 0 is neutral.
    PPD: percentage of people dissatisfied.

    Args:
        temp: Air temperature in Celsius
        humidity: Relative humidity %
        air_velocity: Air velocity in m/s (default 0.1 for typical office)

    Returns:
        Tuple of (PMV, PPD)
    """
    import math

    # Typical office conditions
    metabolic_rate = 1.2  # met (seated office work)
    clothing_insulation = 0.7  # clo (typical office attire)

    # Target neutral temperature (ASHRAE recommendation for offices)
    neutral_temp = 22.5

    # Simplified PMV calculation
    # PMV increases with temperature above neutral, decreases below
    temp_diff = temp - neutral_temp

    # Humidity effect (high humidity feels warmer)
    humidity_factor = (humidity - 50) * 0.01  # ±0.5 for extreme humidity

    # Air velocity effect (higher velocity feels cooler)
    velocity_factor = (0.1 - air_velocity) * 2  # Higher velocity = cooler

    # Combined PMV (simplified linear model)
    pmv = (temp_diff * 0.4) + humidity_factor + velocity_factor

    # Clamp PMV to [-3, 3]
    pmv = max(-3.0, min(3.0, pmv))

    # PPD calculation (ASHRAE formula)
    # PPD = 100 - 95 * exp(-0.03353*PMV^4 - 0.2179*PMV^2)
    ppd = 100 - 95 * math.exp(-0.03353 * (pmv ** 4) - 0.2179 * (pmv ** 2))

    return round(pmv, 2), round(ppd, 1)


def get_iaq_status(building_id: str) -> Optional[IAQStatus]:
    """Get Indoor Air Quality status for a building."""
    building = get_building(building_id)
    if not building:
        return None

    loader = _get_loader()

    # Get real CO2 data
    base_co2 = loader.get_co2_for_time(_now())

    zones = []
    zone_types = ["Lecture Hall", "Office", "Lab", "Library"]

    # Different base temperatures for different floors (heat rises)
    # Also different for different buildings
    building_temp_offset = {
        "pleiades-a": 0,      # Reference building
        "pleiades-b": 0.5,    # Slightly warmer
        "pleiades-c": -0.3,   # Slightly cooler
    }.get(building_id, 0)

    for floor in range(1, min(building.floors + 1, 4)):
        # Higher floors are typically warmer (heat rises)
        floor_temp_offset = (floor - 1) * 0.3

        for idx, zone_name in enumerate(zone_types[:2]):  # 2 zones per floor
            # Add variation per zone type
            zone_temp_offset = {
                "Lecture Hall": 0.8,   # More people = warmer
                "Office": 0.0,         # Standard
                "Lab": -0.5,           # AC typically stronger
                "Library": -0.2,       # Quieter, more AC
            }.get(zone_name, 0)

            # Calculate zone temperature
            base_temp = 22.5 + building_temp_offset + floor_temp_offset + zone_temp_offset
            temperature = base_temp + random.uniform(-0.5, 0.5)

            # Humidity varies by floor and zone
            humidity = 45 + (floor * 2) + random.uniform(-5, 5)
            humidity = max(30, min(70, humidity))  # Clamp to reasonable range

            # Calculate PMV and PPD based on actual temperature and humidity
            pmv, ppd = _calculate_pmv_ppd(temperature, humidity)

            # Add variation per zone for CO2
            co2 = base_co2 + random.uniform(-100, 200)

            # Higher floors typically have slightly lower PM2.5
            pm25 = random.uniform(8, 25) - (floor * 1.5)
            pm25 = max(5, pm25)  # Minimum PM2.5

            # Calculate AQI
            if co2 < 600 and pm25 < 12:
                aqi = random.randint(0, 50)
                level = "good"
            elif co2 < 800 and pm25 < 25:
                aqi = random.randint(51, 100)
                level = "moderate"
            elif co2 < 1000:
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
                tvoc=round(random.uniform(50, 200), 0),
                humidity=round(humidity, 1),
                temperature=round(temperature, 1),
                aqi_score=aqi,
                aqi_level=level,
                pmv=pmv,
                ppd=ppd,
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
    """Get KPIs for a building."""
    building = get_building(building_id)
    if not building:
        return None

    multipliers = {
        "today": 1,
        "week": 7,
        "month": 30,
        "year": 365,
    }
    mult = multipliers.get(period, 1)

    # Base daily values for university building in Mediterranean climate
    daily_energy = building.area_sqm * 0.30  # kWh/sqm/day (universities are lower)
    daily_cost = daily_energy * 0.15  # EUR
    daily_carbon = daily_energy * 0.25  # kg CO2

    energy = daily_energy * mult * random.uniform(0.85, 1.15)
    baseline_energy = energy * 1.18  # 18% improvement over baseline
    savings_kwh = baseline_energy - energy
    savings_percent = (savings_kwh / baseline_energy) * 100
    savings_usd = savings_kwh * 0.15

    equipment = get_equipment(building_id)
    alerts = get_alerts(building_id)

    return KPIs(
        building_id=building_id,
        period=period,
        energy_consumption_kwh=round(energy, 2),
        energy_cost_usd=round(energy * 0.15, 2),
        energy_savings_percent=round(savings_percent, 1),
        energy_savings_usd=round(savings_usd, 2),
        carbon_footprint_kg=round(energy * 0.25, 2),
        carbon_intensity=round((energy * 0.25) / building.area_sqm * 1000, 3),
        eui=round((daily_energy * 365) / building.area_sqm, 1),
        pue=None,  # Not a data center
        avg_temperature=round(23 + random.uniform(-1, 1), 1),
        avg_humidity=round(50 + random.uniform(-5, 5), 1),
        comfort_score=round(random.uniform(78, 92), 1),
        equipment_uptime_percent=round(
            equipment.status_summary["running"] / equipment.total * 100 if equipment else 90, 1
        ),
        active_alerts=sum(alerts.by_severity.values()) if alerts else 0,
        maintenance_due=random.randint(0, 3),
    )


# Setpoint management (in-memory state)
_zone_setpoints: dict[str, dict] = {}


def update_setpoint(
    building_id: str,
    zone_id: str,
    temperature: Optional[float],
    humidity: Optional[float],
    mode: Optional[str],
) -> dict:
    """Update setpoint for a zone."""
    global _zone_setpoints

    key = f"{building_id}:{zone_id}"
    if key not in _zone_setpoints:
        _zone_setpoints[key] = {"temperature": 22.0, "humidity": 50.0, "mode": "auto"}

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
