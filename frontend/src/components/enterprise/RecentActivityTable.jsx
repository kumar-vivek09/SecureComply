import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, CheckCircle, Info, Clock } from 'lucide-react';
import api from '../../services/api';

const RecentActivityTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/command-history');
        const historyData = Array.isArray(response.data) ? response.data.slice(0, 8) : [];
        
        // Map live command history to the activity log format
        const mappedLogs = historyData.map(h => ({
          id: h._id || Math.random().toString(),
          timestamp: h.requestedAt || h.createdAt,
          level: h.status === 'failed' || h.status === 'timed_out' ? 'error' : (h.status === 'completed' ? 'success' : 'info'),
          message: `Command ${h.commandType} on ${h.hostname} - ${h.status.toUpperCase()}`,
        }));
        
        setLogs(mappedLogs);
      } catch (error) {
        console.error('Failed to fetch recent activity logs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0B1221]/60 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col h-64 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="p-2 bg-slate-800/80 rounded-lg">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-white font-medium">Recent Activity</h3>
        </div>
        <div className="flex-1 flex items-center justify-center animate-pulse">
          <div className="w-8 h-8 rounded-full border-t-2 border-b-2 border-cyan-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0B1221]/60 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col h-64 overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="p-2 bg-slate-800/80 rounded-lg">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-white font-medium">Recent Activity</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <ShieldAlert className="w-8 h-8 text-slate-700 opacity-50" />
          <p className="text-[#94A3B8] font-medium text-sm">No recent compliance activity available</p>
        </div>
      </div>
    );
  }

  const getIconInfo = (level) => {
    switch (level?.toLowerCase()) {
      case 'error':
      case 'critical':
        return { icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
      case 'warning':
        return { icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
      case 'success':
        return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
      default:
        return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="rounded-xl border border-slate-800/80 hover:border-t-cyan-500/30 bg-[#0B1221]/60 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden transition-all duration-300 mb-8"
    >
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-white font-medium">Activity Timeline</h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
          <Clock className="w-3.5 h-3.5" />
          Live Updates
        </div>
      </div>
      
      <div className="p-6">
        <div className="relative border-l border-slate-800 ml-4 space-y-6">
          {logs.map((log, index) => {
            const { icon: Icon, color, bg, border } = getIconInfo(log.level);
            return (
              <motion.div 
                key={log.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="relative pl-6 group"
              >
                {/* Glowing Dot on the timeline */}
                <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full ${bg} ${border} border flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                
                {/* Content Card */}
                <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4 hover:bg-slate-800/50 transition-colors duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-200">{log.message}</span>
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default RecentActivityTable;
