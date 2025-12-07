import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Zap, Wind, Droplets, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { Loading, ErrorDisplay } from '../components/Loading';
import ReportModal from '../components/ReportModal';
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
        </div>
        <div className="w-full md:w-auto flex justify-start md:justify-end gap-2 mt-2 md:mt-0">
          <select className="bg-black/40 backdrop-blur border border-white/10 text-white/80 text-sm rounded px-3 py-2 focus:ring-1 focus:ring-emerald-500 outline-none hover:bg-white/5 transition-colors">
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <button
            onClick={handleGenerateReport}
            disabled={reportLoading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-sm font-medium px-4 py-2 rounded transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {reportLoading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* KPI Cards - Glass morphism style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiMetrics.map((kpi) => (
          <div
            key={kpi.id}
            className="bg-black/30 backdrop-blur-md p-5 rounded-lg border border-white/10 hover:border-emerald-500/30 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-white/60 text-sm font-medium uppercase tracking-wider">{kpi.label}</span>
              {kpi.id === '1' && <Zap className="w-5 h-5 text-emerald-400" />}
              {kpi.id === '2' && <Wind className="w-5 h-5 text-emerald-400" />}
              {kpi.id === '3' && <Droplets className="w-5 h-5 text-emerald-400" />}
              {kpi.id === '4' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{kpi.value}</span>
              <span className="text-sm text-white/50">{kpi.unit}</span>
            </div>
            <div className={clsx(
              "flex items-center mt-3 text-xs font-medium",
              kpi.trendDirection === 'down' ? 'text-emerald-400' : 'text-amber-400'
            )}>
              {kpi.trendDirection === 'down' ? <ArrowDownRight className="w-4 h-4 mr-1" /> : <ArrowUpRight className="w-4 h-4 mr-1" />}
              {Math.abs(kpi.trend)}% vs last period
            </div>
          </div>
        ))}
      </div>

      {/* Video Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[500px]">

        {/* Left: Main Building Overview */}
        <div className="bg-black/30 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden h-[400px] lg:h-full flex flex-col">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-semibold text-white">Building Overview</h3>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
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
        <div className="bg-black/30 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden h-[400px] lg:h-full flex flex-col">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-semibold text-white">
              {selectedBuildingId === 'pleiades-a' ? 'Block A View' :
               selectedBuildingId === 'pleiades-b' ? 'Block B View' :
               selectedBuildingId === 'pleiades-c' ? 'Block C View' : 'Block View'}
            </h3>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                {selectedBuildingId === 'pleiades-a' ? 'Block A' :
                 selectedBuildingId === 'pleiades-b' ? 'Block B' :
                 selectedBuildingId === 'pleiades-c' ? 'Block C' : 'Selected'}
              </span>
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                Live
              </span>
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

      {/* Consumption vs. Baseline Chart */}
      <div className="bg-black/30 backdrop-blur-md rounded-lg border border-white/10 p-5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-white">Consumption vs. Baseline (24h)</h3>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
              <span className="text-white/60">Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-white/30 border border-dashed border-white/50"></div>
              <span className="text-white/60">Baseline</span>
            </div>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="timestamp"
                axisLine={false}
                tickLine={false}
                tick={{fontSize: 11, fill: 'rgba(255,255,255,0.4)'}}
                interval={3}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{fontSize: 11, fill: 'rgba(255,255,255,0.4)'}}
                unit=" kW"
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4, color: '#fff' }}
                itemStyle={{ fontSize: '12px', color: '#fff' }}
                formatter={(value: number, name: string) => [
                  `${value} kW`,
                  name === 'total' ? 'Actual Usage' : 'Baseline'
                ]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorActual)"
                name="total"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="baseline"
                stroke="rgba(255,255,255,0.3)"
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
