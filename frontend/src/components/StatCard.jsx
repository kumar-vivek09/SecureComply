import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  trend = 5,
  trendType = 'up',
  unit = '',
  isLoading = false
}) => {
  const gradients = {
    blue: 'from-blue-600 to-cyan-600',
    green: 'from-green-600 to-emerald-600',
    red: 'from-red-600 to-pink-600',
    purple: 'from-purple-600 to-pink-600',
    amber: 'from-amber-600 to-orange-600',
  };

  const glowColors = {
    blue: 'from-blue-500/20 to-cyan-500/20',
    green: 'from-green-500/20 to-emerald-500/20',
    red: 'from-red-500/20 to-pink-500/20',
    purple: 'from-purple-500/20 to-pink-500/20',
    amber: 'from-amber-500/20 to-orange-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="relative overflow-hidden glass-card rounded-2xl p-6 group"
    >
      {/* Top Gradient Border Glow */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradients[color]} opacity-80 group-hover:opacity-100 transition-opacity`} />

      {/* Background Ambient Glow */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${glowColors[color]} rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500`} />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-xl bg-slate-900/80 border border-slate-700/50 group-hover:border-${color}-500/50 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors`}>
            <Icon className={`w-6 h-6 text-${color === 'red' ? 'rose' : color === 'green' ? 'emerald' : 'cyan'}-400`} />
          </div>
          <div className="flex-1">
            <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mb-1 font-mono">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold font-['Space_Grotesk'] text-slate-100">
                {isLoading ? '...' : value}
              </h3>
              {unit && <span className="text-slate-500 font-mono">{unit}</span>}
            </div>
          </div>
        </div>

        {/* Trend Indicator & Mock Sparkline */}
        <div className="flex items-end justify-between mt-2 pt-4 border-t border-slate-800/50">
          <div className="flex flex-col gap-1">
            <span className="text-slate-500 text-[9px] font-mono uppercase tracking-widest">{title === 'Last Scan' ? 'May 25, 2025 10:30 PM' : 'Enterprise Average'}</span>
          </div>
          
          {trendType && trend !== 0 && (
            <div className={`flex items-center gap-1 text-[10px] font-bold font-mono ${trendType === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trendType === 'up' ? '▲' : '▼'} {trend}%
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
