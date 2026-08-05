import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, CheckCircle, ChevronRight, Activity } from 'lucide-react';

const AlertsPanel = ({ alerts = [] }) => {
  const defaultAlerts = [
    { id: 1, level: 'critical', title: 'Unauthorized Port Access', description: 'Port 3389 detected on Client-02', timestamp: '2 min ago' },
    { id: 2, level: 'warning', title: 'Compliance Drop', description: 'Client-05 compliance score dropped to 65%', timestamp: '5 min ago' },
    { id: 3, level: 'info', title: 'Antivirus Updated', description: 'All clients antivirus definitions updated', timestamp: '1 hour ago' },
  ];

  const displayAlerts = alerts.length > 0 ? alerts : defaultAlerts;

  const getAlertColor = (level) => {
    const colors = {
      critical: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300', icon: AlertTriangle },
      warning: { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-300', icon: AlertCircle },
      info: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', icon: CheckCircle },
    };
    return colors[level] || colors.info;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl overflow-hidden glass-panel flex flex-col h-[350px]"
    >
      <div className="p-4 border-b border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-cyan-500/5 to-transparent">
        <h3 className="text-xs font-bold font-['Space_Grotesk'] tracking-widest text-slate-100 uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          Recent Activity
        </h3>
        <button className="text-[10px] font-bold tracking-widest font-mono uppercase text-slate-500 hover:text-cyan-400 border border-slate-700/50 hover:border-cyan-500/50 px-2 py-1 rounded transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-1 max-h-[295px] overflow-y-auto p-4 bg-[#050b14]">
        {displayAlerts.map((alert, index) => {
          const alertColor = getAlertColor(alert.level);
          const AlertIcon = alertColor.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 cursor-pointer hover:bg-slate-800/60 transition-all group`}
            >
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-slate-500 w-16">{alert.timestamp}</span>
                <div className="relative flex items-center justify-center">
                  <div className={`w-0.5 h-10 absolute bg-slate-800 ${index === displayAlerts.length - 1 ? 'bottom-1/2' : ''} ${index === 0 ? 'top-1/2' : ''}`} />
                  <AlertIcon className={`w-4 h-4 ${alertColor.text} relative z-10 bg-slate-900 rounded-full`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-slate-300 font-mono text-[10px]">{alert.title}</h4>
                </div>
                <div className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase ${alertColor.bg} ${alertColor.text} border ${alertColor.border}`}>
                  {alert.level === 'critical' ? 'ALERT' : alert.level === 'info' ? 'INFO' : 'SUCCESS'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {displayAlerts.length === 0 && (
        <div className="py-12 text-center text-white/50">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No active alerts</p>
        </div>
      )}
    </motion.div>
  );
};

export default AlertsPanel;
