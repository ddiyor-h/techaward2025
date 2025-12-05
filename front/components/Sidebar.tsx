
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, Wind, Leaf, Activity, Settings, ThermometerSun, X, FlaskConical } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/' },
    { name: 'Energy', icon: Zap, path: '/energy' },
    { name: 'HVAC & Systems', icon: Wind, path: '/hvac' },
    { name: 'Indoor Air Quality', icon: ThermometerSun, path: '/iaq' },
    { name: 'Simulation', icon: FlaskConical, path: '/simulation' },
    { name: 'ESG Reporting', icon: Leaf, path: '/esg' },
    { name: 'Predictive Maint.', icon: Activity, path: '/maintenance' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <>
      <div 
        className={clsx(
          "flex flex-col h-screen w-64 fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 md:relative",
          "bg-white dark:bg-slate-900/95 dark:backdrop-blur-md border-r border-slate-200 dark:border-slate-800",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow-sm border border-slate-200 dark:border-none">
               <img src="/assets/eq.png" alt="Eq" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center">
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100 font-sans">Eq</span>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100 font-sans ml-1">II</span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 border border-transparent',
                  isActive
                    ? 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                )
              }
            >
              <item.icon className={clsx("w-5 h-5", ({ isActive }: { isActive: boolean }) => isActive ? "text-brand-600 dark:text-brand-500" : "text-slate-400 dark:text-slate-500")} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Footer / User User */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
              Eq
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-200">Equilibrium</span>
              <span className="text-xs text-slate-500">Facility Manager</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
