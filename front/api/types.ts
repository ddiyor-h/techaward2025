/**
 * API Response Types - matching backend schemas
 */

// Building Types
export interface BuildingLocation {
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface Building {
  id: string;
  name: string;
  area_sqm: number;
  floors: number;
  location: BuildingLocation;
  year_built: number;
  building_type: string;
  occupancy_rate: number;
  created_at: string;
  updated_at: string;
}

export interface BuildingListResponse {
  buildings: Building[];
  total: number;
}

export type BuildingResponse = Building;

// Energy Types
export interface EnergyDataPoint {
  timestamp: string;
  value: number;
}

export interface EnergyBreakdown {
  hvac: number;
  lighting: number;
  it_equipment: number;
  other: number;
  total: number;
}

export interface EnergyDataResponse {
  building_id: string;
  period_start: string;
  period_end: string;
  resolution: string;
  data_points: EnergyDataPoint[];
  breakdown: EnergyBreakdown;
  cost_usd: number;
  carbon_kg: number;
}

// Equipment Types
export type EquipmentStatusType = 'running' | 'warning' | 'alarm' | 'offline';
export type EquipmentTypeEnum = 'AHU' | 'VAV' | 'Chiller' | 'Boiler' | 'Pump' | 'Fan' | 'Cooling Tower' | 'Heat Exchanger';

export interface Equipment {
  id: string;
  building_id: string;
  name: string;
  type: EquipmentTypeEnum;
  status: EquipmentStatusType;
  location: string;
  health_score: number;
  last_maintenance: string | null;
  next_maintenance: string | null;
  power_kw: number;
  runtime_hours: number;
}

export interface EquipmentListResponse {
  equipment: Equipment[];
  total: number;
  status_summary: Record<string, number>;
}

// Alert Types
export type AlertSeverityType = 'critical' | 'warning' | 'info';
export type AlertStatusType = 'active' | 'acknowledged' | 'resolved';

export interface Alert {
  id: string;
  building_id: string;
  equipment_id: string | null;
  severity: AlertSeverityType;
  status: AlertStatusType;
  title: string;
  message: string;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
}

export interface AlertListResponse {
  alerts: Alert[];
  total: number;
  by_severity: Record<string, number>;
}

// HVAC Types
export interface HVACZone {
  id: string;
  name: string;
  floor: number;
  current_temp: number;
  setpoint: number;
  humidity: number;
  occupancy: number;
  mode: 'cooling' | 'heating' | 'auto' | 'off';
}

export interface HVACStatusResponse {
  building_id: string;
  zones: HVACZone[];
  total_zones: number;
  avg_temperature: number;
  avg_humidity: number;
  cooling_load_kw: number;
  heating_load_kw: number;
}

// IAQ Types
export interface IAQData {
  zone_id: string;
  zone_name: string;
  co2_ppm: number;
  pm25: number;
  tvoc: number;
  humidity: number;
  temperature: number;
  aqi_score: number;
  aqi_level: string;
  timestamp: string;
}

export interface IAQStatusResponse {
  building_id: string;
  zones: IAQData[];
  avg_aqi: number;
  overall_level: string;
}

// KPIs Types
export interface KPIsResponse {
  building_id: string;
  period: string;
  energy_consumption_kwh: number;
  energy_cost_usd: number;
  energy_savings_percent: number;
  energy_savings_usd: number;
  carbon_footprint_kg: number;
  carbon_intensity: number;
  eui: number;
  pue: number | null;
  avg_temperature: number;
  avg_humidity: number;
  comfort_score: number;
  equipment_uptime_percent: number;
  active_alerts: number;
  maintenance_due: number;
}

// Setpoint Types
export interface SetpointUpdateRequest {
  zone_id: string;
  temperature?: number;
  humidity?: number;
  mode?: 'cooling' | 'heating' | 'auto' | 'off';
}

export interface SetpointResponse {
  success: boolean;
  zone_id: string;
  applied_settings: Record<string, unknown>;
  message: string;
}

// Report Types
export interface ReportIssue {
  id: string;
  type: 'equipment' | 'efficiency' | 'comfort' | 'anomaly';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  detected_at: string;
  status: 'open' | 'resolved';
  impact_kwh: number;
  recommendation: string;
}

export interface ReportOptimization {
  id: string;
  name: string;
  type: 'setpoint' | 'schedule' | 'equipment' | 'demand_response';
  applied_at: string;
  energy_impact_percent: number;
  cost_impact_eur: number;
  description: string;
  status: 'active' | 'inactive';
}

export interface ReportSummary {
  baseline_energy_kwh: number;
  actual_energy_kwh: number;
  energy_saved_kwh: number;
  energy_saved_percent: number;
  baseline_cost_eur: number;
  actual_cost_eur: number;
  cost_saved_eur: number;
  co2_baseline_kg: number;
  co2_actual_kg: number;
  co2_reduced_kg: number;
  comfort_score: number;
  issues_open: number;
  issues_resolved: number;
  optimizations_active: number;
}

export interface BuildingReport {
  building_id: string;
  building_name: string;
  building_info: {
    floor_area_m2: number;
    floors: number;
    location: string;
  };
  generated_at: string;
  period: {
    type: string;
    from: string;
    to: string;
    days: number;
  };
  detected_issues: ReportIssue[];
  optimizations_applied: ReportOptimization[];
  summary: ReportSummary;
  recommendations: string[];
}
