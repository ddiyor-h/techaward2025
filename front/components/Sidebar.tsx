
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, Wind, Leaf, Activity, Settings, ThermometerSun, X, FlaskConical, PanelLeftClose, PanelLeft } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
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
      {/* Centered sidebar container - always fixed, doesn't affect layout */}
      <div className={clsx(
        "fixed left-0 top-0 h-screen z-50 flex items-center",
        // On mobile: pointer-events only when open, on desktop: always none on container
        isOpen ? "pointer-events-auto" : "pointer-events-none md:pointer-events-none"
      )}>
        <div
          className={clsx(
            "flex flex-col ml-3 overflow-hidden pointer-events-auto",
            "bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl",
            "transition-all duration-300 ease-in-out",
            isCollapsed ? "w-14" : "w-56",
            isOpen ? "translate-x-0 opacity-100" : "-translate-x-full md:translate-x-0 md:opacity-100 opacity-0"
          )}
        >
          {/* Mobile Close Button */}
          <div className="md:hidden flex justify-end p-2">
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="py-3 space-y-1 px-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center rounded-lg text-sm font-medium border border-transparent whitespace-nowrap',
                    'transition-colors duration-200',
                    isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className={clsx(
                  "transition-opacity duration-200",
                  isCollapsed ? "opacity-0 w-0" : "opacity-100"
                )}>
                  {item.name}
                </span>
              </NavLink>
            ))}

            {/* Toggle Button - right after Settings */}
            <button
              onClick={onToggleCollapse}
              className={clsx(
                "flex items-center rounded-lg text-sm font-medium border border-transparent w-full mt-2 whitespace-nowrap",
                "transition-colors duration-200",
                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
                "text-white/60 hover:text-white hover:bg-white/5"
              )}
              title={isCollapsed ? "Expand menu" : "Collapse menu"}
            >
              {isCollapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <>
                  <PanelLeftClose className="w-5 h-5 flex-shrink-0" />
                  <span className={clsx(
                    "transition-opacity duration-200",
                    isCollapsed ? "opacity-0 w-0" : "opacity-100"
                  )}>Collapse</span>
                </>
              )}
            </button>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
