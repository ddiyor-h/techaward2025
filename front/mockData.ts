
import { Alert, AlertSeverity, EnergyDataPoint, Equipment, EquipmentStatus, KPIMetric, RoomZone, IAQMetric, MaintenanceRecord } from './types';

// KPI Metrics
export const kpiMetrics: KPIMetric[] = [
  { id: '1', label: 'Energy Consumption', value: '1,240', unit: 'kWh', trend: -12.5, trendDirection: 'down' },
  { id: '2', label: 'Carbon Footprint', value: '0.42', unit: 'tCO2e', trend: -8.2, trendDirection: 'down' },
  { id: '3', label: 'Current EUI', value: '145', unit: 'kWh/m²', trend: -2.1, trendDirection: 'down' },
  { id: '4', label: 'Active Alerts', value: '3', unit: 'Count', trend: 50, trendDirection: 'up' },
];

// Energy Chart Data (24 hours)
export const generateEnergyData = (): EnergyDataPoint[] => {
  const data: EnergyDataPoint[] = [];
  for (let i = 0; i < 24; i++) {
    const time = `${i.toString().padStart(2, '0')}:00`;
    // Simulate typical building curve
    const baseLoad = 50;
    const peakMultiplier = (i > 7 && i < 19) ? 2.5 : 1.2; 
    const randomVar = Math.random() * 20;
    
    const hvac = Math.floor(baseLoad * peakMultiplier * 0.6 + randomVar);
    const lighting = Math.floor(baseLoad * peakMultiplier * 0.2 + (i > 8 && i < 18 ? 30 : 5));
    const equipment = Math.floor(baseLoad * peakMultiplier * 0.2 + 10);
    
    data.push({
      timestamp: time,
      hvac,
      lighting,
      equipment,
      total: hvac + lighting + equipment,
      predicted: (hvac + lighting + equipment) * 0.85 // Simulating the 15% savings promise
    });
  }
  return data;
};

// Alerts
export const mockAlerts: Alert[] = [
  { id: 'a1', timestamp: '10:42 AM', message: 'Chiller-02 High Pressure detected', severity: AlertSeverity.CRITICAL, source: 'HVAC System', acknowledged: false },
  { id: 'a2', timestamp: '09:15 AM', message: 'Zone 4-B CO2 levels exceeding threshold', severity: AlertSeverity.HIGH, source: 'IAQ Monitor', acknowledged: false },
  { id: 'a3', timestamp: '08:30 AM', message: 'AHU-01 Filter replacement due soon', severity: AlertSeverity.MEDIUM, source: 'Maintenance', acknowledged: true },
  { id: 'a4', timestamp: 'Yesterday', message: 'Unusual energy spike in Server Room', severity: AlertSeverity.LOW, source: 'Power Meter', acknowledged: true },
];

// Equipment List
export const mockEquipment: Equipment[] = [
  { id: 'e1', name: 'Chiller-01', type: 'Chiller', status: EquipmentStatus.RUNNING, efficiency: 94, lastMaintenance: '2023-10-15', powerUsage: 145.2 },
  { id: 'e2', name: 'Chiller-02', type: 'Chiller', status: EquipmentStatus.WARNING, efficiency: 78, lastMaintenance: '2023-08-20', powerUsage: 160.5 },
  { id: 'e3', name: 'AHU-Main', type: 'Air Handling Unit', status: EquipmentStatus.RUNNING, efficiency: 98, lastMaintenance: '2023-11-01', temperature: 22.5 },
  { id: 'e4', name: 'Boiler-A', type: 'Boiler', status: EquipmentStatus.OFFLINE, efficiency: 0, lastMaintenance: '2023-05-12' },
];

// Zones
export const mockZones: RoomZone[] = [
  { id: 'z1', name: 'Lobby', currentTemp: 22.5, setpointTemp: 22.0, humidity: 45, co2: 420, occupancy: true, hvacMode: 'Cooling' },
  { id: 'z2', name: 'Open Office A', currentTemp: 23.1, setpointTemp: 22.0, humidity: 48, co2: 850, occupancy: true, hvacMode: 'Cooling' },
  { id: 'z3', name: 'Meeting Room 1', currentTemp: 21.0, setpointTemp: 21.5, humidity: 40, co2: 500, occupancy: false, hvacMode: 'Off' },
  { id: 'z4', name: 'Cafeteria', currentTemp: 24.5, setpointTemp: 23.0, humidity: 55, co2: 600, occupancy: true, hvacMode: 'Cooling' },
];

// IAQ Mock Data
export const mockIAQMetrics: IAQMetric[] = [
  { 
    zoneId: 'z1', 
    zoneName: 'Lobby', 
    co2: 420, 
    pm25: 12, 
    tvoc: 150, 
    humidity: 45, 
    aqi: 45, 
    pmv: 0.2, 
    ppd: 6,
    history: Array.from({length: 12}, (_, i) => ({ time: `${i*2}:00`, aqi: 40 + Math.random() * 10 }))
  },
  { 
    zoneId: 'z2', 
    zoneName: 'Open Office A', 
    co2: 850, 
    pm25: 35, 
    tvoc: 300, 
    humidity: 48, 
    aqi: 85, 
    pmv: 0.8, 
    ppd: 18,
    history: Array.from({length: 12}, (_, i) => ({ time: `${i*2}:00`, aqi: 60 + Math.random() * 30 }))
  },
  { 
    zoneId: 'z4', 
    zoneName: 'Cafeteria', 
    co2: 600, 
    pm25: 22, 
    tvoc: 200, 
    humidity: 55, 
    aqi: 55, 
    pmv: 0.5, 
    ppd: 10,
    history: Array.from({length: 12}, (_, i) => ({ time: `${i*2}:00`, aqi: 50 + Math.random() * 15 }))
  },
];

// Maintenance Mock Data
export const mockMaintenanceRecords: MaintenanceRecord[] = [
  {
    equipmentId: 'e1',
    equipmentName: 'Chiller-01',
    healthScore: 92,
    rulDays: 1450,
    nextScheduled: '2024-04-15',
    faults: []
  },
  {
    equipmentId: 'e2',
    equipmentName: 'Chiller-02',
    healthScore: 65,
    rulDays: 120,
    nextScheduled: '2024-02-10',
    faults: [
      { id: 'f1', code: 'P-High', description: 'Compressor discharge pressure high', severity: AlertSeverity.HIGH, detectedAt: '2h ago', recommendation: 'Check condenser coils for blockage' },
      { id: 'f2', code: 'V-Warn', description: 'Vibration anomaly detected in motor', severity: AlertSeverity.MEDIUM, detectedAt: '5h ago', recommendation: 'Inspect mounting bolts' }
    ]
  },
  {
    equipmentId: 'e3',
    equipmentName: 'AHU-Main',
    healthScore: 88,
    rulDays: 365,
    nextScheduled: '2024-03-01',
    faults: [
      { id: 'f3', code: 'F-Perf', description: 'Filter efficiency degradation', severity: AlertSeverity.LOW, detectedAt: '1d ago', recommendation: 'Schedule filter replacement' }
    ]
  }
];
