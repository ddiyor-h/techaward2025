"""
What-If Scenario Engine for Building Simulation.

Provides pre-configured and custom scenarios for analyzing
the impact of operational changes on energy consumption.

Scenario Types:
1. Setpoint Changes - Temperature adjustment impacts
2. Occupancy Patterns - WFH, weekends, holidays
3. Weather Forecast - Extreme weather simulation
4. Demand Response - Peak shaving during TOU pricing
5. Equipment Efficiency - COP degradation scenarios
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime, timedelta
from copy import deepcopy

from .thermal_model import (
    ThermalModel2R2C,
    SimulationInputs,
    SimulationResult,
    create_building_model
)


class ScenarioType(str, Enum):
    """Types of what-if scenarios."""
    SETPOINT_CHANGE = "setpoint_change"
    OCCUPANCY_PATTERN = "occupancy_pattern"
    WEATHER_FORECAST = "weather_forecast"
    DEMAND_RESPONSE = "demand_response"
    EQUIPMENT_EFFICIENCY = "equipment_efficiency"
    SCHEDULE_OPTIMIZATION = "schedule_optimization"


@dataclass
class ScenarioConfig:
    """Configuration for a what-if scenario."""
    id: str
    name: str
    description: str
    scenario_type: ScenarioType
    parameters: Dict[str, Any]
    icon: str = "settings"  # Lucide icon name
    estimated_savings_percent: float = 0.0  # Rough estimate for UI


@dataclass
class ScenarioComparison:
    """Results comparing baseline to scenario."""
    scenario_id: str
    scenario_name: str

    # Energy comparison
    baseline_energy_kwh: float
    scenario_energy_kwh: float
    energy_savings_kwh: float
    energy_savings_percent: float

    # Cost comparison
    baseline_cost_eur: float
    scenario_cost_eur: float
    cost_savings_eur: float

    # Environmental impact
    carbon_savings_kg: float

    # Comfort impact
    baseline_comfort_score: float
    scenario_comfort_score: float
    comfort_impact: float  # Positive = better, negative = worse

    # Time series for charts
    baseline_timeline: List[Dict[str, Any]]
    scenario_timeline: List[Dict[str, Any]]

    # AI recommendations
    recommendations: List[str]


# Preset scenarios
PRESET_SCENARIOS: List[ScenarioConfig] = [
    # Setpoint changes
    ScenarioConfig(
        id="setpoint-cooling-2c",
        name="Summer Cooling +2°C",
        description="Raise cooling setpoint by 2°C during peak hours (12:00-18:00). "
                    "Reduces cooling load with minimal comfort impact.",
        scenario_type=ScenarioType.SETPOINT_CHANGE,
        parameters={"delta_temp": 2.0, "hours": [12, 13, 14, 15, 16, 17]},
        icon="thermometer",
        estimated_savings_percent=15.0
    ),
    ScenarioConfig(
        id="setpoint-night-setback",
        name="Night Setback -3°C",
        description="Lower heating setpoint by 3°C from 22:00-06:00. "
                    "Significant savings during unoccupied hours.",
        scenario_type=ScenarioType.SETPOINT_CHANGE,
        parameters={"delta_temp": -3.0, "hours": [22, 23, 0, 1, 2, 3, 4, 5]},
        icon="moon",
        estimated_savings_percent=20.0
    ),
    ScenarioConfig(
        id="setpoint-wider-deadband",
        name="Wider Comfort Band (±2°C)",
        description="Expand acceptable temperature range to reduce HVAC cycling. "
                    "Allows natural temperature drift.",
        scenario_type=ScenarioType.SETPOINT_CHANGE,
        parameters={"deadband_expansion": 1.0},
        icon="sliders",
        estimated_savings_percent=10.0
    ),

    # Occupancy patterns
    ScenarioConfig(
        id="occupancy-wfh-50",
        name="50% Work From Home",
        description="Simulate hybrid work policy with 50% occupancy. "
                    "Reduces internal gains and allows setback.",
        scenario_type=ScenarioType.OCCUPANCY_PATTERN,
        parameters={"occupancy_factor": 0.5},
        icon="users",
        estimated_savings_percent=25.0
    ),
    ScenarioConfig(
        id="occupancy-weekend",
        name="Weekend Mode",
        description="Minimal occupancy (10%) for weekend operation. "
                    "Deep setback with pre-conditioning before Monday.",
        scenario_type=ScenarioType.OCCUPANCY_PATTERN,
        parameters={"occupancy_factor": 0.1, "pre_condition_hours": 2},
        icon="calendar",
        estimated_savings_percent=35.0
    ),
    ScenarioConfig(
        id="occupancy-holiday",
        name="Holiday Shutdown",
        description="Complete shutdown scenario for extended holidays. "
                    "Maintain minimum freeze protection only.",
        scenario_type=ScenarioType.OCCUPANCY_PATTERN,
        parameters={"occupancy_factor": 0.0, "min_temp": 15.0, "max_temp": 28.0},
        icon="plane",
        estimated_savings_percent=80.0
    ),

    # Weather scenarios
    ScenarioConfig(
        id="weather-heatwave",
        name="Heat Wave (+5°C)",
        description="Simulate extreme heat day. "
                    "Test cooling capacity and energy impact.",
        scenario_type=ScenarioType.WEATHER_FORECAST,
        parameters={"temp_delta": 5.0},
        icon="sun",
        estimated_savings_percent=-30.0  # Negative = increased usage
    ),
    ScenarioConfig(
        id="weather-coldsnap",
        name="Cold Snap (-5°C)",
        description="Simulate extreme cold day. "
                    "Test heating capacity and energy impact.",
        scenario_type=ScenarioType.WEATHER_FORECAST,
        parameters={"temp_delta": -5.0},
        icon="snowflake",
        estimated_savings_percent=-25.0
    ),
    ScenarioConfig(
        id="weather-mild",
        name="Mild Day (±0°C, Low Solar)",
        description="Ideal conditions with minimal HVAC needs. "
                    "Shows potential for natural ventilation.",
        scenario_type=ScenarioType.WEATHER_FORECAST,
        parameters={"temp_set": 22.0, "solar_factor": 0.3},
        icon="cloud",
        estimated_savings_percent=40.0
    ),

    # Demand response
    ScenarioConfig(
        id="dr-peak-shaving",
        name="Peak Shaving (14:00-18:00)",
        description="Reduce HVAC load 30% during TOU peak pricing. "
                    "Pre-cool before and coast through peak.",
        scenario_type=ScenarioType.DEMAND_RESPONSE,
        parameters={
            "reduction_percent": 30,
            "peak_hours": [14, 15, 16, 17],
            "pre_cool_hours": [12, 13],
            "pre_cool_delta": -2.0
        },
        icon="zap",
        estimated_savings_percent=20.0
    ),
    ScenarioConfig(
        id="dr-grid-signal",
        name="Grid Flexibility Event",
        description="Respond to grid operator demand reduction request. "
                    "Temporarily reduce consumption by 50%.",
        scenario_type=ScenarioType.DEMAND_RESPONSE,
        parameters={
            "reduction_percent": 50,
            "duration_hours": 2,
            "recovery_hours": 1
        },
        icon="radio-tower",
        estimated_savings_percent=15.0
    ),

    # Equipment efficiency
    ScenarioConfig(
        id="equipment-aged-cop",
        name="Aged Equipment (COP -20%)",
        description="Simulate equipment degradation. "
                    "Shows value of preventive maintenance.",
        scenario_type=ScenarioType.EQUIPMENT_EFFICIENCY,
        parameters={"cop_reduction_percent": 20},
        icon="wrench",
        estimated_savings_percent=-25.0
    ),
    ScenarioConfig(
        id="equipment-upgrade",
        name="Equipment Upgrade (COP +30%)",
        description="Simulate high-efficiency equipment installation. "
                    "Calculate ROI for capital investment.",
        scenario_type=ScenarioType.EQUIPMENT_EFFICIENCY,
        parameters={"cop_increase_percent": 30},
        icon="trending-up",
        estimated_savings_percent=23.0
    ),
]


class ScenarioEngine:
    """
    Engine for running what-if scenarios.

    Compares baseline building operation against modified scenarios
    to quantify energy, cost, and comfort impacts.
    """

    # Economic constants
    ELECTRICITY_COST_EUR = 0.15      # EUR/kWh average
    PEAK_COST_EUR = 0.25             # EUR/kWh during peak
    CARBON_FACTOR = 0.25             # kg CO2/kWh (Spanish grid average)

    def __init__(self, thermal_model: Optional[ThermalModel2R2C] = None):
        self.thermal_model = thermal_model or ThermalModel2R2C()

        # Map scenario types to builders
        self._scenario_builders = {
            ScenarioType.SETPOINT_CHANGE: self._build_setpoint_scenario,
            ScenarioType.OCCUPANCY_PATTERN: self._build_occupancy_scenario,
            ScenarioType.WEATHER_FORECAST: self._build_weather_scenario,
            ScenarioType.DEMAND_RESPONSE: self._build_demand_response_scenario,
            ScenarioType.EQUIPMENT_EFFICIENCY: self._build_efficiency_scenario,
        }

    def get_available_scenarios(self) -> List[ScenarioConfig]:
        """Return list of pre-configured scenarios."""
        return PRESET_SCENARIOS

    def get_scenario_by_id(self, scenario_id: str) -> Optional[ScenarioConfig]:
        """Get a specific scenario by ID."""
        for s in PRESET_SCENARIOS:
            if s.id == scenario_id:
                return s
        return None

    def run_scenario(self,
                     config: ScenarioConfig,
                     building_id: str,
                     base_date: Optional[datetime] = None,
                     duration_hours: int = 24) -> ScenarioComparison:
        """
        Run a what-if scenario and compare to baseline.

        Args:
            config: Scenario configuration
            building_id: Building to simulate
            base_date: Start date (defaults to today)
            duration_hours: Simulation duration

        Returns:
            ScenarioComparison with energy/cost/comfort analysis
        """
        # Create building-specific model
        model = create_building_model(building_id)

        # Generate baseline inputs
        baseline_inputs = self._generate_baseline_inputs(
            building_id, base_date, duration_hours
        )

        # Build scenario-modified inputs
        builder = self._scenario_builders.get(config.scenario_type)
        if not builder:
            raise ValueError(f"Unknown scenario type: {config.scenario_type}")

        scenario_inputs, model_modified = builder(
            baseline_inputs, config.parameters, model
        )

        # Run both simulations
        baseline_result = model.simulate(baseline_inputs)
        scenario_result = model_modified.simulate(scenario_inputs)

        # Compare and generate recommendations
        return self._compare_results(
            baseline_result, scenario_result, config
        )

    def run_custom_scenario(self,
                            building_id: str,
                            scenario_type: ScenarioType,
                            parameters: Dict[str, Any],
                            duration_hours: int = 24) -> ScenarioComparison:
        """
        Run a custom scenario with user-defined parameters.
        """
        custom_config = ScenarioConfig(
            id="custom",
            name="Custom Scenario",
            description="User-defined scenario",
            scenario_type=scenario_type,
            parameters=parameters
        )
        return self.run_scenario(custom_config, building_id,
                                 duration_hours=duration_hours)

    def _generate_baseline_inputs(self,
                                  building_id: str,
                                  base_date: Optional[datetime],
                                  duration_hours: int) -> SimulationInputs:
        """
        Generate typical baseline simulation inputs.

        Uses realistic patterns for a Spanish office building.
        """
        if base_date is None:
            base_date = datetime.now().replace(hour=0, minute=0, second=0)

        n = duration_hours

        # Generate timestamps
        timestamps = np.array([
            (base_date + timedelta(hours=i)).timestamp()
            for i in range(n)
        ])

        # External temperature (Murcia, Spain pattern)
        hours = np.arange(n) % 24
        base_temp = 25.0  # Summer baseline
        T_ext = base_temp + 8 * np.sin((hours - 6) * np.pi / 12)
        T_ext = np.clip(T_ext, 15.0, 38.0)

        # Solar radiation (W/m2)
        solar = np.zeros(n)
        for i, h in enumerate(hours):
            if 6 <= h <= 20:
                solar[i] = 800 * np.sin((h - 6) * np.pi / 14)
        solar = np.clip(solar, 0, 1000)

        # Occupancy (office pattern)
        occupancy = np.zeros(n)
        for i, h in enumerate(hours):
            if 8 <= h <= 18:
                occupancy[i] = 50  # Peak occupancy
            elif 7 <= h <= 19:
                occupancy[i] = 20  # Partial

        # Setpoint (constant for baseline)
        setpoint = np.full(n, 23.0)

        # HVAC mode (auto)
        hvac_mode = np.full(n, 3)  # Auto mode

        # Electricity prices (TOU)
        prices = np.zeros(n)
        for i, h in enumerate(hours):
            if 14 <= h <= 18:
                prices[i] = self.PEAK_COST_EUR
            else:
                prices[i] = self.ELECTRICITY_COST_EUR

        return SimulationInputs(
            timestamps=timestamps,
            T_ext=T_ext,
            solar_radiation=solar,
            occupancy=occupancy,
            setpoint=setpoint,
            hvac_mode=hvac_mode,
            initial_T_i=23.0,
            initial_T_w=23.0,
            electricity_price=prices
        )

    def _build_setpoint_scenario(self,
                                  baseline: SimulationInputs,
                                  params: Dict,
                                  model: ThermalModel2R2C) -> tuple:
        """Modify setpoints for specific hours."""
        scenario = self._copy_inputs(baseline)

        delta = params.get("delta_temp", 0)
        hours = params.get("hours", [])
        deadband = params.get("deadband_expansion", 0)

        new_setpoints = baseline.setpoint.copy()

        for i, ts in enumerate(baseline.timestamps):
            hour = int((ts / 3600) % 24)
            if hour in hours:
                new_setpoints[i] += delta
            if deadband > 0:
                # Alternate slightly for deadband expansion effect
                new_setpoints[i] += (deadband if i % 2 == 0 else -deadband) * 0.3

        scenario.setpoint = new_setpoints
        return scenario, model

    def _build_occupancy_scenario(self,
                                   baseline: SimulationInputs,
                                   params: Dict,
                                   model: ThermalModel2R2C) -> tuple:
        """Modify occupancy patterns."""
        scenario = self._copy_inputs(baseline)

        factor = params.get("occupancy_factor", 1.0)
        min_temp = params.get("min_temp", None)
        max_temp = params.get("max_temp", None)

        # Scale occupancy
        scenario.occupancy = baseline.occupancy * factor

        # Adjust setpoints based on reduced occupancy
        new_setpoints = baseline.setpoint.copy()
        for i, occ in enumerate(scenario.occupancy):
            if occ < 5:  # Very low occupancy
                if min_temp and max_temp:
                    # Wide band during unoccupied
                    hour = int((baseline.timestamps[i] / 3600) % 24)
                    if baseline.T_ext[i] > 25:
                        new_setpoints[i] = max_temp
                    else:
                        new_setpoints[i] = min_temp
                else:
                    # Moderate setback
                    if baseline.T_ext[i] > 25:
                        new_setpoints[i] += 2  # Allow warmer
                    else:
                        new_setpoints[i] -= 2  # Allow cooler

        scenario.setpoint = new_setpoints
        return scenario, model

    def _build_weather_scenario(self,
                                 baseline: SimulationInputs,
                                 params: Dict,
                                 model: ThermalModel2R2C) -> tuple:
        """Modify weather conditions."""
        scenario = self._copy_inputs(baseline)

        temp_delta = params.get("temp_delta", 0)
        temp_set = params.get("temp_set", None)
        solar_factor = params.get("solar_factor", 1.0)

        if temp_set is not None:
            scenario.T_ext = np.full_like(baseline.T_ext, temp_set)
        else:
            scenario.T_ext = baseline.T_ext + temp_delta

        scenario.solar_radiation = baseline.solar_radiation * solar_factor

        return scenario, model

    def _build_demand_response_scenario(self,
                                         baseline: SimulationInputs,
                                         params: Dict,
                                         model: ThermalModel2R2C) -> tuple:
        """Build demand response / peak shaving scenario."""
        scenario = self._copy_inputs(baseline)

        reduction = params.get("reduction_percent", 0) / 100
        peak_hours = params.get("peak_hours", [14, 15, 16, 17])
        pre_cool_hours = params.get("pre_cool_hours", [])
        pre_cool_delta = params.get("pre_cool_delta", -2.0)

        new_setpoints = baseline.setpoint.copy()

        for i, ts in enumerate(baseline.timestamps):
            hour = int((ts / 3600) % 24)

            if hour in pre_cool_hours:
                # Pre-cool before peak
                new_setpoints[i] += pre_cool_delta

            elif hour in peak_hours:
                # During peak, raise setpoint (for cooling) or lower (heating)
                if baseline.T_ext[i] > 25:  # Cooling season
                    new_setpoints[i] += 3 * reduction
                else:  # Heating season
                    new_setpoints[i] -= 3 * reduction

        scenario.setpoint = new_setpoints
        return scenario, model

    def _build_efficiency_scenario(self,
                                    baseline: SimulationInputs,
                                    params: Dict,
                                    model: ThermalModel2R2C) -> tuple:
        """Modify equipment efficiency (COP)."""
        scenario = self._copy_inputs(baseline)

        # Create modified model with different COP
        model_copy = create_building_model("pleiades-a")  # Base model

        cop_reduction = params.get("cop_reduction_percent", 0) / 100
        cop_increase = params.get("cop_increase_percent", 0) / 100

        if cop_reduction > 0:
            model_copy.params.COP_cool *= (1 - cop_reduction)
            model_copy.params.COP_heat *= (1 - cop_reduction)
        elif cop_increase > 0:
            model_copy.params.COP_cool *= (1 + cop_increase)
            model_copy.params.COP_heat *= (1 + cop_increase)

        return scenario, model_copy

    def _copy_inputs(self, inputs: SimulationInputs) -> SimulationInputs:
        """Create a deep copy of simulation inputs."""
        return SimulationInputs(
            timestamps=inputs.timestamps.copy(),
            T_ext=inputs.T_ext.copy(),
            solar_radiation=inputs.solar_radiation.copy(),
            occupancy=inputs.occupancy.copy(),
            setpoint=inputs.setpoint.copy(),
            hvac_mode=inputs.hvac_mode.copy(),
            initial_T_i=inputs.initial_T_i,
            initial_T_w=inputs.initial_T_w,
            electricity_price=inputs.electricity_price.copy() if inputs.electricity_price is not None else None
        )

    def _compare_results(self,
                         baseline: SimulationResult,
                         scenario: SimulationResult,
                         config: ScenarioConfig) -> ScenarioComparison:
        """Compare baseline and scenario results."""

        # Energy calculations
        energy_baseline = baseline.total_energy_kwh
        energy_scenario = scenario.total_energy_kwh
        energy_savings = energy_baseline - energy_scenario
        savings_percent = (energy_savings / energy_baseline * 100) if energy_baseline > 0 else 0

        # Cost calculations
        cost_baseline = baseline.total_cost_eur
        cost_scenario = scenario.total_cost_eur
        cost_savings = cost_baseline - cost_scenario

        # Carbon
        carbon_savings = energy_savings * self.CARBON_FACTOR

        # Comfort
        comfort_baseline = baseline.avg_comfort_score
        comfort_scenario = scenario.avg_comfort_score
        comfort_impact = comfort_scenario - comfort_baseline

        # Timeline data for charts
        baseline_timeline = self._format_timeline(baseline)
        scenario_timeline = self._format_timeline(scenario)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            baseline, scenario, config, savings_percent, comfort_impact
        )

        return ScenarioComparison(
            scenario_id=config.id,
            scenario_name=config.name,
            baseline_energy_kwh=round(energy_baseline, 2),
            scenario_energy_kwh=round(energy_scenario, 2),
            energy_savings_kwh=round(energy_savings, 2),
            energy_savings_percent=round(savings_percent, 1),
            baseline_cost_eur=round(cost_baseline, 2),
            scenario_cost_eur=round(cost_scenario, 2),
            cost_savings_eur=round(cost_savings, 2),
            carbon_savings_kg=round(carbon_savings, 2),
            baseline_comfort_score=round(comfort_baseline, 1),
            scenario_comfort_score=round(comfort_scenario, 1),
            comfort_impact=round(comfort_impact, 1),
            baseline_timeline=baseline_timeline,
            scenario_timeline=scenario_timeline,
            recommendations=recommendations
        )

    def _format_timeline(self, result: SimulationResult) -> List[Dict]:
        """Format simulation result for chart display."""
        timeline = []
        for i, ts in enumerate(result.timestamps):
            if i >= len(result.T_internal):
                break
            timeline.append({
                "timestamp": ts,
                "temperature": result.T_internal[i],
                "energy_cumulative": result.energy_kwh[i] if i < len(result.energy_kwh) else 0,
                "hvac_power": result.Q_hvac[i-1] if i > 0 and i-1 < len(result.Q_hvac) else 0,
                "comfort_violation": result.comfort_violation[i-1] if i > 0 and i-1 < len(result.comfort_violation) else 0
            })
        return timeline

    def _generate_recommendations(self,
                                   baseline: SimulationResult,
                                   scenario: SimulationResult,
                                   config: ScenarioConfig,
                                   savings_percent: float,
                                   comfort_impact: float) -> List[str]:
        """Generate AI recommendations based on scenario results."""
        recommendations = []

        # High savings, minimal comfort impact - recommend
        if savings_percent > 10 and comfort_impact > -5:
            recommendations.append(
                f"This scenario shows {savings_percent:.0f}% energy savings "
                f"with minimal comfort impact. Recommend implementation."
            )

        # Good savings but comfort trade-off
        elif savings_percent > 5 and comfort_impact < -5:
            recommendations.append(
                f"Energy savings of {savings_percent:.0f}% available but "
                f"comfort score decreases by {abs(comfort_impact):.0f} points. "
                f"Consider partial implementation during unoccupied hours."
            )

        # Negative savings (stress test scenarios)
        if savings_percent < 0:
            recommendations.append(
                f"This scenario increases energy consumption by {abs(savings_percent):.0f}%. "
                f"Use for capacity planning and stress testing."
            )

        # Peak power insights
        if scenario.peak_power_kw > baseline.peak_power_kw * 1.2:
            recommendations.append(
                f"Peak demand increases from {baseline.peak_power_kw:.0f}kW to "
                f"{scenario.peak_power_kw:.0f}kW. Monitor utility demand charges."
            )
        elif scenario.peak_power_kw < baseline.peak_power_kw * 0.8:
            recommendations.append(
                f"Peak demand reduces by {(1 - scenario.peak_power_kw/baseline.peak_power_kw)*100:.0f}%. "
                f"Potential demand charge savings."
            )

        # Annual projection
        if savings_percent > 0:
            annual_savings = scenario.total_cost_eur * 365 * (savings_percent / 100)
            recommendations.append(
                f"Projected annual savings: €{annual_savings:,.0f} "
                f"({savings_percent:.0f}% of baseline)."
            )

        # Default if no specific recommendations
        if not recommendations:
            recommendations.append(
                "Run additional scenarios to compare options."
            )

        return recommendations
