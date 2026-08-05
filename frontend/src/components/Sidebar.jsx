import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  History,
  Settings,
  Menu,
  X,
  Shield,
  Activity
} from 'lucide-react';

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  const menuItems = [
    { icon: LayoutDashboard, label: 'DASHBOARD', to: '/dashboard' },
    { icon: Users, label: 'AGENTS', to: '/clients' },
    { icon: Shield, label: 'COMPLIANCE', to: '/compliance' },
    { icon: AlertTriangle, label: 'THREATS', to: '/health' },
    { icon: FileText, label: 'REPORTS', to: '/logs' },
    { icon: History, label: 'AUDIT LOGS', to: '/history' },
    { icon: Settings, label: 'SETTINGS', to: '/settings' },
  ];

  return (
    <motion.div
      initial={{ width: isExpanded ? 250 : 80 }}
      animate={{ width: isExpanded ? 250 : 80 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-screen glass-panel rounded-none border-y-0 border-l-0 z-40"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
          <motion.div
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg font-['Space_Grotesk'] tracking-wider text-slate-100 leading-tight">SECURE<span className="text-cyan-400">COMPLY</span></span>
              <span className="text-[10px] text-slate-500 tracking-widest uppercase">Enterprise SOC</span>
            </div>
          </motion.div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-cyan-500/10 rounded-lg transition-colors absolute right-4 text-slate-400 hover:text-cyan-400"
          >
            {isExpanded ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item, index) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-4 px-4 py-3.5 rounded-lg transition-all duration-300 group ${
                  isActive 
                  ? 'bg-gradient-to-r from-cyan-500/30 to-transparent border-l-4 border-cyan-400 text-white shadow-[inset_0_0_30px_rgba(34,211,238,0.2)] bg-cyan-900/20' 
                  : 'text-slate-400 hover:text-white hover:bg-[#111827] hover:translate-x-1 border-l-4 border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 shrink-0 transition-all ${isActive ? 'text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]' : isExpanded ? 'text-cyan-500/70' : 'text-cyan-500/50'} group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]`} />
                  <motion.span
                    animate={{ opacity: isExpanded ? 1 : 0, display: isExpanded ? 'block' : 'none' }}
                    transition={{ duration: 0.2 }}
                    className="text-xs font-semibold tracking-wider font-mono"
                  >
                    {item.label}
                  </motion.span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {isExpanded && (
          <div className="p-6 border-t border-slate-800/50">
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col gap-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">System Status</span>
                  <span className="text-xs font-bold text-emerald-400 tracking-wider">SECURE</span>
                </div>
              </div>
              <div className="h-6 w-full border-b border-emerald-500/30 relative">
                 <div className="absolute bottom-0 left-0 w-full h-[1px] bg-emerald-500/50"></div>
                 <svg viewBox="0 0 100 20" className="absolute bottom-0 w-full h-full stroke-emerald-400 fill-none opacity-50 stroke-1">
                   <path d="M0,15 L20,15 L25,5 L30,20 L35,10 L40,15 L100,15" />
                 </svg>
              </div>
            </div>
            
            <div className="mt-4 text-[10px] text-slate-600 flex flex-col gap-1">
              <span>© 2026 SecureComply Inc.</span>
              <span>All rights reserved.</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;
