
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Leaf, FileText, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../App';

const ESG: React.FC = () => {
  const { theme } = useTheme();
  const carbonData = [
    { name: 'Scope 1 (Direct)', value: 120, color: '#f59e0b' },
    { name: 'Scope 2 (Indirect)', value: 300, color: '#3b82f6' },
    { name: 'Scope 3 (Supply)', value: 80, color: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section - Mobile Optimized (Left Aligned Buttons) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="w-full">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">ESG Reporting & Compliance</h1>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Featured Card */}
        <div className="bg-emerald-900/10 dark:bg-emerald-900/30 p-5 rounded border border-emerald-200 dark:border-emerald-500/30 relative overflow-hidden">
           <div className="flex justify-between items-start relative z-10">
             <span className="text-sm font-medium text-emerald-700 dark:text-emerald-200">Net Carbon Emission</span>
             <Leaf className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
           </div>
           <div className="mt-4 relative z-10">
             <span className="text-3xl font-bold text-emerald-900 dark:text-white">500</span>
             <span className="text-sm ml-1 text-emerald-600 dark:text-emerald-200">tCO2e</span>
           </div>
           <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-300 inline-flex items-center">
             <span className="bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-200 mr-2">-12%</span> vs Baseline
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
           <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">LEED Score</span>
           <div className="mt-2 flex items-baseline gap-1">
             <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">72</span>
             <span className="text-sm text-slate-500">/ 110</span>
           </div>
           <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-4">
             <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '65%' }}></div>
           </div>
           <span className="text-xs text-amber-500 dark:text-amber-400 font-medium mt-2 block">Gold Certification Level</span>
        </div>

        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
           <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Energy Star</span>
           <div className="mt-2 flex items-baseline gap-1">
             <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">85</span>
           </div>
           <span className="text-xs text-emerald-500 dark:text-emerald-400 font-medium mt-2 block flex items-center gap-1">
             <CheckCircle className="w-3 h-3" /> Certified
           </span>
        </div>

        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-5 rounded border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center cursor-pointer hover:border-brand-500 transition-colors group">
           <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full mb-3 text-slate-500 dark:text-slate-300 group-hover:bg-brand-50 dark:group-hover:text-white transition-colors">
             <FileText className="w-5 h-5" />
           </div>
           <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Generate Annual Report</span>
           <span className="text-xs text-slate-500 mt-1">PDF & Excel Formats</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-6 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
           <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-6">Carbon Footprint Breakdown</h3>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie 
                   data={carbonData} 
                   cx="50%" 
                   cy="50%" 
                   innerRadius={60} 
                   outerRadius={100} 
                   paddingAngle={5} 
                   dataKey="value"
                   stroke="none"
                 >
                   {carbonData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip 
                   contentStyle={{ 
                     backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', 
                     borderRadius: '4px', 
                     border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0', 
                     color: theme === 'dark' ? '#f1f5f9' : '#0f172a' 
                   }}
                 />
                 <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: '#94a3b8' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur p-6 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
           <h3 className="font-semibold text-slate-900 dark:text-slate-200 mb-6">Compliance Checklist</h3>
           <div className="space-y-4">
             {[
               { name: 'ASHRAE 90.1 Audit', date: 'Oct 2023', status: 'Compliant' },
               { name: 'Local Law 97 (NYC)', date: 'Pending', status: 'In Review' },
               { name: 'ISO 50001', date: 'Jan 2023', status: 'Compliant' },
               { name: 'GRESB Submission', date: 'Due Nov 15', status: 'Action Required' },
             ].map((item, i) => (
               <div key={i} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700/50 rounded hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      item.status === 'Compliant' ? 'bg-emerald-500' : 
                      item.status === 'In Review' ? 'bg-brand-500' : 'bg-red-500'
                    )}></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.date}</p>
                    </div>
                 </div>
                 <span className={clsx(
                   "text-xs font-medium px-2 py-1 rounded border",
                   item.status === 'Compliant' ? 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                   item.status === 'In Review' ? 'bg-brand-50 text-brand-600 border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20' : 'bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                 )}>
                   {item.status}
                 </span>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default ESG;
