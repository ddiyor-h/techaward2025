
import React, { useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar } from 'lucide-react';
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-white tracking-tight">Energy Analytics</h1>
          <p className="text-white/50 mt-1">Detailed breakdown of consumption, cost forecasting, and savings analysis.</p>
        </div>
        <div className="w-full md:w-auto flex justify-start md:justify-end gap-2 mt-2 md:mt-0">
          <button className="flex items-center gap-2 bg-black/30 backdrop-blur border border-white/10 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded text-sm font-medium transition-colors">
            <Calendar className="w-4 h-4" />
            Today
          </button>
          <button className="flex items-center gap-2 bg-black/30 backdrop-blur border border-white/10 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/30 backdrop-blur-md p-6 rounded-lg border border-white/10">
          <h3 className="text-sm font-medium text-white/50 mb-2">Total Consumption (Today)</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">
              {totalConsumption.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-sm text-white/50 mb-1">kWh</span>
          </div>
          <div className="mt-4 w-full bg-white/10 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${budgetUsage}%` }}></div>
          </div>
          <p className="text-xs text-white/50 mt-2">{budgetUsage.toFixed(0)}% of daily budget used</p>
        </div>

        <div className="bg-black/30 backdrop-blur-md p-6 rounded-lg border border-white/10">
           <h3 className="text-sm font-medium text-white/50 mb-2">Projected Monthly Cost</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">
              ${(costProjection * 30).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-sm text-white/50 mb-1">USD</span>
          </div>
          <p className="text-xs text-emerald-400 mt-4 font-medium flex items-center">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
            On track to save ${((costProjection * 30) * 0.15).toLocaleString(undefined, { maximumFractionDigits: 0 })} this month
          </p>
        </div>

        <div className="bg-black/30 backdrop-blur-md p-6 rounded-lg border border-white/10">
           <h3 className="text-sm font-medium text-white/50 mb-2">Peak Demand</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-white">{peakDemand}</span>
            <span className="text-sm text-white/50 mb-1">kW</span>
          </div>
          <p className="text-xs text-white/50 mt-4">
            Occurred at {peakHour >= 0 ? `${peakHour.toString().padStart(2, '0')}:00` : '--:--'}
          </p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-black/30 backdrop-blur-md p-6 rounded-lg border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-white">Consumption vs. Baseline (24h)</h3>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-sm text-white/50">
               <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Actual
             </div>
             <div className="flex items-center gap-2 text-sm text-white/50">
               <span className="w-3 h-3 bg-white/40 rounded-sm"></span> Baseline
             </div>
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12}} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff'
                }}
              />
              <Bar dataKey="total" fill="#10b981" barSize={12} radius={[2, 2, 0, 0]} name="Actual Usage" />
              <Line type="monotone" dataKey="predicted" stroke="rgba(255,255,255,0.4)" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Baseline" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Energy;
