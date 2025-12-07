
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full">
           <h1 className="text-2xl font-bold text-white tracking-tight">Predictive Maintenance (FDD)</h1>
           <p className="text-white/50 text-sm mt-1">Equipment health monitoring, fault diagnostics, and RUL estimation.</p>
        </div>
        <div className="w-full md:w-auto flex justify-start md:justify-end mt-2 md:mt-0">
           <button className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-emerald-500/30">
              <Database className="w-4 h-4" />
              Sync CMMS
           </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/30 backdrop-blur-md p-5 rounded-lg border border-white/10 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
             <Activity className="w-6 h-6 text-emerald-400" />
           </div>
           <div>
             <div className="text-2xl font-bold text-white">{avgHealth}%</div>
             <div className="text-xs text-white/50">Overall Facility Health</div>
           </div>
        </div>

        <div className="bg-black/30 backdrop-blur-md p-5 rounded-lg border border-white/10 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
             <AlertTriangle className="w-6 h-6 text-amber-400" />
           </div>
           <div>
             <div className="text-2xl font-bold text-white">2</div>
             <div className="text-xs text-white/50">Active Faults</div>
           </div>
        </div>

        <div className="bg-black/30 backdrop-blur-md p-5 rounded-lg border border-white/10 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
             <Wrench className="w-6 h-6 text-blue-400" />
           </div>
           <div>
             <div className="text-2xl font-bold text-white">3</div>
             <div className="text-xs text-white/50">Pending Work Orders</div>
           </div>
        </div>

         <div className="bg-black/30 backdrop-blur-md p-5 rounded-lg border border-white/10 flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
             <Clock className="w-6 h-6 text-purple-400" />
           </div>
           <div>
             <div className="text-2xl font-bold text-white">120d</div>
             <div className="text-xs text-white/50">Min. RUL Detected</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Health List */}
        <div className="lg:col-span-2 bg-black/30 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
           <div className="p-4 border-b border-white/10 bg-black/20">
             <h3 className="font-semibold text-white">Equipment Health & RUL</h3>
           </div>
           <div className="p-4 space-y-6">
             {mockMaintenanceRecords.map((record) => (
               <div key={record.equipmentId} className="group pb-4 border-b border-white/5 last:border-0 last:pb-0">
                 <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                       <span className="font-medium text-white">{record.equipmentName}</span>
                       {record.faults.length > 0 && (
                         <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold uppercase rounded border border-red-500/30 tracking-wide">
                            {record.faults.length} Faults
                         </span>
                       )}
                    </div>
                    <span className="text-sm text-white/50">RUL: <span className="text-white font-mono">{record.rulDays} days</span></span>
                 </div>
                 {/* Health Bar */}
                 <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden relative">
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
                   <span className="text-xs text-white/50">Health Score</span>
                   <span className={clsx(
                     "text-xs font-bold",
                     record.healthScore > 80 ? "text-emerald-400" :
                     record.healthScore > 50 ? "text-amber-400" : "text-red-400"
                   )}>{record.healthScore}%</span>
                 </div>

                 {/* Quick Actions */}
                 <div className="mt-3 flex gap-2">
                    <button className="text-xs bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded transition-colors border border-white/10">
                      View Diagnostics
                    </button>
                    <button className="text-xs border border-white/10 hover:bg-white/5 text-white/60 hover:text-white px-3 py-1.5 rounded transition-colors">
                      Create Work Order
                    </button>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Fault Feed */}
        <div className="bg-black/30 backdrop-blur-md rounded-lg border border-white/10 flex flex-col h-full">
           <div className="p-4 border-b border-white/10 bg-black/20">
             <h3 className="font-semibold text-white">Active Diagnostics (FDD)</h3>
           </div>
           <div className="p-4 space-y-4 overflow-y-auto flex-1 max-h-[500px]">
              {mockMaintenanceRecords.flatMap(r => r.faults.map(f => ({...f, equipmentName: r.equipmentName}))).length === 0 ? (
                <div className="text-center py-10">
                   <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3 opacity-50" />
                   <p className="text-white/50">No active faults detected.</p>
                </div>
              ) : (
                mockMaintenanceRecords.flatMap(r => r.faults.map(f => ({...f, equipmentName: r.equipmentName}))).map((fault) => (
                  <div key={fault.id} className="p-3 bg-black/20 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
                     <div className="flex justify-between items-start mb-1">
                       <span className="text-xs font-bold text-white/50 uppercase tracking-wide">{fault.code}</span>
                       <span className={clsx(
                         "w-2 h-2 rounded-full",
                         fault.severity === AlertSeverity.CRITICAL ? "bg-red-500" :
                         fault.severity === AlertSeverity.HIGH ? "bg-orange-500" : "bg-yellow-500"
                       )}></span>
                     </div>
                     <p className="text-sm font-medium text-white mb-1">{fault.description}</p>
                     <p className="text-xs text-white/50 mb-2">Source: {fault.equipmentName} • {fault.detectedAt}</p>
                     <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                       <p className="text-[10px] text-emerald-300 font-medium">Rec: {fault.recommendation}</p>
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
