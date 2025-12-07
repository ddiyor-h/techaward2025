
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Leaf, FileText, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

const ESG: React.FC = () => {
  const carbonData = [
    { name: 'Scope 1 (Direct)', value: 120, color: '#f59e0b' },
    { name: 'Scope 2 (Indirect)', value: 300, color: '#3b82f6' },
    { name: 'Scope 3 (Supply)', value: 80, color: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="w-full">
            <h1 className="text-2xl font-bold text-white tracking-tight">ESG Reporting & Compliance</h1>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Featured Card */}
        <div className="bg-emerald-500/10 backdrop-blur-md p-5 rounded-lg border border-emerald-500/30 relative overflow-hidden">
           <div className="flex justify-between items-start relative z-10">
             <span className="text-sm font-medium text-emerald-200">Net Carbon Emission</span>
             <Leaf className="w-5 h-5 text-emerald-400" />
           </div>
           <div className="mt-4 relative z-10">
             <span className="text-3xl font-bold text-white">500</span>
             <span className="text-sm ml-1 text-emerald-200">tCO2e</span>
           </div>
           <div className="mt-2 text-xs text-emerald-300 inline-flex items-center">
             <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-200 mr-2">-12%</span> vs Baseline
           </div>
        </div>

        <div className="bg-black/30 backdrop-blur-md p-5 rounded-lg border border-white/10">
           <span className="text-white/50 text-sm font-medium">LEED Score</span>
           <div className="mt-2 flex items-baseline gap-1">
             <span className="text-3xl font-bold text-white">72</span>
             <span className="text-sm text-white/50">/ 110</span>
           </div>
           <div className="w-full bg-white/10 rounded-full h-1.5 mt-4">
             <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: '65%' }}></div>
           </div>
           <span className="text-xs text-amber-400 font-medium mt-2 block">Gold Certification Level</span>
        </div>

        <div className="bg-black/30 backdrop-blur-md p-5 rounded-lg border border-white/10">
           <span className="text-white/50 text-sm font-medium">Energy Star</span>
           <div className="mt-2 flex items-baseline gap-1">
             <span className="text-3xl font-bold text-white">85</span>
           </div>
           <span className="text-xs text-emerald-400 font-medium mt-2 block flex items-center gap-1">
             <CheckCircle className="w-3 h-3" /> Certified
           </span>
        </div>

        <div className="bg-black/30 backdrop-blur-md p-5 rounded-lg border border-white/10 flex flex-col justify-center items-center text-center cursor-pointer hover:border-emerald-500/30 transition-colors group">
           <div className="bg-white/10 p-2 rounded-full mb-3 text-white/60 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
             <FileText className="w-5 h-5" />
           </div>
           <span className="text-sm font-medium text-white">Generate Annual Report</span>
           <span className="text-xs text-white/50 mt-1">PDF & Excel Formats</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-black/30 backdrop-blur-md p-6 rounded-lg border border-white/10">
           <h3 className="font-semibold text-white mb-6">Carbon Footprint Breakdown</h3>
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
                     backgroundColor: 'rgba(0,0,0,0.8)',
                     backdropFilter: 'blur(12px)',
                     borderRadius: '8px',
                     border: '1px solid rgba(255,255,255,0.1)',
                     color: '#fff'
                   }}
                 />
                 <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'rgba(255,255,255,0.6)' }} />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-black/30 backdrop-blur-md p-6 rounded-lg border border-white/10">
           <h3 className="font-semibold text-white mb-6">Compliance Checklist</h3>
           <div className="space-y-4">
             {[
               { name: 'ASHRAE 90.1 Audit', date: 'Oct 2023', status: 'Compliant' },
               { name: 'Local Law 97 (NYC)', date: 'Pending', status: 'In Review' },
               { name: 'ISO 50001', date: 'Jan 2023', status: 'Compliant' },
               { name: 'GRESB Submission', date: 'Due Nov 15', status: 'Action Required' },
             ].map((item, i) => (
               <div key={i} className="flex items-center justify-between p-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors">
                 <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      item.status === 'Compliant' ? 'bg-emerald-500' :
                      item.status === 'In Review' ? 'bg-blue-500' : 'bg-red-500'
                    )}></div>
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-white/50">{item.date}</p>
                    </div>
                 </div>
                 <span className={clsx(
                   "text-xs font-medium px-2 py-1 rounded border",
                   item.status === 'Compliant' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                   item.status === 'In Review' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
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
