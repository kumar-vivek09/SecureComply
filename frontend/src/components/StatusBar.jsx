import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';
import api from '../services/api';

const StatusBar = () => {
  const { isConnected, startupState } = useSocket();
  const [stats, setStats] = useState({ online: 0, pending: 0, lastHeartbeat: null });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats');
        setStats(prev => ({ ...prev, online: response.data.online }));
      } catch (e) {
        // ignore
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const isReady = isConnected && startupState?.state === 'READY';
  
  return (
    <div className="bg-slate-900 border-b border-cyan-500/20 px-6 py-2 flex items-center justify-between text-xs fixed top-16 left-[250px] right-0 z-40 shadow-sm shadow-cyan-900/10">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {isReady ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              System Ready
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {startupState?.state || 'Connecting...'}
            </span>
          )}
        </div>
        
        <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>{stats.online} Clients Connected</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
