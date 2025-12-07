
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-white tracking-tight">HVAC Systems</h1>
        </div>
        <div className="w-full md:w-auto flex justify-start md:justify-end mt-2 md:mt-0">
           <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/30">AI Optimization Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Zone List */}
        <div className="bg-black/30 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10 bg-black/20">
            <h3 className="font-semibold text-white">Zones ({zones.length})</h3>
          </div>
          <div className="divide-y divide-white/5 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-emerald-500/30 hover:scrollbar-thumb-emerald-500/50">
            {zones.length === 0 ? (
              <p className="text-sm text-white/50 text-center py-4">No zones available</p>
            ) : (
              zones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className={clsx(
                    "p-4 cursor-pointer transition-all border-l-4",
                    selectedZone === zone.id
                      ? "bg-emerald-500/10 border-emerald-500"
                      : "border-transparent hover:bg-white/5"
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={clsx("font-medium", selectedZone === zone.id ? "text-emerald-400" : "text-white")}>{zone.name}</span>
                    <span className={clsx(
                      "text-xs px-2 py-0.5 rounded-full border",
                      zone.hvacMode === 'Off'
                        ? "bg-white/5 text-white/40 border-white/10"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    )}>{zone.hvacMode}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-white/50">
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
            <div className="bg-black/30 backdrop-blur-md p-6 rounded-lg border border-white/10">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h2 className="text-xl font-bold text-white">{currentZone.name}</h2>
                   <p className="text-white/50 text-sm">Zone Status: {currentZone.hvacMode !== 'Off' ? 'Active' : 'Idle'}</p>
                 </div>
                 <button className="text-white/40 hover:text-emerald-400 transition-colors">
                   <Settings className="w-5 h-5" />
                 </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {/* Temp Control */}
                 <div className="flex flex-col items-center justify-center p-6 bg-black/20 rounded-lg border border-white/10">
                   <span className="text-white/50 text-sm mb-4">Temperature Setpoint</span>
                   <div className="relative w-32 h-32 flex items-center justify-center">
                      {/* Simplified Gauge */}
                      <div className="absolute inset-0 rounded-full border-[6px] border-white/10"></div>
                      <div className="absolute inset-0 rounded-full border-[6px] border-emerald-500 border-t-transparent border-l-transparent rotate-45"></div>
                      <div className="text-center z-10">
                        <span className="text-3xl font-bold text-white">{currentZone.setpointTemp.toFixed(1)}</span>
                        <span className="text-sm text-white/50 block">°C</span>
                      </div>
                   </div>
                   <div className="flex gap-3 mt-6">
                     <button className="w-8 h-8 rounded-full bg-black/30 border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-all">-</button>
                     <button className="w-8 h-8 rounded-full bg-black/30 border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-all">+</button>
                   </div>
                 </div>

                 {/* Metrics */}
                 <div className="md:col-span-2 grid grid-cols-2 gap-4">
                   <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 text-white/50 mb-2 text-sm">
                        <Thermometer className="w-4 h-4 text-emerald-400" /> Current Temp
                      </div>
                      <span className="text-2xl font-semibold text-white">{currentZone.currentTemp.toFixed(1)}°C</span>
                   </div>
                   <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 text-white/50 mb-2 text-sm">
                        <Wind className="w-4 h-4 text-teal-400" /> Air Flow
                      </div>
                      <span className="text-2xl font-semibold text-white">450 CFM</span>
                   </div>
                   <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 text-white/50 mb-2 text-sm">
                        <Activity className="w-4 h-4 text-amber-400" /> CO2 Level
                      </div>
                      <span className="text-2xl font-semibold text-white">{currentZone.co2} ppm</span>
                   </div>
                   <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 text-white/50 mb-2 text-sm">
                        <Activity className="w-4 h-4 text-blue-400" /> Humidity
                      </div>
                      <span className="text-2xl font-semibold text-white">{currentZone.humidity.toFixed(0)}%</span>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {/* Equipment Status */}
          <div className="bg-black/30 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
             <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-semibold text-white">Connected Equipment ({equipment.length})</h3>
             </div>
             <table className="w-full text-sm text-left">
               <thead className="bg-black/20 text-white/50 font-medium border-b border-white/10">
                 <tr>
                   <th className="px-4 py-3">Name</th>
                   <th className="px-4 py-3">Type</th>
                   <th className="px-4 py-3">Status</th>
                   <th className="px-4 py-3">Health</th>
                   <th className="px-4 py-3 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {equipment.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-4 py-8 text-center text-white/50">
                       No equipment data available
                     </td>
                   </tr>
                 ) : (
                   equipment.map((eq) => (
                     <tr key={eq.id} className="hover:bg-white/5 transition-colors">
                       <td className="px-4 py-3 font-medium text-white">{eq.name}</td>
                       <td className="px-4 py-3 text-white/50">{eq.type}</td>
                       <td className="px-4 py-3">
                         <span className={clsx(
                           "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border",
                           eq.status === 'Running' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                           eq.status === 'Warning' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                           eq.status === 'Alarm' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                           "bg-white/10 text-white/40 border-white/10"
                         )}>
                           <span className={clsx("w-1.5 h-1.5 rounded-full",
                              eq.status === 'Running' ? "bg-emerald-500" :
                              eq.status === 'Warning' ? "bg-amber-500" :
                              eq.status === 'Alarm' ? "bg-red-500" : "bg-white/40"
                           )}></span>
                           {eq.status}
                         </span>
                       </td>
                       <td className="px-4 py-3 text-white/70">{eq.efficiency.toFixed(0)}%</td>
                       <td className="px-4 py-3 text-right">
                         <button className="text-white/40 hover:text-emerald-400 transition-colors">
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
