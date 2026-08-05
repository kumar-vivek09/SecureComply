import React from 'react';
import { Bell, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold font-['Space_Grotesk'] text-white mb-2">COMMAND CENTER</h1>
        <p className="text-slate-400 text-sm">Monitor and manage endpoint compliance in real-time</p>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-xs text-slate-500 font-medium">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="text-right">
              <div className="text-sm font-semibold text-white">Admin User</div>
              <div className="text-xs text-slate-500">Security Operator</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
