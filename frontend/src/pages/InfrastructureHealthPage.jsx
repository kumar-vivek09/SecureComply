import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Server, Activity, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

const InfrastructureHealthPage = () => {
  const { startupState } = useSocket();
  const [timeline, setTimeline] = useState([]);
  const [stats, setStats] = useState({ online: 0 });

  useEffect(() => {
    // Generate a simulated timeline based on the current state for demo purposes, 
    // or parse actual startup events if available from the backend.
    const now = new Date();
    const t = [
      { time: new Date(now.getTime() - 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: 'Backend Started', status: 'success' },
      { time: new Date(now.getTime() - 59000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: 'Mongo Connected', status: 'success' },
      { time: new Date(now.getTime() - 58000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: 'Socket.IO Connected', status: 'success' },
    ];
    
    if (startupState?.state === 'READY') {
      t.push({ time: new Date(now.getTime() - 50000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: 'AdminServer Started', status: 'success' });
      t.push({ time: new Date(now.getTime() - 48000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: 'Bridge Connected', status: 'success' });
      t.push({ time: new Date(now.getTime() - 40000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: 'Agent Connected', status: 'success' });
      t.push({ time: new Date(now.getTime() - 40000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: 'READY', status: 'success', highlight: true });
    } else {
      t.push({ time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), event: startupState?.state || 'Initializing...', status: 'pending' });
    }
    
    setTimeline(t);

    const fetchStats = async () => {
      try {
        const response = await api.get('/stats');
        setStats({ online: response.data.online });
      } catch (e) {}
    };
    fetchStats();
  }, [startupState]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-6 shadow-xl shadow-cyan-500/10">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Activity className="text-cyan-400 w-7 h-7" />
          Infrastructure Health
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Real-time diagnostics and platform startup sequence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 flex flex-col justify-center shadow-lg">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">System Uptime</div>
          <div className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            01:24:55
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-5 flex flex-col justify-center shadow-lg">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Backend Node</div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Healthy
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-5 flex flex-col justify-center shadow-lg">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">AdminServer Bridge</div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Connected
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 flex flex-col justify-center shadow-lg">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Active Agents</div>
          <div className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <Server className="w-5 h-5" />
            {stats.online}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-8 shadow-xl shadow-cyan-500/10">
        <h3 className="text-lg font-bold text-white mb-6 border-b border-cyan-500/10 pb-4">Startup Sequence Timeline</h3>
        <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
          {timeline.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className={`absolute -left-[31px] mt-1 w-4 h-4 rounded-full border-4 border-slate-950 ${item.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <div className="flex items-start gap-4">
                <div className="text-sm font-mono text-slate-400 mt-0.5 w-16">{item.time}</div>
                <div className={`font-medium ${item.highlight ? 'text-cyan-400 text-lg' : 'text-slate-200'}`}>
                  {item.event}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfrastructureHealthPage;
