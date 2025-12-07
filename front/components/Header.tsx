
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, CheckCircle, AlertTriangle, Info, X, MapPin, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { useBuildingContext } from '../context/BuildingContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBuildingSelector, setShowBuildingSelector] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const buildingSelectorRef = useRef<HTMLDivElement>(null);
  const { buildings, selectedBuildingId, setSelectedBuildingId, selectedBuilding } = useBuildingContext();

  // Mock Notifications
  const notifications = [
    { id: 1, title: 'High Energy Usage', message: 'Server Room exceeded baseline by 15%', time: '10 min ago', type: 'warning' },
    { id: 2, title: 'Maintenance Scheduled', message: 'Chiller-01 maintenance tomorrow at 09:00', time: '1 hour ago', type: 'info' },
    { id: 3, title: 'Report Generated', message: 'October 2023 ESG Report is ready', time: '2 hours ago', type: 'success' },
    { id: 4, title: 'Connection Lost', message: 'Sensor Hub B-2 offline', time: '5 hours ago', type: 'critical' },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (buildingSelectorRef.current && !buildingSelectorRef.current.contains(event.target as Node)) {
        setShowBuildingSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 backdrop-blur-xl bg-black/30 border-b border-white/10 ml-0">
      <div className="flex items-center gap-4">
        {/* Logo Eq II - Always visible */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/assets/eq.png?v=1" alt="Eq" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-lg tracking-tight text-white">Eq</span>
            <span className="font-bold text-lg tracking-tight text-white ml-1">II</span>
          </div>
        </div>

        {/* Search - Hidden on mobile */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="Search assets, sensors..."
            className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Building Selector - Custom Dropdown */}
        <div className="hidden md:block relative" ref={buildingSelectorRef}>
          <button
            onClick={() => setShowBuildingSelector(!showBuildingSelector)}
            className={clsx(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer",
              showBuildingSelector
                ? "bg-emerald-500/20 border border-emerald-500/30"
                : "bg-black/40 border border-white/10 hover:bg-black/50"
            )}
          >
            <MapPin className="w-4 h-4 text-white/50" />
            <div className="flex flex-col min-w-[140px] text-left">
              <span className="text-[10px] text-white/40 uppercase tracking-wider leading-none">Current Building</span>
              <span className="text-sm font-medium text-white">{selectedBuilding?.name || 'Select...'}</span>
            </div>
            <ChevronDown className={clsx("w-4 h-4 text-white/40 transition-transform", showBuildingSelector && "rotate-180")} />
          </button>

          {/* Building Dropdown */}
          {showBuildingSelector && (
            <div className="absolute top-full right-0 mt-2 w-full min-w-[200px] bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="py-1">
                {buildings.map((building) => (
                  <button
                    key={building.id}
                    onClick={() => {
                      setSelectedBuildingId(building.id);
                      setShowBuildingSelector(false);
                    }}
                    className={clsx(
                      "w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center gap-2",
                      selectedBuildingId === building.id
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "text-white hover:bg-white/10"
                    )}
                  >
                    {selectedBuildingId === building.id && (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span className={selectedBuildingId === building.id ? "" : "ml-6"}>{building.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={clsx(
              "relative p-2 rounded transition-colors",
              showNotifications
                ? "text-emerald-400 bg-emerald-500/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="font-semibold text-white text-sm">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
                {notifications.map((note) => (
                  <div key={note.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex gap-3">
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                        note.type === 'warning' ? "bg-amber-500/20 text-amber-400" :
                        note.type === 'info' ? "bg-blue-500/20 text-blue-400" :
                        note.type === 'success' ? "bg-emerald-500/20 text-emerald-400" :
                        "bg-red-500/20 text-red-400"
                      )}>
                        {note.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                         note.type === 'info' ? <Info className="w-4 h-4" /> :
                         note.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                         <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">{note.title}</p>
                          <span className="text-xs text-white/40 whitespace-nowrap ml-2">{note.time}</span>
                        </div>
                        <p className="text-xs text-white/50 mt-1 leading-relaxed">{note.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-white/10 text-center">
                <button className="text-xs text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={clsx(
              "flex items-center gap-2 p-1.5 rounded transition-colors",
              showUserMenu
                ? "bg-emerald-500/20"
                : "hover:bg-white/10"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
              Eq
            </div>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-400">
                    Eq
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Equilibrium</p>
                    <p className="text-xs text-white/50">Facility Manager</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 text-white/60 hover:text-white md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
