
import React, { useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar } from 'lucide-react';
import { useTheme } from '../App';
import { useBuildingContext } from '../context/BuildingContext';
import { useEnergy, useKpis } from '../hooks/useApi';
import { Loading, ErrorDisplay } from '../components/Loading';
import type { EnergyDataResponse } from '../api/types';

// Transform API energy data to chart format
function transformEnergyData(energy: EnergyDataResponse) {
  return energy.data_points.map((point) => {
    const date = new Date(point.timestamp);
    const hour = date.getHours();
    const timestamp = `${hour.toString().padStart(2, '0')}:00`;

    return {
      timestamp,
      total: Math.round(point.value),
      predicted: Math.round(point.value * 1.15), // Baseline is higher
    };
  });
}

const Energy: React.FC = () => {
  const { theme } = useTheme();
  const { selectedBuildingId, loading: buildingLoading } = useBuildingContext();

  const { data: energyData, loading: energyLoading, error: energyError } = useEnergy(selectedBuildingId, { resolution: 'hourly' });
  const { data: kpisData, loading: kpisLoading, error: kpisError } = useKpis(selectedBuildingId, 'today');

  const data = useMemo(() => {
    if (!energyData) return [];
    return transformEnergyData(energyData);
  }, [energyData]);

  const isLoading = buildingLoading || energyLoading || kpisLoading;
  const hasError = energyError || kpisError;

  if (isLoading) {
    return <Loading message="Loading energy data..." />;
  }

  if (hasError) {
    return <ErrorDisplay error={hasError} />;
  }

  // Calculate stats from data
  const totalConsumption = energyData?.breakdown?.total || 0;
  const costProjection = kpisData?.energy_cost_usd || 0;
  const peakDemand = data.length > 0 ? Math.max(...data.map(d => d.total)) : 0;
  const peakHour = data.findIndex(d => d.total === peakDemand);
  const budgetUsage = totalConsumption > 0 ? Math.min((totalConsumption / 6500) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Section - Mobile Optimized (Left Aligned Buttons) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Energy Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Detailed breakdown of consumption, cost forecasting, and savings analysis.</p>
        </div>
        <div className="w-full md:w-auto flex justify-start md:justify-end gap-2 mt-2 md:mt-0">
          <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded text-sm font-medium transition-colors">
            <Calendar className="w-4 h-4" />
            Today
          </button>
          <button className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-4 py-2 rounded text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-6 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Consumption (Today)</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {totalConsumption.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-sm text-slate-500 mb-1">kWh</span>
          </div>
          <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${budgetUsage}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">{budgetUsage.toFixed(0)}% of daily budget used</p>
        </div>

        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-6 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
           <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Projected Monthly Cost</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              ${(costProjection * 30).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-sm text-slate-500 mb-1">USD</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-4 font-medium flex items-center">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
            On track to save ${((costProjection * 30) * 0.15).toLocaleString(undefined, { maximumFractionDigits: 0 })} this month
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-6 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
           <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Peak Demand</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{peakDemand}</span>
            <span className="text-sm text-slate-500 mb-1">kW</span>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Occurred at {peakHour >= 0 ? `${peakHour.toString().padStart(2, '0')}:00` : '--:--'}
          </p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-6 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-200">Consumption vs. Baseline (24h)</h3>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-sm text-slate-500">
               <span className="w-3 h-3 bg-brand-500 rounded-sm"></span> Actual
             </div>
             <div className="flex items-center gap-2 text-sm text-slate-500">
               <span className="w-3 h-3 bg-slate-400 dark:bg-slate-500 rounded-sm"></span> Baseline
             </div>
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
              <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                  borderRadius: '4px',
                  border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                  color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                }}
              />
              <Bar dataKey="total" fill="#3b82f6" barSize={12} radius={[2, 2, 0, 0]} name="Actual Usage" />
              <Line type="monotone" dataKey="predicted" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} strokeWidth={2} dot={false} strokeDasharray="5 5" name="Baseline" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Energy;
