
import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Thermometer, Users, Sun, Zap, Calculator, TrendingDown,
  Play, Loader2, Check, AlertTriangle, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../App';
import { useBuildingContext } from '../context/BuildingContext';
import {
  useScenarios,
  useRunScenario,
  useMPCOptimize,
  useForecast,
  useROICalculator,
  Scenario,
  ScenarioResult,
  MPCResult,
  ForecastResult
} from '../hooks/useSimulation';

// Tab types
type TabType = 'scenarios' | 'mpc' | 'forecast' | 'roi';

// Icon mapping for scenarios
const SCENARIO_ICONS: Record<string, React.FC<{ className?: string }>> = {
  thermometer: Thermometer,
  users: Users,
  sun: Sun,
  zap: Zap,
  moon: Thermometer,
  calendar: Users,
  plane: Users,
  snowflake: Thermometer,
  cloud: Sun,
  wrench: Zap,
  'trending-up': TrendingDown,
  'radio-tower': Zap,
  sliders: Thermometer,
};

const Simulation: React.FC = () => {
  const { theme } = useTheme();
  const { selectedBuildingId } = useBuildingContext();

  const [activeTab, setActiveTab] = useState<TabType>('scenarios');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  // Hooks
  const { scenarios, loading: scenariosLoading } = useScenarios();
  const { result: scenarioResult, loading: scenarioRunning, runScenario } = useRunScenario();
  const { result: mpcResult, loading: mpcLoading, optimize: runMPC } = useMPCOptimize();
  const { result: forecastResult, loading: forecastLoading, getForecast } = useForecast();
  const { result: roiResult, loading: roiLoading, calculate: calculateROI } = useROICalculator();

  // ROI form state
  const [roiParams, setRoiParams] = useState({
    annual_energy_kwh: 500000,
    energy_price_eur: 0.15,
    savings_percent: 20,
    implementation_cost_eur: 50000,
    maintenance_cost_eur: 5000
  });

  // Run scenario when selected
  const handleScenarioSelect = async (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    await runScenario(selectedBuildingId, scenarioId, 24);
  };

  // Run MPC on tab switch
  useEffect(() => {
    if (activeTab === 'mpc' && !mpcResult && !mpcLoading) {
      runMPC(selectedBuildingId, 23, 22, 24);
    }
  }, [activeTab, selectedBuildingId]);

  // Run forecast on tab switch
  useEffect(() => {
    if (activeTab === 'forecast' && !forecastResult && !forecastLoading) {
      getForecast(selectedBuildingId, 24);
    }
  }, [activeTab, selectedBuildingId]);

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'scenarios', label: 'What-If Scenarios', icon: Thermometer },
    { id: 'mpc', label: 'MPC Optimization', icon: TrendingDown },
    { id: 'forecast', label: 'Energy Forecast', icon: AreaChart as any },
    { id: 'roi', label: 'ROI Calculator', icon: Calculator },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Digital Twin Simulation
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Test scenarios, optimize operations, and forecast energy consumption
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-500/20">
            2R2C Model Calibrated
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-500/20">
            R² = 0.85
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'scenarios' && (
          <ScenariosTab
            scenarios={scenarios}
            loading={scenariosLoading}
            selectedScenario={selectedScenario}
            onSelectScenario={handleScenarioSelect}
            result={scenarioResult}
            running={scenarioRunning}
            theme={theme}
          />
        )}

        {activeTab === 'mpc' && (
          <MPCTab
            result={mpcResult}
            loading={mpcLoading}
            onRefresh={() => runMPC(selectedBuildingId, 23, 22, 24)}
            theme={theme}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastTab
            result={forecastResult}
            loading={forecastLoading}
            onRefresh={() => getForecast(selectedBuildingId, 24)}
            theme={theme}
          />
        )}

        {activeTab === 'roi' && (
          <ROITab
            params={roiParams}
            setParams={setRoiParams}
            result={roiResult}
            loading={roiLoading}
            onCalculate={() => calculateROI(roiParams)}
          />
        )}
      </div>
    </div>
  );
};

// Scenarios Tab Component
const ScenariosTab: React.FC<{
  scenarios: Scenario[];
  loading: boolean;
  selectedScenario: string | null;
  onSelectScenario: (id: string) => void;
  result: ScenarioResult | null;
  running: boolean;
  theme: string;
}> = ({ scenarios, loading, selectedScenario, onSelectScenario, result, running, theme }) => {
  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Scenario List */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold text-slate-900 dark:text-slate-200">Select Scenario</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50 max-h-[500px] overflow-y-auto">
          {scenarios.map((scenario) => {
            const Icon = SCENARIO_ICONS[scenario.icon] || Thermometer;
            const isSelected = selectedScenario === scenario.id;
            const savingsPositive = scenario.estimated_savings_percent >= 0;

            return (
              <button
                key={scenario.id}
                onClick={() => onSelectScenario(scenario.id)}
                disabled={running}
                className={clsx(
                  "w-full text-left p-4 transition-colors",
                  isSelected
                    ? "bg-brand-50 dark:bg-brand-500/10 border-l-4 border-brand-500"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/30 border-l-4 border-transparent"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={clsx(
                    "p-2 rounded-lg",
                    savingsPositive
                      ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900 dark:text-slate-200 truncate">{scenario.name}</p>
                      <span className={clsx(
                        "text-xs font-medium px-2 py-0.5 rounded",
                        savingsPositive
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                      )}>
                        {savingsPositive ? '-' : '+'}{Math.abs(scenario.estimated_savings_percent)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {scenario.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="lg:col-span-2 space-y-6">
        {running && (
          <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Running simulation...</p>
            </div>
          </div>
        )}

        {!running && result && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Energy Savings"
                value={`${result.energy_savings_percent.toFixed(1)}%`}
                subvalue={`${result.energy_savings_kwh.toFixed(0)} kWh`}
                positive={result.energy_savings_percent > 0}
              />
              <MetricCard
                label="Cost Savings"
                value={`€${result.cost_savings_eur.toFixed(0)}`}
                subvalue="per day"
                positive={result.cost_savings_eur > 0}
              />
              <MetricCard
                label="Carbon Reduction"
                value={`${result.carbon_savings_kg.toFixed(1)} kg`}
                subvalue="CO₂"
                positive={result.carbon_savings_kg > 0}
              />
              <MetricCard
                label="Comfort Impact"
                value={result.comfort_impact > 0 ? `+${result.comfort_impact.toFixed(0)}` : result.comfort_impact.toFixed(0)}
                subvalue="points"
                positive={result.comfort_impact >= 0}
              />
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-4">Energy Comparison</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.baseline_timeline.map((b, i) => ({
                    ...b,
                    scenario_energy: result.scenario_timeline[i]?.energy_cumulative || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit' })}
                      stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                    />
                    <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                        border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                        color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                      }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="energy_cumulative" name="Baseline" stroke="#ef4444" fill="#ef444420" />
                    <Area type="monotone" dataKey="scenario_energy" name="Optimized" stroke="#10b981" fill="#10b98120" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-4">AI Recommendations</h3>
              <div className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 dark:text-slate-300">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!running && !result && (
          <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <Thermometer className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Select a scenario to run simulation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// MPC Tab
const MPCTab: React.FC<{
  result: MPCResult | null;
  loading: boolean;
  onRefresh: () => void;
  theme: string;
}> = ({ result, loading, onRefresh, theme }) => {
  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  }

  if (!result) return null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Cost Savings"
          value={`${result.cost_savings_percent.toFixed(0)}%`}
          subvalue={`€${(result.baseline_cost_eur - result.total_cost_eur).toFixed(2)}`}
          positive={result.cost_savings_percent > 0}
        />
        <MetricCard
          label="Total Energy"
          value={`${result.total_energy_kwh.toFixed(0)}`}
          subvalue="kWh"
          positive={true}
        />
        <MetricCard
          label="Comfort Score"
          value={result.comfort_score.toFixed(0)}
          subvalue="/ 100"
          positive={result.comfort_score >= 80}
        />
        <MetricCard
          label="Solve Time"
          value={`${result.solve_time_ms.toFixed(0)}`}
          subvalue="ms"
          positive={true}
        />
      </div>

      {/* Schedule Table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900 dark:text-slate-200">Optimal Setpoint Schedule</h3>
          <span className={clsx(
            "px-2 py-1 text-xs font-medium rounded",
            result.optimization_status === 'optimal'
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
          )}>
            {result.optimization_status}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">Hour</th>
                <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">Setpoint</th>
                <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">Predicted T</th>
                <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">Power</th>
                <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">Price</th>
                <th className="px-4 py-3 text-left text-slate-500 dark:text-slate-400">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {result.schedule.slice(0, 12).map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{item.hour}:00</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.setpoint}°C</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.predicted_temp}°C</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.predicted_power_kw.toFixed(1)} kW</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">€{item.electricity_price.toFixed(3)}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.occupancy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-4">Optimization Results</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={result.schedule}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="hour" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} />
              <YAxis yAxisId="left" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} />
              <YAxis yAxisId="right" orientation="right" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                  color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="setpoint" name="Setpoint (°C)" stroke="#3b82f6" strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="outdoor_temp" name="Outdoor (°C)" stroke="#94a3b8" strokeDasharray="5 5" />
              <Line yAxisId="right" type="monotone" dataKey="electricity_price" name="Price (€)" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Forecast Tab
const ForecastTab: React.FC<{
  result: ForecastResult | null;
  loading: boolean;
  onRefresh: () => void;
  theme: string;
}> = ({ result, loading, onRefresh, theme }) => {
  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>;
  }

  if (!result) return null;

  const chartData = result.timestamps.map((ts, i) => ({
    time: new Date(ts).toLocaleTimeString([], { hour: '2-digit' }),
    predicted: result.predicted_kwh[i],
    lower: result.confidence_lower[i],
    upper: result.confidence_upper[i]
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Forecast"
          value={`${result.total_predicted_kwh.toFixed(0)}`}
          subvalue="kWh"
          positive={true}
        />
        <MetricCard
          label="Average Hourly"
          value={`${result.avg_hourly_kwh.toFixed(1)}`}
          subvalue="kWh"
          positive={true}
        />
        <MetricCard
          label="Peak Hour"
          value={`${result.peak_hour}:00`}
          subvalue={`${result.peak_kwh.toFixed(0)} kWh`}
          positive={true}
        />
        <MetricCard
          label="Model Accuracy"
          value={`${(result.model_accuracy_r2 * 100).toFixed(0)}%`}
          subvalue={result.model_type}
          positive={result.model_accuracy_r2 >= 0.8}
        />
      </div>

      {/* Forecast Chart */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-4">24-Hour Energy Forecast</h3>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
              <XAxis dataKey="time" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} />
              <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
                  color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="upper" name="Upper Bound" stroke="none" fill="#3b82f620" />
              <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#3b82f6" fill="#3b82f640" strokeWidth={2} />
              <Area type="monotone" dataKey="lower" name="Lower Bound" stroke="none" fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Importance */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-4">Feature Importance</h3>
        <div className="space-y-3">
          {Object.entries(result.feature_importance)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 6)
            .map(([feature, importance]) => (
              <div key={feature} className="flex items-center gap-3">
                <span className="w-32 text-sm text-slate-600 dark:text-slate-400 capitalize">
                  {feature.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{ width: `${(importance as number) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-200 w-12">
                  {((importance as number) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// ROI Tab
const ROITab: React.FC<{
  params: any;
  setParams: (p: any) => void;
  result: any;
  loading: boolean;
  onCalculate: () => void;
}> = ({ params, setParams, result, loading, onCalculate }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-6">ROI Parameters</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Annual Energy (kWh)</label>
            <input
              type="number"
              value={params.annual_energy_kwh}
              onChange={(e) => setParams({ ...params, annual_energy_kwh: +e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-200"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Energy Price (EUR/kWh)</label>
            <input
              type="number"
              step="0.01"
              value={params.energy_price_eur}
              onChange={(e) => setParams({ ...params, energy_price_eur: +e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-200"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Expected Savings (%)</label>
            <input
              type="number"
              value={params.savings_percent}
              onChange={(e) => setParams({ ...params, savings_percent: +e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-200"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Implementation Cost (EUR)</label>
            <input
              type="number"
              value={params.implementation_cost_eur}
              onChange={(e) => setParams({ ...params, implementation_cost_eur: +e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-200"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400">Annual Maintenance (EUR)</label>
            <input
              type="number"
              value={params.maintenance_cost_eur}
              onChange={(e) => setParams({ ...params, maintenance_cost_eur: +e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-200"
            />
          </div>
          <button
            onClick={onCalculate}
            disabled={loading}
            className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            Calculate ROI
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {result && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="Payback Period"
                value={result.payback_months < 36 ? `${result.payback_months.toFixed(0)}` : result.payback_years.toFixed(1)}
                subvalue={result.payback_months < 36 ? "months" : "years"}
                positive={result.payback_months <= 24}
              />
              <MetricCard
                label="NPV (5 years)"
                value={`€${(result.npv_5_years_eur / 1000).toFixed(0)}k`}
                subvalue="net present value"
                positive={result.npv_5_years_eur > 0}
              />
              <MetricCard
                label="Annual Savings"
                value={`€${(result.annual_savings_eur / 1000).toFixed(1)}k`}
                subvalue="per year"
                positive={true}
              />
              <MetricCard
                label="Carbon Reduction"
                value={`${result.carbon_reduction_tons.toFixed(0)}`}
                subvalue="tons CO₂/year"
                positive={true}
              />
            </div>

            <div className="bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-4">Investment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Annual Energy Cost</span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">€{result.annual_energy_cost_eur.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Net Annual Savings</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">€{result.net_annual_savings_eur.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">5-Year Total Savings</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">€{result['5_year_total_savings_eur'].toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-600 dark:text-slate-400">IRR</span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">{result.irr_percent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </>
        )}

        {!result && (
          <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <Calculator className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Enter parameters and calculate ROI</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  label: string;
  value: string;
  subvalue: string;
  positive: boolean;
}> = ({ label, value, subvalue, positive }) => (
  <div className={clsx(
    "bg-white dark:bg-slate-800/50 p-4 rounded-lg border",
    positive
      ? "border-emerald-200 dark:border-emerald-500/20"
      : "border-amber-200 dark:border-amber-500/20"
  )}>
    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
    <p className={clsx(
      "text-2xl font-bold",
      positive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
    )}>
      {value}
    </p>
    <p className="text-xs text-slate-500 dark:text-slate-400">{subvalue}</p>
  </div>
);

export default Simulation;
