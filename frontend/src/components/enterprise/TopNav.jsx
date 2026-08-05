import React, { useEffect, useState, useRef } from 'react';
import { LogOut, Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getUser, logout } from '../../services/auth';
import api from '../../services/api';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001');

const TopNav = () => {
  const [clientCount, setClientCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const user = getUser() || { username: 'Admin User', role: 'SUPER ADMINISTRATOR' };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats');
        setClientCount(response.data?.totalClients || 0);
      } catch (error) {
        console.error('Error fetching stats for TopNav:', error);
      }
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 30000);

    const handleAlert = (data) => {
      setNotifications(prev => [{ ...data, id: Date.now() }, ...prev].slice(0, 10)); // keep last 10
    };
    socket.on('alert', handleAlert);

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      socket.off('alert', handleAlert);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="h-16 border-b border-slate-800/80 bg-[#0B0F19] flex items-center justify-end px-6 shrink-0 w-full">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-xs font-medium tracking-wider text-emerald-500 uppercase">{clientCount} CLIENTS CONNECTED</span>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 transition-colors rounded-full ${showNotifications ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-[#0B0F19]"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[400px]">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={() => setNotifications([])} className="text-xs text-slate-400 hover:text-white transition-colors">
                    Clear all
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {notifications.length === 0 ? (
                  <div className="text-center p-6 text-sm text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 group relative">
                      <div className="text-xs font-medium text-slate-200 pr-6">{notif.message}</div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{notif.type} • Just now</div>
                      <button 
                        onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                        className="absolute right-2 top-2 p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-l border-slate-800/80 pl-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-200">{user.username}</div>
              <div className="text-[10px] font-bold text-amber-500 tracking-wider uppercase">{user.role || 'SUPER ADMINISTRATOR'}</div>
            </div>
            <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
              {user.username ? user.username.charAt(0).toUpperCase() : 'A'}
            </div>
            <button 
              onClick={handleLogout}
              className="ml-2 p-2 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-800/50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
