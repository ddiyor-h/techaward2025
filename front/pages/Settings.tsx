
import React, { useState } from 'react';
import { Save, User, Bell, Shield, Database, Smartphone, Globe, Moon } from 'lucide-react';
import { clsx } from 'clsx';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System & Integrations', icon: Database },
    { id: 'account', label: 'Account & Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full">
           <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
        </div>
        <div className="w-full md:w-auto flex justify-start md:justify-end mt-2 md:mt-0">
           <button className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-emerald-500/30">
             <Save className="w-4 h-4" />
             Save Changes
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-black/30 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
            <nav className="flex flex-col p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors text-left",
                    activeTab === tab.id
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-black/30 backdrop-blur-md rounded-lg border border-white/10 p-6">

            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">Platform Preferences</h3>
                  <p className="text-sm text-white/50 mb-4">Customize your dashboard experience.</p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-white/10 rounded text-white/60">
                           <Moon className="w-5 h-5" />
                         </div>
                         <div>
                           <p className="text-sm font-medium text-white">Dark Mode</p>
                           <p className="text-xs text-white/50">Toggle application theme</p>
                         </div>
                      </div>
                      <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full cursor-pointer bg-emerald-500">
                        <span className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm left-7"></span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/50 mb-1">Language</label>
                        <select className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50">
                          <option>English (US)</option>
                          <option>German</option>
                          <option>French</option>
                          <option>Spanish</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/50 mb-1">Timezone</label>
                        <select className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50">
                          <option>UTC (Coordinated Universal Time)</option>
                          <option>EST (Eastern Standard Time)</option>
                          <option>CET (Central European Time)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">Alert Configuration</h3>
                  <p className="text-sm text-white/50 mb-4">Manage how and when you receive alerts.</p>

                  <div className="space-y-4">
                    {[
                      { title: 'Critical Equipment Failures', desc: 'Immediate notification for offline critical assets (Chillers, Boilers)', email: true, push: true },
                      { title: 'High Energy Consumption', desc: 'Alert when consumption exceeds predicted baseline by >15%', email: true, push: false },
                      { title: 'IAQ Warnings', desc: 'When CO2 or PM2.5 levels reach unhealthy thresholds', email: false, push: true },
                      { title: 'Maintenance Reminders', desc: 'Weekly digest of upcoming maintenance tasks', email: true, push: false },
                    ].map((setting, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/10">
                         <div className="flex-1">
                           <p className="text-sm font-medium text-white">{setting.title}</p>
                           <p className="text-xs text-white/50">{setting.desc}</p>
                         </div>
                         <div className="flex gap-4 ml-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" defaultChecked={setting.email} className="w-4 h-4 rounded border-white/20 bg-black/30 text-emerald-500 focus:ring-emerald-500/30" />
                              <span className="text-xs text-white/50">Email</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" defaultChecked={setting.push} className="w-4 h-4 rounded border-white/20 bg-black/30 text-emerald-500 focus:ring-emerald-500/30" />
                              <span className="text-xs text-white/50">Push</span>
                            </label>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">BMS & IoT Integration</h3>
                  <p className="text-sm text-white/50 mb-4">Configure protocol gateways and data ingestion.</p>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                           <span className="font-medium text-white">BACnet/IP Gateway</span>
                        </div>
                        <span className="text-xs text-white/50 font-mono">192.168.1.105:47808</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="block text-xs text-white/50 mb-1">Poll Interval (ms)</label>
                           <input type="number" defaultValue="5000" className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                         </div>
                         <div>
                           <label className="block text-xs text-white/50 mb-1">Device Instance Range</label>
                           <input type="text" defaultValue="1000-2000" className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                         </div>
                      </div>
                    </div>

                    <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                           <span className="font-medium text-white">InfluxDB Storage</span>
                        </div>
                        <span className="text-xs text-emerald-400 font-medium bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/30">Connected</span>
                      </div>
                      <div>
                           <label className="block text-xs text-white/50 mb-1">Retention Policy</label>
                           <select className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50">
                             <option>90 Days Raw / 1 Year Aggregated</option>
                             <option>30 Days Raw / 6 Months Aggregated</option>
                           </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                 <div className="flex items-center gap-4 p-6 bg-black/20 rounded-lg border border-white/10">
                    <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center text-xl font-bold text-white/60">
                      Eq
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-white">Equilibrium</h4>
                      <p className="text-white/50 text-sm">Facility Manager • Admin Role</p>
                      <button className="text-emerald-400 text-sm mt-1 hover:text-emerald-300">Change Avatar</button>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/50 mb-1">Email Address</label>
                        <input type="email" defaultValue="admin@equilibrium.com" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/50 mb-1">Phone Number</label>
                        <input type="tel" defaultValue="+1 (555) 012-3456" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                       <h4 className="text-sm font-medium text-white mb-3">Security</h4>
                       <button className="text-sm text-white/70 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10 transition-colors mr-3">
                         Change Password
                       </button>
                       <button className="text-sm text-white/70 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10 transition-colors">
                         Enable 2FA
                       </button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
