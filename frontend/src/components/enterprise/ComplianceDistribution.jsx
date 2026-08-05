import React from 'react';
import { Shield } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts';
import { motion } from 'framer-motion';

const ComplianceDistribution = ({ stats }) => {
  const { compliant, nonCompliant, complianceScore } = stats || {};
  
  const hasData = (compliant !== undefined && nonCompliant !== undefined) && (compliant > 0 || nonCompliant > 0);
  
  if (!hasData) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0B1221]/60 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl h-full min-h-[350px] flex flex-col">
        <h3 className="text-white font-medium mb-4">Compliance Distribution</h3>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Shield className="w-12 h-12 text-slate-700 opacity-50" />
          <div className="flex flex-col items-center gap-1">
            <p className="text-[#94A3B8] font-medium text-sm">No compliance data available</p>
            <p className="text-slate-500 text-xs">Waiting for endpoint scan results</p>
          </div>
        </div>
      </div>
    );
  }

  const data = [
    { name: 'Compliant', value: compliant, color: 'url(#colorCompliant)' }, 
    { name: 'Non-Compliant', value: nonCompliant, color: 'url(#colorNonCompliant)' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="rounded-xl border border-slate-800/80 hover:border-t-cyan-500/30 bg-[#0B1221]/60 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col h-full min-h-[350px] transition-all duration-300 relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

      <h3 className="text-white font-medium mb-4 relative z-10">Compliance Distribution</h3>
      <div className="flex-1 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id="colorCompliant" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={1}/>
                <stop offset="95%" stopColor="#059669" stopOpacity={0.8}/>
              </linearGradient>
              <linearGradient id="colorNonCompliant" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={1}/>
                <stop offset="95%" stopColor="#D97706" stopOpacity={0.8}/>
              </linearGradient>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.4" />
              </filter>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={8}
              cornerRadius={8}
              dataKey="value"
              stroke="none"
              style={{ filter: 'url(#shadow)' }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <Label 
                value={complianceScore ? `${complianceScore}%` : '0%'} 
                position="center" 
                fill="#fff" 
                style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'system-ui' }} 
              />
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#fff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
              itemStyle={{ color: '#E2E8F0', fontWeight: '500' }}
              cursor={{ fill: 'transparent' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4 relative z-10">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
            <div 
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
              style={{ 
                background: entry.name === 'Compliant' ? 'linear-gradient(to bottom, #10B981, #059669)' : 'linear-gradient(to bottom, #F59E0B, #D97706)' 
              }} 
            />
            <span className="text-slate-300 text-xs font-medium">{entry.name}: <span className="text-white ml-1">{entry.value}</span></span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ComplianceDistribution;
