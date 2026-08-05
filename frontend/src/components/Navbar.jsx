import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, User, ChevronDown, LogOut, Settings } from 'lucide-react';

const Navbar = ({ userName = 'Admin', onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notificationCount] = useState(5);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-[250px] right-0 h-16 glass-panel border-t-0 border-r-0 z-30"
    >
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative w-full max-w-xl group">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 font-mono text-sm opacity-70 group-focus-within:opacity-100 transition-opacity">
              &gt;_
            </span>
            <input
              type="text"
              placeholder="search agents, modules, logs..."
              className="w-full bg-[#0a1121]/80 border border-slate-700/50 rounded-xl pl-12 pr-16 py-2.5 text-sm text-slate-300 placeholder:text-slate-500 placeholder:font-mono focus:border-cyan-500/50 focus:bg-[#0a1121] focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 opacity-50">
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono border border-slate-700">CTRL</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono border border-slate-700">K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6 ml-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-cyan-400" />
            {notificationCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              >
                {notificationCount}
              </motion.span>
            )}
          </motion.button>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 pl-3 pr-2 py-1.5 hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50 rounded-full transition-all"
            >
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-bold text-slate-200">Admin User</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Super Administrator</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 font-bold text-sm shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                {userName.charAt(0).toUpperCase()}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </motion.button>

            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 glass-panel rounded-lg overflow-hidden"
              >
                <div className="p-2 space-y-1">
                  <button className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-cyan-500/10 rounded text-sm">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>Profile</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-cyan-500/10 rounded text-sm">
                    <Settings className="w-4 h-4 text-cyan-400" />
                    <span>Settings</span>
                  </button>
                  <hr className="border-cyan-500/10" />
                  <button
                    onClick={() => {
                      onLogout?.();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-red-500/10 rounded text-sm text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Navbar;
