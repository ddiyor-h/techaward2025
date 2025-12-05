/**
 * Hooks for Simulation API
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '../api/client';

// Types
export interface Scenario {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: string;
  estimated_savings_percent: number;
  parameters: Record<string, unknown>;
}

export interface ScenarioResult {
  scenario_id: string;
  scenario_name: string;
  baseline_energy_kwh: number;
  scenario_energy_kwh: number;
  energy_savings_kwh: number;
  energy_savings_percent: number;
  cost_savings_eur: number;
  carbon_savings_kg: number;
  comfort_impact: number;
  baseline_timeline: TimelinePoint[];
  scenario_timeline: TimelinePoint[];
  recommendations: string[];
}

export interface TimelinePoint {
  timestamp: string;
  temperature: number;
  energy_cumulative: number;
  hvac_power: number;
  comfort_violation: number;
}

export interface MPCResult {
  optimal_setpoints: number[];
  predicted_temps: number[];
  predicted_power: number[];
  predicted_energy: number[];
  total_energy_kwh: number;
  total_cost_eur: number;
  baseline_cost_eur: number;
  cost_savings_percent: number;
  comfort_score: number;
  optimization_status: string;
  solve_time_ms: number;
  schedule: MPCScheduleItem[];
}

export interface MPCScheduleItem {
  hour: number;
  timestamp: string;
  setpoint: number;
  predicted_temp: number;
  predicted_power_kw: number;
  electricity_price: number;
  occupancy: number;
  outdoor_temp: number;
}

export interface ForecastResult {
  timestamps: string[];
  predicted_kwh: number[];
  confidence_lower: number[];
  confidence_upper: number[];
  total_predicted_kwh: number;
  avg_hourly_kwh: number;
  peak_hour: number;
  peak_kwh: number;
  model_type: string;
  model_accuracy_r2: number;
  feature_importance: Record<string, number>;
}

export interface ROIResult {
  annual_energy_cost_eur: number;
  annual_savings_eur: number;
  net_annual_savings_eur: number;
  payback_months: number;
  payback_years: number;
  npv_5_years_eur: number;
  irr_percent: number;
  '5_year_total_savings_eur': number;
  carbon_reduction_tons: number;
}

// Hook for scenarios list
export function useScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScenarios() {
      try {
        const data = await fetchAPI<{ scenarios: Scenario[] }>('/api/v1/simulation/scenarios');
        setScenarios(data.scenarios);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load scenarios');
      } finally {
        setLoading(false);
      }
    }
    fetchScenarios();
  }, []);

  return { scenarios, loading, error };
}

// Hook for running a scenario
export function useRunScenario() {
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScenario = useCallback(async (
    buildingId: string,
    scenarioId: string,
    durationHours: number = 24
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAPI<ScenarioResult>('/api/v1/simulation/scenarios/run', {
        method: 'POST',
        body: JSON.stringify({
          building_id: buildingId,
          scenario_id: scenarioId,
          duration_hours: durationHours
        })
      });
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run scenario';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, runScenario };
}

// Hook for MPC optimization
export function useMPCOptimize() {
  const [result, setResult] = useState<MPCResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimize = useCallback(async (
    buildingId: string,
    currentTemp: number = 23,
    preferredSetpoint: number = 22,
    horizonHours: number = 24
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAPI<MPCResult>('/api/v1/simulation/mpc/optimize', {
        method: 'POST',
        body: JSON.stringify({
          building_id: buildingId,
          current_temp: currentTemp,
          preferred_setpoint: preferredSetpoint,
          horizon_hours: horizonHours
        })
      });
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run MPC';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, optimize };
}

// Hook for energy forecast
export function useForecast() {
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getForecast = useCallback(async (
    buildingId: string,
    horizonHours: number = 24
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAPI<ForecastResult>('/api/v1/simulation/forecast', {
        method: 'POST',
        body: JSON.stringify({
          building_id: buildingId,
          horizon_hours: horizonHours
        })
      });
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get forecast';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, getForecast };
}

// Hook for ROI calculation
export function useROICalculator() {
  const [result, setResult] = useState<ROIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (params: {
    annual_energy_kwh: number;
    energy_price_eur?: number;
    savings_percent?: number;
    implementation_cost_eur?: number;
    maintenance_cost_eur?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        annual_energy_kwh: params.annual_energy_kwh.toString(),
        ...(params.energy_price_eur && { energy_price_eur: params.energy_price_eur.toString() }),
        ...(params.savings_percent && { savings_percent: params.savings_percent.toString() }),
        ...(params.implementation_cost_eur && { implementation_cost_eur: params.implementation_cost_eur.toString() }),
        ...(params.maintenance_cost_eur && { maintenance_cost_eur: params.maintenance_cost_eur.toString() }),
      });

      const data = await fetchAPI<ROIResult>(`/api/v1/simulation/roi/calculate?${queryParams}`);
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate ROI';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, calculate };
}
