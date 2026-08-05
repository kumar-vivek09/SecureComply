import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

const mockData = [
  { time: '00:00', compliance: 85, threats: 12 },
  { time: '04:00', compliance: 88, threats: 8 },
  { time: '08:00', compliance: 82, threats: 15 },
  { time: '12:00', compliance: 95, threats: 3 },
  { time: '16:00', compliance: 91, threats: 7 },
  { time: '20:00', compliance: 98, threats: 2 },
  { time: '24:00', compliance: 100, threats: 0 },
];

const TrendChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-xl border border-slate-800/80 hover:border-t-cyan-500/50 bg-[#0B1221]/60 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative overflow-hidden transition-all duration-300 w-full h-[350px] mb-6 flex flex-col group"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-500" />
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Network Compliance Trend</h3>
            <p className="text-slate-400 text-xs">24-hour historical activity</p>
          </div>
        </div>
        <div className="flex gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-slate-300">Compliance Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            <span className="text-slate-300">Active Threats</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
              itemStyle={{ fontWeight: 500 }}
            />
            <Area type="monotone" dataKey="compliance" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorCompliance)" activeDot={{ r: 6, strokeWidth: 0, fill: '#22d3ee' }} />
            <Area type="monotone" dataKey="threats" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorThreats)" activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default TrendChart;
