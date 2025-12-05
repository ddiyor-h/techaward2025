
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, CheckCircle, AlertTriangle, Info, X, Building2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useBuildingContext } from '../context/BuildingContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { buildings, selectedBuildingId, setSelectedBuildingId, selectedBuilding } = useBuildingContext();

  // Mock Notifications
  const notifications = [
    { id: 1, title: 'High Energy Usage', message: 'Server Room exceeded baseline by 15%', time: '10 min ago', type: 'warning' },
    { id: 2, title: 'Maintenance Scheduled', message: 'Chiller-01 maintenance tomorrow at 09:00', time: '1 hour ago', type: 'info' },
    { id: 3, title: 'Report Generated', message: 'October 2023 ESG Report is ready', time: '2 hours ago', type: 'success' },
    { id: 4, title: 'Connection Lost', message: 'Sensor Hub B-2 offline', time: '5 hours ago', type: 'critical' },
  ];

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="flex items-center gap-4">
        {/* Mobile Logo (Eq II) - Visible only on Mobile */}
        <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow-sm border border-slate-200 dark:border-none">
               <img src="/assets/eq.png" alt="Eq" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100">Eq</span>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-slate-100 ml-1">II</span>
            </div>
        </div>

        {/* Building Selector */}
        <div className="relative hidden md:flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <select
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 py-2 px-3 transition-all cursor-pointer min-w-[180px]"
          >
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search - Hidden on mobile */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search assets, sensors..."
            className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm text-slate-900 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={clsx(
              "relative p-2 rounded transition-colors",
              showNotifications 
                ? "text-brand-600 bg-brand-50 dark:text-white dark:bg-slate-800" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <h3 className="font-semibold text-slate-900 dark:text-slate-200 text-sm">Notifications</h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                {notifications.map((note) => (
                  <div key={note.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group">
                    <div className="flex gap-3">
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                        note.type === 'warning' ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500" :
                        note.type === 'info' ? "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500" :
                        note.type === 'success' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500" :
                        "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500"
                      )}>
                        {note.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                         note.type === 'info' ? <Info className="w-4 h-4" /> :
                         note.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                         <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{note.title}</p>
                          <span className="text-xs text-slate-500 whitespace-nowrap ml-2">{note.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{note.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center">
                <button className="text-xs text-brand-600 dark:text-brand-500 font-medium hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button - Right side */}
        <button 
          onClick={onMenuClick}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
