
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Zap, Wind, Droplets } from 'lucide-react';
import { clsx } from 'clsx';
import DigitalTwin3D from '../components/DigitalTwin3D';
import { Loading, ErrorDisplay } from '../components/Loading';
import { useTheme } from '../App';
import { useBuildingContext } from '../context/BuildingContext';
import { useKpis, useEnergy, useAlerts } from '../hooks/useApi';
import type { KPIsResponse, EnergyDataResponse, AlertListResponse } from '../api/types';

// Transform API KPIs to display format
function transformKpis(kpis: KPIsResponse) {
  return [
    {
      id: '1',
      label: 'Energy Consumption',
      value: kpis.energy_consumption_kwh.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      unit: 'kWh',
      trend: kpis.energy_savings_percent,
      trendDirection: kpis.energy_savings_percent > 0 ? 'down' : 'up' as const
    },
    {
      id: '2',
      label: 'Carbon Footprint',
      value: (kpis.carbon_footprint_kg / 1000).toFixed(2),
      unit: 'tCO2e',
      trend: kpis.carbon_intensity > 0 ? -5 : 0,
      trendDirection: 'down' as const
    },
    {
      id: '3',
      label: 'Current EUI',
      value: kpis.eui.toFixed(0),
      unit: 'kWh/m²',
      trend: 2.1,
      trendDirection: 'down' as const
    },
    {
      id: '4',
      label: 'Active Alerts',
      value: kpis.active_alerts.toString(),
      unit: 'Count',
      trend: kpis.active_alerts > 0 ? 50 : 0,
      trendDirection: kpis.active_alerts > 0 ? 'up' : 'down' as const
    },
  ];
}

// Transform API energy data to chart format
function transformEnergyData(energy: EnergyDataResponse) {
  return energy.data_points.map((point) => {
    const date = new Date(point.timestamp);
    const hour = date.getHours();
    const timestamp = `${hour.toString().padStart(2, '0')}:00`;

    // Distribute total energy into categories based on typical ratios
    const total = point.value;
    const hvac = total * 0.55;
    const lighting = total * 0.25;
    const equipment = total * 0.20;

    return {
      timestamp,
      hvac: Math.round(hvac),
      lighting: Math.round(lighting),
      equipment: Math.round(equipment),
      total: Math.round(total),
      predicted: Math.round(total * 0.85),
    };
  });
}

// Transform API alerts to display format
function transformAlerts(alertsData: AlertListResponse) {
  return alertsData.alerts.slice(0, 4).map((alert) => {
    const date = new Date(alert.created_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    let timestamp: string;
    if (diffHours < 1) {
      timestamp = 'Just now';
    } else if (diffHours < 24) {
      timestamp = `${diffHours}h ago`;
    } else {
      timestamp = 'Yesterday';
    }

    return {
      id: alert.id,
      timestamp,
      message: alert.message,
      severity: alert.severity === 'critical' ? 'Critical' : alert.severity === 'warning' ? 'High' : 'Medium',
      source: alert.equipment_id || 'System',
      acknowledged: alert.status === 'acknowledged',
    };
  });
}

const Overview: React.FC = () => {
  const { theme } = useTheme();
  const { selectedBuildingId, loading: buildingLoading } = useBuildingContext();

  const { data: kpisData, loading: kpisLoading, error: kpisError } = useKpis(selectedBuildingId, 'today');
  const { data: energyData, loading: energyLoading, error: energyError } = useEnergy(selectedBuildingId, { resolution: 'hourly' });
  const { data: alertsData, loading: alertsLoading, error: alertsError } = useAlerts(selectedBuildingId);

  const kpiMetrics = useMemo(() => {
    if (!kpisData) return [];
    return transformKpis(kpisData);
  }, [kpisData]);

  const chartData = useMemo(() => {
    if (!energyData) return [];
    return transformEnergyData(energyData);
  }, [energyData]);

  const alerts = useMemo(() => {
    if (!alertsData) return [];
    return transformAlerts(alertsData);
  }, [alertsData]);

  const isLoading = buildingLoading || kpisLoading || energyLoading || alertsLoading;
  const hasError = kpisError || energyError || alertsError;

  if (isLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  if (hasError) {
    return <ErrorDisplay error={hasError} />;
  }

  return (
    <div className="space-y-6">
      {/* Header Section - Mobile Optimized (Left Aligned Buttons) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Dashboard Overview</h1>
        </div>
        <div className="w-full md:w-auto flex justify-start md:justify-end gap-2 mt-2 md:mt-0">
          <select className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded px-3 py-2 focus:ring-1 focus:ring-brand-500 outline-none hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <button className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors shadow-sm">
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiMetrics.map((kpi) => (
          <div key={kpi.id} className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{kpi.label}</span>
              {kpi.id === '1' && <Zap className="w-4 h-4 text-brand-500 dark:text-brand-400" />}
              {kpi.id === '2' && <Wind className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />}
              {kpi.id === '3' && <Droplets className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />}
              {kpi.id === '4' && <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{kpi.value}</span>
              <span className="text-sm text-slate-500">{kpi.unit}</span>
            </div>
            <div className={clsx(
              "flex items-center mt-2 text-xs font-medium",
              kpi.trendDirection === 'down' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'
            )}>
              {kpi.trendDirection === 'down' ? <ArrowDownRight className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />}
              {Math.abs(kpi.trend)}% vs last period
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[500px]">

        {/* Left: 3D Twin */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 dark:backdrop-blur rounded border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-[400px] lg:h-full flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 dark:text-slate-200">Real-time Digital Twin</h3>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">LOD 300</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-500/20">Live</span>
            </div>
          </div>
          <div className="flex-1 relative bg-slate-50 dark:bg-gradient-to-b dark:from-slate-900/50 dark:to-slate-900/10">
             <DigitalTwin3D />
          </div>
        </div>

        {/* Right: Charts */}
        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur rounded border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col h-[400px] lg:h-full">
          <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-4">Energy Demand vs. Prediction</h3>
          {/* Added w-full and h-full to wrapper to ensure ResponsiveContainer has dimensions */}
          <div className="flex-1 w-full h-full min-h-0 min-w-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                <XAxis dataKey="timestamp" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} interval={3} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    borderRadius: '4px',
                    border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                    color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                  }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Actual (kW)" />
                <Area type="monotone" dataKey="predicted" stroke="#10b981" strokeDasharray="4 4" strokeWidth={2} fillOpacity={1} fill="url(#colorPredicted)" name="Optimized (kW)" />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#94a3b8' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Alerts & Systems */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Alerts */}
        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur rounded border border-slate-200 dark:border-slate-700 shadow-sm p-5">
           <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-200">Recent Alerts</h3>
            <button className="text-sm text-brand-600 dark:text-brand-500 font-medium hover:text-brand-500 dark:hover:text-brand-400">View All</button>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No recent alerts</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="flex gap-4 p-3 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                  <div className={clsx(
                    "w-8 h-8 rounded flex items-center justify-center flex-shrink-0 bg-opacity-10",
                    alert.severity === 'Critical' ? "bg-red-500 text-red-500" :
                    alert.severity === 'High' ? "bg-orange-500 text-orange-500" :
                    "bg-brand-500 text-brand-500"
                  )}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{alert.message}</p>
                      <span className="text-xs text-slate-500 whitespace-nowrap">{alert.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Source: {alert.source}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Load Distribution */}
         <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur rounded border border-slate-200 dark:border-slate-700 shadow-sm p-5">
           <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-200">System Load Breakdown</h3>
          </div>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData.slice(12, 20)} layout="vertical" barSize={16}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                 <XAxis type="number" hide />
                 <YAxis dataKey="timestamp" type="category" width={40} axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} />
                 <Tooltip
                  cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'}}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                    color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                  }}
                 />
                 <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                 <Bar dataKey="hvac" stackId="a" fill="#3b82f6" name="HVAC" radius={[0, 0, 0, 0]} />
                 <Bar dataKey="lighting" stackId="a" fill="#f59e0b" name="Lighting" radius={[0, 0, 0, 0]} />
                 <Bar dataKey="equipment" stackId="a" fill="#64748b" name="Equipment" radius={[0, 2, 2, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Overview;
