"""
Model Predictive Controller (MPC) for HVAC Optimization.

Implements a convex optimization approach to find optimal setpoint
schedules that minimize energy cost while maintaining comfort.

Features:
- Rolling horizon optimization (24h lookahead)
- Comfort constraints with soft violations
- Time-of-use electricity pricing
- Ramp rate limits for equipment protection
- Weather and occupancy forecast integration

Note: For MVP, uses simplified linear dynamics. Production would use
cvxpy with OSQP solver for full convex optimization.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Tuple, Dict, Any
import numpy as np
from datetime import datetime, timedelta

# Try to import cvxpy, fall back to numpy optimization if unavailable
try:
    import cvxpy as cp
    CVXPY_AVAILABLE = True
except ImportError:
    CVXPY_AVAILABLE = False


@dataclass
class MPCConfig:
    """MPC controller configuration."""

    # Horizon
    horizon_hours: int = 24          # Prediction horizon
    timestep_minutes: int = 60       # Control timestep

    # Comfort constraints
    comfort_band: float = 1.0        # +/- acceptable temp deviation [°C]
    min_temp: float = 19.0           # Hard minimum temperature [°C]
    max_temp: float = 26.0           # Hard maximum temperature [°C]

    # Objective weights
    energy_weight: float = 1.0       # Weight on energy cost
    comfort_weight: float = 10.0     # Weight on comfort violations
    ramp_weight: float = 0.1         # Weight on control changes

    # Equipment constraints
    max_heating_kw: float = 50.0     # Maximum heating power [kW]
    max_cooling_kw: float = 100.0    # Maximum cooling power [kW]
    ramp_limit_kw: float = 20.0      # Max power change per step [kW]

    # Efficiency
    COP_heat: float = 4.0
    COP_cool: float = 3.5


@dataclass
class MPCResult:
    """MPC optimization result."""

    # Optimal schedule
    optimal_setpoints: List[float]
    predicted_temps: List[float]
    predicted_power: List[float]      # Thermal power [kW]
    predicted_energy: List[float]     # Electrical energy [kWh]

    # Summary
    total_energy_kwh: float
    total_cost_eur: float
    baseline_energy_kwh: float
    baseline_cost_eur: float
    cost_savings_percent: float
    comfort_score: float

    # Metadata
    optimization_status: str
    solve_time_ms: float
    horizon_hours: int

    # Schedule for display
    schedule: List[Dict[str, Any]]


class MPCController:
    """
    Model Predictive Controller for building HVAC optimization.

    Uses a simplified linear thermal model for convex optimization.
    Finds optimal setpoint schedule minimizing:
        J = energy_cost + comfort_violations + control_changes
    """

    def __init__(self, config: Optional[MPCConfig] = None):
        self.config = config or MPCConfig()
        self._thermal_params = None

    def set_thermal_parameters(self,
                               C_i: float = 5e6,
                               R_iw: float = 0.002,
                               R_we: float = 0.001):
        """Set thermal model parameters for the optimizer."""
        self._thermal_params = {
            'C_i': C_i,
            'R_iw': R_iw,
            'R_we': R_we
        }

    def optimize(self,
                 current_temp: float,
                 weather_forecast: List[float],
                 occupancy_forecast: List[float],
                 electricity_prices: List[float],
                 preferred_setpoint: float = 22.0,
                 current_hour: int = 0) -> MPCResult:
        """
        Optimize setpoints over prediction horizon.

        Args:
            current_temp: Current indoor temperature [°C]
            weather_forecast: Outdoor temperature forecast [°C]
            occupancy_forecast: Number of occupants per hour
            electricity_prices: EUR/kWh per hour
            preferred_setpoint: Desired temperature [°C]
            current_hour: Hour of day (0-23)

        Returns:
            MPCResult with optimal schedule and predictions
        """
        import time
        start_time = time.time()

        N = min(len(weather_forecast), self.config.horizon_hours)

        # Convert to numpy arrays
        T_ext = np.array(weather_forecast[:N])
        occupancy = np.array(occupancy_forecast[:N])
        prices = np.array(electricity_prices[:N])

        if CVXPY_AVAILABLE:
            result = self._optimize_cvxpy(
                current_temp, T_ext, occupancy, prices,
                preferred_setpoint, current_hour, N
            )
        else:
            result = self._optimize_simple(
                current_temp, T_ext, occupancy, prices,
                preferred_setpoint, current_hour, N
            )

        solve_time = (time.time() - start_time) * 1000

        # Add metadata
        result.solve_time_ms = solve_time
        result.horizon_hours = N

        return result

    def _optimize_cvxpy(self,
                        current_temp: float,
                        T_ext: np.ndarray,
                        occupancy: np.ndarray,
                        prices: np.ndarray,
                        preferred_setpoint: float,
                        current_hour: int,
                        N: int) -> MPCResult:
        """
        Optimization using cvxpy (if available).
        """
        cfg = self.config
        dt = cfg.timestep_minutes * 60  # seconds

        # Simplified linear thermal model parameters
        tau = 5e6 * 0.002  # Time constant (C_i * R_iw)
        a = np.exp(-dt / tau)  # Decay factor
        b = 1 - a              # External influence
        c = 0.002 * b * 1000   # Control influence (scaled)

        # Decision variables
        T = cp.Variable(N + 1)  # Temperature trajectory
        Q = cp.Variable(N)       # HVAC power [kW]
        s = cp.Variable(N)       # Comfort slack

        # Objective: minimize cost + comfort violations
        energy_cost = prices @ cp.abs(Q) / cfg.COP_cool  # Electrical cost
        comfort_cost = cfg.comfort_weight * cp.sum(s)
        ramp_cost = cfg.ramp_weight * cp.sum_squares(cp.diff(Q))

        objective = cp.Minimize(energy_cost + comfort_cost + ramp_cost)

        # Constraints
        constraints = []

        # Initial condition
        constraints.append(T[0] == current_temp)

        # Simplified thermal dynamics
        for k in range(N):
            constraints.append(
                T[k+1] == a * T[k] + b * T_ext[k] + c * Q[k]
            )

        # Comfort bounds (soft with slack)
        for k in range(N):
            hour = (current_hour + k) % 24
            # Tighter comfort during occupied hours
            if occupancy[k] > 5:
                constraints.append(T[k] >= preferred_setpoint - cfg.comfort_band - s[k])
                constraints.append(T[k] <= preferred_setpoint + cfg.comfort_band + s[k])
            else:
                # Wider band when unoccupied
                constraints.append(T[k] >= cfg.min_temp - s[k])
                constraints.append(T[k] <= cfg.max_temp + s[k])
            constraints.append(s[k] >= 0)

        # Hard temperature limits
        constraints.append(T >= cfg.min_temp - 2)
        constraints.append(T <= cfg.max_temp + 2)

        # Power limits
        constraints.append(Q >= -cfg.max_cooling_kw)
        constraints.append(Q <= cfg.max_heating_kw)

        # Ramp rate limits
        for k in range(N - 1):
            constraints.append(Q[k+1] - Q[k] <= cfg.ramp_limit_kw)
            constraints.append(Q[k+1] - Q[k] >= -cfg.ramp_limit_kw)

        # Solve
        problem = cp.Problem(objective, constraints)
        try:
            problem.solve(solver=cp.OSQP, warm_start=True, verbose=False)
        except Exception:
            problem.solve(verbose=False)

        if problem.status not in ['optimal', 'optimal_inaccurate']:
            # Fallback to simple optimization
            return self._optimize_simple(
                current_temp, T_ext, occupancy, prices,
                preferred_setpoint, current_hour, N
            )

        # Extract results
        opt_temps = T.value.tolist()
        opt_power = Q.value.tolist()

        return self._build_result(
            opt_temps, opt_power, T_ext, occupancy, prices,
            preferred_setpoint, current_hour, N, problem.status
        )

    def _optimize_simple(self,
                         current_temp: float,
                         T_ext: np.ndarray,
                         occupancy: np.ndarray,
                         prices: np.ndarray,
                         preferred_setpoint: float,
                         current_hour: int,
                         N: int) -> MPCResult:
        """
        Simple rule-based optimization (fallback if cvxpy unavailable).

        Uses heuristics:
        1. Pre-cool/pre-heat before high-price periods
        2. Wider setback during unoccupied hours
        3. Track preferred setpoint when occupied
        """
        cfg = self.config

        opt_temps = [current_temp]
        opt_power = []
        opt_setpoints = []

        T_current = current_temp

        for k in range(N):
            hour = (current_hour + k) % 24
            is_occupied = occupancy[k] > 5
            is_high_price = prices[k] > np.mean(prices) * 1.2
            next_high_price = k < N-1 and prices[k+1] > np.mean(prices) * 1.2

            # Determine target setpoint
            if is_occupied:
                target = preferred_setpoint
            else:
                # Setback when unoccupied
                if T_ext[k] > 25:  # Cooling season
                    target = preferred_setpoint + 2
                else:  # Heating season
                    target = preferred_setpoint - 2

            # Pre-conditioning: cool/heat before high-price period
            if next_high_price and not is_high_price:
                if T_ext[k] > 25:
                    target -= 1.5  # Pre-cool
                else:
                    target += 1.5  # Pre-heat

            # During high price, allow drift
            if is_high_price and not is_occupied:
                if T_ext[k] > 25:
                    target += 1.5
                else:
                    target -= 1.5

            opt_setpoints.append(target)

            # Simple proportional control
            error = target - T_current
            if abs(error) > 0.5:
                if error > 0:  # Need heating
                    power = min(error * 10, cfg.max_heating_kw)
                else:  # Need cooling
                    power = max(error * 10, -cfg.max_cooling_kw)
            else:
                power = 0

            opt_power.append(power)

            # Simplified temperature update
            dt = 3600  # 1 hour
            tau = 10000  # Time constant
            decay = np.exp(-dt / tau)

            T_next = decay * T_current + (1-decay) * T_ext[k] + 0.0002 * power * dt
            T_current = np.clip(T_next, cfg.min_temp - 1, cfg.max_temp + 1)
            opt_temps.append(T_current)

        return self._build_result(
            opt_temps, opt_power, T_ext, occupancy, prices,
            preferred_setpoint, current_hour, N, "heuristic"
        )

    def _build_result(self,
                      opt_temps: List[float],
                      opt_power: List[float],
                      T_ext: np.ndarray,
                      occupancy: np.ndarray,
                      prices: np.ndarray,
                      preferred_setpoint: float,
                      current_hour: int,
                      N: int,
                      status: str) -> MPCResult:
        """Build MPCResult from optimization output."""
        cfg = self.config

        # Calculate electrical energy from thermal power
        opt_energy = []
        for Q in opt_power:
            if Q > 0:
                E = Q / cfg.COP_heat
            else:
                E = abs(Q) / cfg.COP_cool
            opt_energy.append(E)

        total_energy = sum(opt_energy)
        total_cost = sum(e * p for e, p in zip(opt_energy, prices))

        # Calculate baseline (constant setpoint, no optimization)
        baseline_energy = sum(abs(preferred_setpoint - t) * 5 / cfg.COP_cool
                              for t in T_ext)
        baseline_cost = baseline_energy * np.mean(prices)

        savings_percent = ((baseline_cost - total_cost) / baseline_cost * 100
                          if baseline_cost > 0 else 0)

        # Comfort score
        violations = sum(abs(t - preferred_setpoint) for t, o
                        in zip(opt_temps[:-1], occupancy) if o > 5)
        comfort_score = max(0, 100 - violations * 5)

        # Convert to setpoints
        opt_setpoints = self._temps_to_setpoints(opt_temps, opt_power, occupancy)

        # Build schedule for display
        schedule = []
        base_time = datetime.now().replace(minute=0, second=0, microsecond=0)
        for k in range(N):
            hour = (current_hour + k) % 24
            schedule.append({
                "hour": hour,
                "timestamp": (base_time + timedelta(hours=k)).isoformat(),
                "setpoint": round(opt_setpoints[k], 1),
                "predicted_temp": round(opt_temps[k], 1),
                "predicted_power_kw": round(opt_power[k], 1),
                "electricity_price": round(prices[k], 3),
                "occupancy": int(occupancy[k]),
                "outdoor_temp": round(T_ext[k], 1),
            })

        return MPCResult(
            optimal_setpoints=opt_setpoints,
            predicted_temps=[round(t, 2) for t in opt_temps],
            predicted_power=[round(p, 2) for p in opt_power],
            predicted_energy=[round(e, 2) for e in opt_energy],
            total_energy_kwh=round(total_energy, 2),
            total_cost_eur=round(total_cost, 2),
            baseline_energy_kwh=round(baseline_energy, 2),
            baseline_cost_eur=round(baseline_cost, 2),
            cost_savings_percent=round(savings_percent, 1),
            comfort_score=round(comfort_score, 1),
            optimization_status=status,
            solve_time_ms=0,  # Set by caller
            horizon_hours=N,
            schedule=schedule
        )

    def _temps_to_setpoints(self,
                            temps: List[float],
                            powers: List[float],
                            occupancy: np.ndarray) -> List[float]:
        """Convert temperature trajectory to setpoint schedule."""
        setpoints = []
        for i, (T, Q) in enumerate(zip(temps[:-1], powers)):
            # Setpoint is target that controller should track
            if Q > 5:  # Heating
                sp = T + 0.5
            elif Q < -5:  # Cooling
                sp = T - 0.5
            else:
                sp = T
            # Clamp to reasonable range
            sp = max(self.config.min_temp, min(self.config.max_temp, sp))
            setpoints.append(round(sp, 1))
        return setpoints

    def get_default_forecasts(self,
                              hours: int = 24,
                              current_hour: int = 0,
                              season: str = "summer") -> Dict[str, List[float]]:
        """
        Generate default forecasts for demo/testing.

        Returns realistic patterns for Murcia, Spain.
        """
        weather = []
        occupancy = []
        prices = []

        for h in range(hours):
            hour = (current_hour + h) % 24

            # Weather - sinusoidal daily pattern
            if season == "summer":
                base = 28
                amp = 8
            else:
                base = 15
                amp = 6
            temp = base + amp * np.sin((hour - 6) * np.pi / 12)
            weather.append(round(temp, 1))

            # Occupancy - office pattern
            if hour in range(8, 18):
                occ = 50
            elif hour in [7, 18, 19]:
                occ = 20
            else:
                occ = 0
            occupancy.append(occ)

            # Prices - TOU pattern (Spain)
            if hour in range(10, 14) or hour in range(18, 22):
                price = 0.25  # Peak
            elif hour in range(8, 10) or hour in range(14, 18) or hour in range(22, 24):
                price = 0.18  # Shoulder
            else:
                price = 0.10  # Off-peak
            prices.append(price)

        return {
            "weather": weather,
            "occupancy": occupancy,
            "prices": prices
        }


# Helper function for quick optimization
def quick_optimize(building_id: str,
                   current_temp: float = 23.0,
                   preferred_setpoint: float = 22.0) -> MPCResult:
    """
    Quick MPC optimization with default forecasts.

    For API endpoints that need fast results with minimal input.
    """
    controller = MPCController()
    current_hour = datetime.now().hour

    forecasts = controller.get_default_forecasts(
        hours=24,
        current_hour=current_hour,
        season="summer"
    )

    return controller.optimize(
        current_temp=current_temp,
        weather_forecast=forecasts["weather"],
        occupancy_forecast=forecasts["occupancy"],
        electricity_prices=forecasts["prices"],
        preferred_setpoint=preferred_setpoint,
        current_hour=current_hour
    )
