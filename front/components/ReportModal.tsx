import React from 'react';
import { X, AlertTriangle, CheckCircle, Zap, TrendingUp, Leaf, ThumbsUp, Download, FileText, Clock, Wrench } from 'lucide-react';
import { clsx } from 'clsx';
import type { BuildingReport, ReportIssue, ReportOptimization } from '../api/types';

interface ReportModalProps {
  report: BuildingReport;
  onClose: () => void;
}

const severityColors = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
};

const typeIcons = {
  equipment: Wrench,
  efficiency: Zap,
  comfort: ThumbsUp,
  anomaly: AlertTriangle,
};

const optimizationTypeColors = {
  setpoint: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  schedule: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  equipment: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  demand_response: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function IssueCard({ issue, key: _key }: { issue: ReportIssue; key?: string }) {
  const Icon = typeIcons[issue.type] || AlertTriangle;

  return (
    <div className={clsx(
      'p-4 rounded-lg border',
      severityColors[issue.severity]
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-white/50 dark:bg-black/20">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-sm">{issue.id}</span>
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded-full',
              issue.status === 'open' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-green-500/20 text-green-600 dark:text-green-400'
            )}>
              {issue.status}
            </span>
          </div>
          <p className="text-sm opacity-90 mb-2">{issue.description}</p>
          <div className="flex items-center gap-4 text-xs opacity-75">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Impact: {issue.impact_kwh} kWh
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(issue.detected_at)}
            </span>
          </div>
          <p className="text-xs mt-2 italic opacity-80">→ {issue.recommendation}</p>
        </div>
      </div>
    </div>
  );
}

function OptimizationCard({ opt, key: _key }: { opt: ReportOptimization; key?: string }) {
  return (
    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">{opt.name}</h4>
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded-full inline-block mt-1',
            optimizationTypeColors[opt.type]
          )}>
            {opt.type.replace('_', ' ')}
          </span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            -{opt.energy_impact_percent}%
          </div>
          <div className="text-xs text-slate-500">€{opt.cost_impact_eur.toFixed(2)} saved</div>
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{opt.description}</p>
      <div className="text-xs text-slate-500 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Applied: {formatDate(opt.applied_at)}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, unit, icon: Icon, color }: {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-2">
        <div className={clsx('p-2 rounded-lg', color)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</span>
        <span className="text-sm text-slate-500">{unit}</span>
      </div>
    </div>
  );
}

export default function ReportModal({ report, onClose }: ReportModalProps) {
  const handleDownloadPDF = () => {
    // Download PDF from backend
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8005';
    const pdfUrl = `${apiUrl}/api/v1/reports/${report.building_id}/pdf?period=${report.period.type}`;
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-50 dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Building Performance Report
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {report.building_name} • {report.period.days} days ({report.period.type})
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* Summary Cards */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SummaryCard
                label="Energy Saved"
                value={report.summary.energy_saved_kwh.toLocaleString()}
                unit={`kWh (${report.summary.energy_saved_percent}%)`}
                icon={Zap}
                color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
              />
              <SummaryCard
                label="Cost Saved"
                value={`€${report.summary.cost_saved_eur.toLocaleString()}`}
                unit=""
                icon={TrendingUp}
                color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              />
              <SummaryCard
                label="CO₂ Reduced"
                value={report.summary.co2_reduced_kg.toLocaleString()}
                unit="kg"
                icon={Leaf}
                color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              />
              <SummaryCard
                label="Comfort Score"
                value={report.summary.comfort_score}
                unit="/100"
                icon={ThumbsUp}
                color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              />
            </div>
          </section>

          {/* Detected Issues */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Detected Issues
              <span className="text-sm font-normal text-slate-500">
                ({report.summary.issues_open} open, {report.summary.issues_resolved} resolved)
              </span>
            </h3>
            <div className="space-y-3">
              {report.detected_issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </section>

          {/* Applied Optimizations */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Applied Optimizations
              <span className="text-sm font-normal text-slate-500">
                ({report.summary.optimizations_active} active)
              </span>
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {report.optimizations_applied.map((opt) => (
                <OptimizationCard key={opt.id} opt={opt} />
              ))}
            </div>
          </section>

          {/* AI Recommendations */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              AI Recommendations
            </h3>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-5 border border-purple-200 dark:border-purple-800">
              <ul className="space-y-3">
                {report.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Building Info Footer */}
          <section className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4">
            <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div>
                <span className="font-medium">Building:</span> {report.building_name}
              </div>
              <div>
                <span className="font-medium">Area:</span> {report.building_info.floor_area_m2.toLocaleString()} m²
              </div>
              <div>
                <span className="font-medium">Floors:</span> {report.building_info.floors}
              </div>
              <div>
                <span className="font-medium">Location:</span> {report.building_info.location}
              </div>
              <div>
                <span className="font-medium">Generated:</span> {formatDate(report.generated_at)}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
