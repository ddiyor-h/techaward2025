
import React, { useState, useMemo } from 'react';
import { Thermometer, Wind, Activity, Power, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useBuildingContext } from '../context/BuildingContext';
import { useHvac, useEquipment } from '../hooks/useApi';
import { Loading, ErrorDisplay } from '../components/Loading';
import type { HVACZone, Equipment } from '../api/types';

// Transform API zones to display format
function transformZones(zones: HVACZone[]) {
  return zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    currentTemp: zone.current_temp,
    setpointTemp: zone.setpoint,
    humidity: zone.humidity,
    co2: 450 + Math.floor(zone.occupancy * 50), // Estimate CO2 from occupancy
    occupancy: zone.occupancy > 0,
    hvacMode: zone.mode === 'cooling' ? 'Cooling' :
              zone.mode === 'heating' ? 'Heating' :
              zone.mode === 'auto' ? 'Auto' : 'Off' as const,
  }));
}

// Transform API equipment to display format
function transformEquipment(equipment: Equipment[]) {
  return equipment.map((eq) => ({
    id: eq.id,
    name: eq.name,
    type: eq.type,
    status: eq.status === 'running' ? 'Running' :
            eq.status === 'warning' ? 'Warning' :
            eq.status === 'alarm' ? 'Alarm' : 'Offline' as const,
    efficiency: eq.health_score,
    lastMaintenance: eq.last_maintenance || 'N/A',
    powerUsage: eq.power_kw,
    temperature: undefined,
  }));
}

const HVAC: React.FC = () => {
  const { selectedBuildingId, loading: buildingLoading } = useBuildingContext();

  const { data: hvacData, loading: hvacLoading, error: hvacError } = useHvac(selectedBuildingId);
  const { data: equipmentData, loading: equipmentLoading, error: equipmentError } = useEquipment(selectedBuildingId);

  const zones = useMemo(() => {
    if (!hvacData?.zones) return [];
    return transformZones(hvacData.zones);
  }, [hvacData]);

  const equipment = useMemo(() => {
    if (!equipmentData?.equipment) return [];
    return transformEquipment(equipmentData.equipment);
  }, [equipmentData]);

  const [selectedZone, setSelectedZone] = useState<string>('');

  // Auto-select first zone when data loads
  React.useEffect(() => {
    if (zones.length > 0 && !selectedZone) {
      setSelectedZone(zones[0].id);
    }
  }, [zones, selectedZone]);

  const isLoading = buildingLoading || hvacLoading || equipmentLoading;
  const hasError = hvacError || equipmentError;

  if (isLoading) {
    return <Loading message="Loading HVAC data..." />;
  }

  if (hasError) {
    return <ErrorDisplay error={hasError} />;
  }

  const currentZone = zones.find(z => z.id === selectedZone) || zones[0];

  return (
    <div className="space-y-6">
      {/* Header Section - Mobile Optimized (Left Aligned Buttons) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">HVAC Systems</h1>
        </div>
        <div className="w-full md:w-auto flex justify-start md:justify-end mt-2 md:mt-0">
           <span className="px-3 py-1 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-500/20">AI Optimization Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Zone List */}
        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur rounded border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-900 dark:text-slate-200">Zones ({zones.length})</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50 overflow-y-auto max-h-[600px]">
            {zones.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No zones available</p>
            ) : (
              zones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className={clsx(
                    "p-4 cursor-pointer transition-all border-l-4",
                    selectedZone === zone.id
                      ? "bg-brand-50 border-brand-500 dark:bg-brand-500/10 dark:border-brand-500"
                      : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={clsx("font-medium", selectedZone === zone.id ? "text-brand-700 dark:text-brand-400" : "text-slate-900 dark:text-slate-200")}>{zone.name}</span>
                    <span className={clsx(
                      "text-xs px-2 py-0.5 rounded-full border",
                      zone.hvacMode === 'Off'
                        ? "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                        : "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                    )}>{zone.hvacMode}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Thermometer className="w-3 h-3" /> {zone.currentTemp.toFixed(1)}°C
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3" /> {zone.co2} ppm
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone Detail */}
        <div className="lg:col-span-2 space-y-6">

          {/* Main Control Panel */}
          {currentZone && (
            <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-6 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentZone.name}</h2>
                   <p className="text-slate-500 dark:text-slate-400 text-sm">Zone Status: {currentZone.hvacMode !== 'Off' ? 'Active' : 'Idle'}</p>
                 </div>
                 <button className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-500 transition-colors">
                   <Settings className="w-5 h-5" />
                 </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {/* Temp Control */}
                 <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
                   <span className="text-slate-500 dark:text-slate-400 text-sm mb-4">Temperature Setpoint</span>
                   <div className="relative w-32 h-32 flex items-center justify-center">
                      {/* Simplified Gauge */}
                      <div className="absolute inset-0 rounded-full border-[6px] border-slate-200 dark:border-slate-700"></div>
                      <div className="absolute inset-0 rounded-full border-[6px] border-brand-500 border-t-transparent border-l-transparent rotate-45"></div>
                      <div className="text-center z-10">
                        <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{currentZone.setpointTemp.toFixed(1)}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 block">°C</span>
                      </div>
                   </div>
                   <div className="flex gap-3 mt-6">
                     <button className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">-</button>
                     <button className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">+</button>
                   </div>
                 </div>

                 {/* Metrics */}
                 <div className="md:col-span-2 grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2 text-sm">
                        <Thermometer className="w-4 h-4 text-brand-500 dark:text-brand-400" /> Current Temp
                      </div>
                      <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{currentZone.currentTemp.toFixed(1)}°C</span>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2 text-sm">
                        <Wind className="w-4 h-4 text-teal-500 dark:text-teal-400" /> Air Flow
                      </div>
                      <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">450 CFM</span>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2 text-sm">
                        <Activity className="w-4 h-4 text-amber-500 dark:text-amber-400" /> CO2 Level
                      </div>
                      <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{currentZone.co2} ppm</span>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2 text-sm">
                        <Activity className="w-4 h-4 text-blue-500 dark:text-blue-400" /> Humidity
                      </div>
                      <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{currentZone.humidity.toFixed(0)}%</span>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {/* Equipment Status */}
          <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur rounded border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 dark:text-slate-200">Connected Equipment ({equipment.length})</h3>
             </div>
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                 <tr>
                   <th className="px-4 py-3">Name</th>
                   <th className="px-4 py-3">Type</th>
                   <th className="px-4 py-3">Status</th>
                   <th className="px-4 py-3">Health</th>
                   <th className="px-4 py-3 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                 {equipment.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                       No equipment data available
                     </td>
                   </tr>
                 ) : (
                   equipment.map((eq) => (
                     <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                       <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{eq.name}</td>
                       <td className="px-4 py-3 text-slate-500">{eq.type}</td>
                       <td className="px-4 py-3">
                         <span className={clsx(
                           "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border",
                           eq.status === 'Running' ? "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
                           eq.status === 'Warning' ? "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" :
                           eq.status === 'Alarm' ? "bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" :
                           "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600"
                         )}>
                           <span className={clsx("w-1.5 h-1.5 rounded-full",
                              eq.status === 'Running' ? "bg-emerald-500" :
                              eq.status === 'Warning' ? "bg-amber-500" :
                              eq.status === 'Alarm' ? "bg-red-500" : "bg-slate-400"
                           )}></span>
                           {eq.status}
                         </span>
                       </td>
                       <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{eq.efficiency.toFixed(0)}%</td>
                       <td className="px-4 py-3 text-right">
                         <button className="text-slate-400 hover:text-brand-500 transition-colors">
                           <Power className="w-4 h-4" />
                         </button>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HVAC;
