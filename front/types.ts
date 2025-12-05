
// Enums
export enum EquipmentStatus {
  RUNNING = 'Running',
  WARNING = 'Warning',
  ALARM = 'Alarm',
  OFFLINE = 'Offline'
}

export enum AlertSeverity {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

// Interfaces
export interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  unit: string;
  trend: number; // percentage change
  trendDirection: 'up' | 'down' | 'neutral';
}

export interface EnergyDataPoint {
  timestamp: string;
  hvac: number;
  lighting: number;
  equipment: number;
  total: number;
  predicted: number;
}

export interface Alert {
  id: string;
  timestamp: string;
  message: string;
  severity: AlertSeverity;
  source: string; // e.g., "AHU-01"
  acknowledged: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  status: EquipmentStatus;
  efficiency: number; // 0-100%
  lastMaintenance: string;
  temperature?: number;
  powerUsage?: number;
}

export interface RoomZone {
  id: string;
  name: string;
  currentTemp: number;
  setpointTemp: number;
  humidity: number;
  co2: number;
  occupancy: boolean;
  hvacMode: 'Cooling' | 'Heating' | 'Fan' | 'Off';
}

// IAQ & Thermal Comfort
export interface IAQMetric {
  zoneId: string;
  zoneName: string;
  co2: number; // ppm
  pm25: number; // µg/m³
  tvoc: number; // ppb
  humidity: number; // %
  aqi: number; // 0-500
  pmv: number; // Predicted Mean Vote (-3 to +3)
  ppd: number; // Predicted Percentage Dissatisfied (%)
  history: { time: string; aqi: number }[];
}

// Predictive Maintenance
export interface MaintenanceRecord {
  equipmentId: string;
  equipmentName: string;
  healthScore: number; // 0-100
  rulDays: number; // Remaining Useful Life
  nextScheduled: string;
  faults: Fault[];
}

export interface Fault {
  id: string;
  code: string;
  description: string;
  severity: AlertSeverity;
  detectedAt: string;
  recommendation: string;
}
