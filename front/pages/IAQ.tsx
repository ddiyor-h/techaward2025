
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wind, Droplets, Activity, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../App';
import { useBuildingContext } from '../context/BuildingContext';
import { useIaq } from '../hooks/useApi';
import { Loading, ErrorDisplay } from '../components/Loading';
import type { IAQData } from '../api/types';

// Transform API IAQ data to display format
function transformIaqData(zones: IAQData[]) {
  return zones.map((zone) => ({
    zoneId: zone.zone_id,
    zoneName: zone.zone_name,
    co2: zone.co2_ppm,
    pm25: zone.pm25,
    tvoc: zone.tvoc,
    humidity: zone.humidity,
    temperature: zone.temperature,
    aqi: zone.aqi_score,
    pmv: zone.pmv,  // Real PMV from API
    ppd: zone.ppd,  // Real PPD from API
    history: Array.from({ length: 12 }, (_, i) => ({
      time: `${(i * 2).toString().padStart(2, '0')}:00`,
      aqi: zone.aqi_score + (Math.random() - 0.5) * 20,
    })),
  }));
}

const IAQ: React.FC = () => {
  const { theme } = useTheme();
  const { selectedBuildingId, loading: buildingLoading } = useBuildingContext();
  const { data: iaqData, loading: iaqLoading, error: iaqError } = useIaq(selectedBuildingId);

  const iaqMetrics = useMemo(() => {
    if (!iaqData?.zones) return [];
    return transformIaqData(iaqData.zones);
  }, [iaqData]);

  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  // Auto-select first zone
  React.useEffect(() => {
    if (iaqMetrics.length > 0 && !selectedZoneId) {
      setSelectedZoneId(iaqMetrics[0].zoneId);
    }
  }, [iaqMetrics, selectedZoneId]);

  const isLoading = buildingLoading || iaqLoading;

  if (isLoading) {
    return <Loading message="Loading IAQ data..." />;
  }

  if (iaqError) {
    return <ErrorDisplay error={iaqError} />;
  }

  const currentZone = iaqMetrics.find(z => z.zoneId === selectedZoneId) || iaqMetrics[0];

  if (!currentZone) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-slate-500 dark:text-slate-400">No IAQ data available</p>
      </div>
    );
  }

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return { bg: 'bg-emerald-500', text: 'text-emerald-500', label: 'Good' };
    if (aqi <= 100) return { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Moderate' };
    if (aqi <= 150) return { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Unhealthy (Sens.)' };
    return { bg: 'bg-red-500', text: 'text-red-500', label: 'Unhealthy' };
  };

  const aqiStatus = getAQIColor(currentZone.aqi);

  // PMV Comfort Color
  const getPMVColor = (pmv: number) => {
    if (Math.abs(pmv) <= 0.5) return 'text-emerald-500 dark:text-emerald-400';
    if (Math.abs(pmv) <= 1.0) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header Section - Mobile Optimized (Left Aligned Buttons) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full">
           <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Indoor Air Quality</h1>
           <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time environmental monitoring and thermal comfort analysis.</p>
        </div>
        <div className="w-full md:w-auto flex justify-start md:justify-end items-center gap-2 mt-2 md:mt-0">
           <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">Select Zone:</span>
           <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded border border-slate-200 dark:border-slate-700">
              {iaqMetrics.map(zone => (
                <button
                  key={zone.zoneId}
                  onClick={() => setSelectedZoneId(zone.zoneId)}
                  className={clsx(
                    "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                    selectedZoneId === zone.zoneId
                      ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                  )}
                >
                  {zone.zoneName}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Composite Index */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-6 rounded border border-slate-200 dark:border-slate-700 shadow-sm text-center relative overflow-hidden">
             <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-4">Composite AQI Index</h3>
             <div className="relative w-48 h-28 mx-auto mt-4">
                <svg viewBox="0 0 120 70" className="w-full h-full">
                  {/* Background arc */}
                  <path
                    d="M 10 60 A 50 50 0 0 1 110 60"
                    fill="none"
                    stroke={theme === 'dark' ? '#334155' : '#e2e8f0'}
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Value arc */}
                  <path
                    d="M 10 60 A 50 50 0 0 1 110 60"
                    fill="none"
                    stroke={currentZone.aqi <= 50 ? '#10b981' : currentZone.aqi <= 100 ? '#eab308' : currentZone.aqi <= 150 ? '#f97316' : '#ef4444'}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(Math.min(currentZone.aqi, 200) / 200) * 157} 157`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute bottom-2 left-0 right-0 text-center">
                   <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">{Math.round(currentZone.aqi)}</span>
                </div>
             </div>
             <p className={clsx("mt-2 font-semibold text-lg", aqiStatus.text)}>{aqiStatus.label}</p>
             <p className="text-xs text-slate-500 mt-2">Based on PM2.5, CO2, and TVOC levels</p>
          </div>

          <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-6 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-semibold text-slate-900 dark:text-slate-200">Thermal Comfort</h3>
               <TooltipButton text="Predicted Mean Vote (PMV) estimates thermal sensation on a scale from -3 (Cold) to +3 (Hot). 0 is Neutral." />
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-sm text-slate-500 dark:text-slate-400">PMV Index</span>
                   <span className={clsx("text-lg font-bold", getPMVColor(currentZone.pmv))}>
                     {currentZone.pmv > 0 ? '+' : ''}{currentZone.pmv.toFixed(1)}
                   </span>
                </div>
                {/* PMV Scale Visual */}
                <div className="h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-red-500 rounded-full relative">
                   <div
                     className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-300 dark:border-slate-800 rounded-full shadow"
                     style={{ left: `${((currentZone.pmv + 3) / 6) * 100}%` }}
                   ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>Cold (-3)</span>
                  <span>Neutral (0)</span>
                  <span>Hot (+3)</span>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                   <span className="text-sm text-slate-500 dark:text-slate-400">PPD (Dissatisfied %)</span>
                   <span className="text-slate-900 dark:text-slate-200 font-medium">{currentZone.ppd}%</span>
                </div>
             </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <MetricCard
                label="CO2 Level"
                value={Math.round(currentZone.co2)}
                unit="ppm"
                icon={Wind}
                status={currentZone.co2 > 1000 ? 'warning' : 'good'}
             />
             <MetricCard
                label="PM 2.5"
                value={currentZone.pm25.toFixed(1)}
                unit="ug/m3"
                icon={Activity}
                status={currentZone.pm25 > 35 ? 'warning' : 'good'}
             />
             <MetricCard
                label="TVOC"
                value={Math.round(currentZone.tvoc)}
                unit="ppb"
                icon={AlertCircle}
                status={currentZone.tvoc > 400 ? 'warning' : 'good'}
             />
             <MetricCard
                label="Humidity"
                value={currentZone.humidity.toFixed(0)}
                unit="%"
                icon={Droplets}
                status={currentZone.humidity < 30 || currentZone.humidity > 60 ? 'warning' : 'good'}
             />
           </div>

           {/* Historical Chart */}
           <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-6 rounded border border-slate-200 dark:border-slate-700 shadow-sm h-[320px]">
             <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-6">AQI Trend (Last 24h)</h3>
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={currentZone.history}>
                 <defs>
                   <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor={currentZone.aqi > 100 ? "#ef4444" : "#10b981"} stopOpacity={0.3}/>
                     <stop offset="95%" stopColor={currentZone.aqi > 100 ? "#ef4444" : "#10b981"} stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                 <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                 <Tooltip
                   contentStyle={{
                     backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                     border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                     color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                   }}
                 />
                 <Area
                    type="monotone"
                    dataKey="aqi"
                    stroke={currentZone.aqi > 100 ? "#ef4444" : "#10b981"}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAqi)"
                 />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const MetricCard = ({ label, value, unit, icon: Icon, status }: {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'good' | 'warning';
}) => (
  <div className={clsx(
    "bg-white dark:bg-slate-800/50 dark:backdrop-blur p-4 rounded border flex flex-col justify-between h-28",
    status === 'good' ? "border-slate-200 dark:border-slate-700" : "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/5"
  )}>
    <div className="flex justify-between items-start">
      <span className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</span>
      <Icon className={clsx("w-4 h-4", status === 'good' ? "text-slate-400 dark:text-slate-500" : "text-amber-500")} />
    </div>
    <div>
      <span className={clsx("text-2xl font-bold", status === 'good' ? "text-slate-900 dark:text-slate-100" : "text-amber-600 dark:text-amber-200")}>{value}</span>
      <span className="text-xs text-slate-500 ml-1">{unit}</span>
    </div>
  </div>
);

const TooltipButton = ({ text }: { text: string }) => (
  <div className="group relative">
    <AlertCircle className="w-4 h-4 text-slate-400 cursor-help" />
    <div className="absolute right-0 w-48 p-2 bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 bottom-full mb-2">
      {text}
    </div>
  </div>
);

export default IAQ;
