import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Zap, Wind, Droplets, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { Loading, ErrorDisplay } from '../components/Loading';
import ReportModal from '../components/ReportModal';
import { useTheme } from '../App';
import { useBuildingContext } from '../context/BuildingContext';
import { useKpis, useEnergy, useAlerts } from '../hooks/useApi';
import { buildingsApi } from '../api/buildings';
import type { KPIsResponse, EnergyDataResponse, AlertListResponse, BuildingReport } from '../api/types';

// Looping video component with optional scale
const LoopingVideo: React.FC<{ src: string; className?: string; scale?: number }> = ({ src, className, scale = 1 }) => {
  const scaleStyle = scale !== 1 ? { transform: `scale(${scale})` } : {};

  return (
    <video
      src={src}
      className={className}
      muted
      loop
      autoPlay
      playsInline
      preload="auto"
      style={scaleStyle}
    />
  );
};

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

// Transform API energy data to chart format - only last 24 data points
function transformEnergyData(energy: EnergyDataResponse) {
  if (!energy.data_points || energy.data_points.length === 0) {
    return [];
  }

  // Sort by timestamp and take ONLY last 24 points
  const allPoints = [...energy.data_points];
  allPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Take only last 24 points
  const last24 = allPoints.length > 24 ? allPoints.slice(-24) : allPoints;

  return last24.map((point) => {
    const date = new Date(point.timestamp);
    const hour = date.getHours();
    const timestamp = `${hour.toString().padStart(2, '0')}:00`;

    const total = point.value;

    return {
      timestamp,
      total: Math.round(total * 10) / 10,
      baseline: Math.round(total * 1.15 * 10) / 10,
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

  // Report state
  const [reportData, setReportData] = useState<BuildingReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const handleGenerateReport = async () => {
    if (!selectedBuildingId) return;

    setReportLoading(true);
    try {
      const report = await buildingsApi.generateReport(selectedBuildingId, 'month');
      setReportData(report);
      setShowReport(true);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setReportLoading(false);
    }
  };

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
          <button
            onClick={handleGenerateReport}
            disabled={reportLoading}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-medium px-4 py-2 rounded transition-colors shadow-sm flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {reportLoading ? 'Generating...' : 'Generate Report'}
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

      {/* Video Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[500px]">

        {/* Left: Main Building Overview - static, doesn't change with block selection */}
        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur rounded border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-[400px] lg:h-full flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 dark:text-slate-200">Building Overview</h3>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'rgb(35 35 35)' }}>
            <video
              src="/assets/main.mp4?v=2"
              className="w-full h-full object-contain"
              style={{ transform: 'scale(1.1)' }}
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
            />
          </div>
        </div>

        {/* Right: Selected Block View */}
        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur rounded border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-[400px] lg:h-full flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 dark:text-slate-200">
              {selectedBuildingId === 'pleiades-a' ? 'Block A View' :
               selectedBuildingId === 'pleiades-b' ? 'Block B View' :
               selectedBuildingId === 'pleiades-c' ? 'Block C View' : 'Block View'}
            </h3>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-500/20">
                {selectedBuildingId === 'pleiades-a' ? 'Block A' :
                 selectedBuildingId === 'pleiades-b' ? 'Block B' :
                 selectedBuildingId === 'pleiades-c' ? 'Block C' : 'Selected'}
              </span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-500/20">Live</span>
            </div>
          </div>
          <div className="flex-1 relative bg-black">
            <LoopingVideo
              key={selectedBuildingId}
              src={selectedBuildingId === 'pleiades-a' ? '/assets/a-block.mp4' :
                   selectedBuildingId === 'pleiades-b' ? '/assets/b-block.mp4' :
                   selectedBuildingId === 'pleiades-c' ? '/assets/c-block.mp4' : '/assets/a-block.mp4'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Consumption vs. Baseline - Full Width */}
      <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur rounded border border-slate-200 dark:border-slate-700 shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-200">Consumption vs. Baseline (24h)</h3>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
              <span className="text-slate-600 dark:text-slate-400">Actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-slate-400 border border-dashed border-slate-500"></div>
              <span className="text-slate-600 dark:text-slate-400">Baseline</span>
            </div>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"} />
              <XAxis
                dataKey="timestamp"
                axisLine={false}
                tickLine={false}
                tick={{fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}}
                interval={3}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{fontSize: 11, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}}
                unit=" kW"
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                  borderRadius: '8px',
                  border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                  color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ fontSize: '12px' }}
                formatter={(value: number, name: string) => [
                  `${value} kW`,
                  name === 'total' ? 'Actual Usage' : 'Baseline'
                ]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorActual)"
                name="total"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="baseline"
                stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={0}
                name="baseline"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && reportData && (
        <ReportModal
          report={reportData}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

export default Overview;
