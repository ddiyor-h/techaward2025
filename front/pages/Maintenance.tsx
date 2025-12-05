
import React from 'react';
import { mockMaintenanceRecords } from '../mockData';
import { Activity, Wrench, AlertTriangle, Clock, Database, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { AlertSeverity } from '../types';

const Maintenance: React.FC = () => {
  // Calculate aggregate health
  const avgHealth = Math.round(mockMaintenanceRecords.reduce((acc, curr) => acc + curr.healthScore, 0) / mockMaintenanceRecords.length);

  return (
    <div className="space-y-6">
      {/* Header Section - Mobile Optimized (Left Aligned Buttons) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full">
           <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Predictive Maintenance (FDD)</h1>
           <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Equipment health monitoring, fault diagnostics, and RUL estimation.</p>
        </div>
        <div className="w-full md:w-auto flex justify-start md:justify-end mt-2 md:mt-0">
           <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-sm">
              <Database className="w-4 h-4" />
              Sync CMMS
           </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-5 rounded border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20">
             <Activity className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
           </div>
           <div>
             <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{avgHealth}%</div>
             <div className="text-xs text-slate-500">Overall Facility Health</div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-5 rounded border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center border border-amber-200 dark:border-amber-500/20">
             <AlertTriangle className="w-6 h-6 text-amber-500 dark:text-amber-400" />
           </div>
           <div>
             <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">2</div>
             <div className="text-xs text-slate-500">Active Faults</div>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-5 rounded border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
             <Wrench className="w-6 h-6 text-blue-500 dark:text-blue-400" />
           </div>
           <div>
             <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">3</div>
             <div className="text-xs text-slate-500">Pending Work Orders</div>
           </div>
        </div>

         <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-5 rounded border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20">
             <Clock className="w-6 h-6 text-purple-500 dark:text-purple-400" />
           </div>
           <div>
             <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">120d</div>
             <div className="text-xs text-slate-500">Min. RUL Detected</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Health List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 dark:backdrop-blur rounded border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
           <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
             <h3 className="font-semibold text-slate-900 dark:text-slate-200">Equipment Health & RUL</h3>
           </div>
           <div className="p-4 space-y-6">
             {mockMaintenanceRecords.map((record) => (
               <div key={record.equipmentId} className="group pb-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                 <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                       <span className="font-medium text-slate-900 dark:text-slate-200">{record.equipmentName}</span>
                       {record.faults.length > 0 && (
                         <span className="px-2 py-0.5 bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-[10px] font-bold uppercase rounded border border-red-200 dark:border-red-500/20 tracking-wide">
                            {record.faults.length} Faults
                         </span>
                       )}
                    </div>
                    <span className="text-sm text-slate-500">RUL: <span className="text-slate-700 dark:text-slate-200 font-mono">{record.rulDays} days</span></span>
                 </div>
                 {/* Health Bar */}
                 <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                    <div 
                      className={clsx(
                        "h-full rounded-full transition-all duration-500",
                        record.healthScore > 80 ? "bg-emerald-500" :
                        record.healthScore > 50 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${record.healthScore}%` }}
                    ></div>
                 </div>
                 <div className="flex justify-between mt-1">
                   <span className="text-xs text-slate-500">Health Score</span>
                   <span className={clsx(
                     "text-xs font-bold",
                     record.healthScore > 80 ? "text-emerald-600 dark:text-emerald-500" :
                     record.healthScore > 50 ? "text-amber-600 dark:text-amber-500" : "text-red-600 dark:text-red-500"
                   )}>{record.healthScore}%</span>
                 </div>
                 
                 {/* Quick Actions (Always Visible) */}
                 <div className="mt-3 flex gap-2">
                    <button className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded transition-colors border border-slate-200 dark:border-slate-600">
                      View Diagnostics
                    </button>
                    <button className="text-xs border border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded transition-colors">
                      Create Work Order
                    </button>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Fault Feed */}
        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur rounded border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
           <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
             <h3 className="font-semibold text-slate-900 dark:text-slate-200">Active Diagnostics (FDD)</h3>
           </div>
           <div className="p-4 space-y-4 overflow-y-auto flex-1 max-h-[500px]">
              {mockMaintenanceRecords.flatMap(r => r.faults.map(f => ({...f, equipmentName: r.equipmentName}))).length === 0 ? (
                <div className="text-center py-10">
                   <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-50" />
                   <p className="text-slate-500">No active faults detected.</p>
                </div>
              ) : (
                mockMaintenanceRecords.flatMap(r => r.faults.map(f => ({...f, equipmentName: r.equipmentName}))).map((fault) => (
                  <div key={fault.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                     <div className="flex justify-between items-start mb-1">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{fault.code}</span>
                       <span className={clsx(
                         "w-2 h-2 rounded-full",
                         fault.severity === AlertSeverity.CRITICAL ? "bg-red-500" :
                         fault.severity === AlertSeverity.HIGH ? "bg-orange-500" : "bg-yellow-500"
                       )}></span>
                     </div>
                     <p className="text-sm font-medium text-slate-900 dark:text-slate-200 mb-1">{fault.description}</p>
                     <p className="text-xs text-slate-500 mb-2">Source: {fault.equipmentName} • {fault.detectedAt}</p>
                     <div className="bg-brand-50 dark:bg-brand-900/20 p-2 rounded border border-brand-100 dark:border-brand-500/10">
                       <p className="text-[10px] text-brand-700 dark:text-brand-300 font-medium">Rec: {fault.recommendation}</p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
