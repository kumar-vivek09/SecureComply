import React from 'react';
import { LayoutDashboard, Users, ShieldCheck, FileText, Settings, Shield, Clock } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div
      className="fixed left-0 top-0 h-screen w-64 border-r border-slate-800/80 z-50 flex flex-col bg-[#0B0F19]"
    >
      <div className="p-6 border-b border-slate-800/80 flex items-center gap-3 bg-[#0B0F19]">
        <div className="p-2 bg-cyan-500/10 rounded border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <Shield className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-sm font-bold font-['Space_Grotesk'] text-white tracking-widest leading-none">
            SECURECOMPLY
          </h1>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 bg-[#0B0F19]">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-cyan-500/10 text-cyan-500 border-l-4 border-cyan-400 shadow-[inset_0_0_30px_rgba(34,211,238,0.1)]'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </NavLink>
        <NavLink
          to="/clients"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-cyan-500/10 text-cyan-500 border-l-4 border-cyan-400 shadow-[inset_0_0_30px_rgba(34,211,238,0.1)]'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Users className="w-5 h-5" />
          Agents
        </NavLink>
        <NavLink
          to="/compliance"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-cyan-500/10 text-cyan-500 border-l-4 border-cyan-400 shadow-[inset_0_0_30px_rgba(34,211,238,0.1)]'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <ShieldCheck className="w-5 h-5" />
          Compliance
        </NavLink>
        <NavLink
          to="/reports"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-cyan-500/10 text-cyan-500 border-l-4 border-cyan-400 shadow-[inset_0_0_30px_rgba(34,211,238,0.1)]'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <FileText className="w-5 h-5" />
          Reports
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-cyan-500/10 text-cyan-500 border-l-4 border-cyan-400 shadow-[inset_0_0_30px_rgba(34,211,238,0.1)]'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Clock className="w-5 h-5" />
          Audit Logs
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-800/80 bg-[#0B0F19]">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-cyan-500/10 text-cyan-500 border-l-4 border-cyan-400 shadow-[inset_0_0_30px_rgba(34,211,238,0.1)]'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
