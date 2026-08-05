import React from 'react';
import { Users, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const MetricCard = ({ title, value, icon: Icon, color, delay, sparklineData, strokeColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="rounded-xl border border-slate-800/80 hover:border-t-cyan-500/50 hover:border-l-cyan-500/30 bg-[#0B1221]/60 p-6 shadow-lg shadow-cyan-900/10 backdrop-blur-2xl relative overflow-hidden group flex flex-col hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(6,182,212,0.3)] transition-all duration-300 h-40"
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
    
    {sparklineData && (
      <div className="absolute bottom-0 left-0 right-0 h-24 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line type="monotone" dataKey="v" stroke={strokeColor} strokeWidth={2} dot={false} isAnimationActive={true} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}

    <div className="flex flex-col h-full justify-between relative z-10 pointer-events-none">
      <div>
        <Icon className={`w-6 h-6 text-slate-400 group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] transition-all duration-300`} />
      </div>
      <div>
        <div className={`text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br ${color} drop-shadow-sm`}>{value}</div>
        <h3 className="text-[#94A3B8] text-sm font-semibold tracking-wide uppercase mt-1">{title}</h3>
      </div>
    </div>
  </motion.div>
);

const MetricCards = ({ stats }) => {
  const totalClientsValue = stats?.totalClients !== undefined ? stats.totalClients : 'N/A';
  const compliantValue = stats?.compliant !== undefined ? stats.compliant : 'N/A';
  const nonCompliantValue = stats?.nonCompliant !== undefined ? stats.nonCompliant : 'N/A';
  const complianceScoreValue = stats?.complianceScore !== undefined ? `${stats.complianceScore}%` : 'N/A';
  // Mock sparkline trends for visual flair
  const sparkline1 = [{v:60},{v:65},{v:62},{v:70},{v:85},{v:82},{v:90},{v:95},{v:91},{v:98}];
  const sparkline2 = [{v:2},{v:3},{v:3},{v:4},{v:4},{v:5},{v:5},{v:6},{v:6},{v:7}];
  const sparkline3 = [{v:1},{v:1},{v:2},{v:3},{v:4},{v:4},{v:5},{v:6},{v:6},{v:7}];
  const sparkline4 = [{v:3},{v:2},{v:4},{v:1},{v:2},{v:1},{v:1},{v:0},{v:1},{v:0}];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard 
        title="Overall Compliance" 
        value={complianceScoreValue} 
        icon={ShieldCheck} 
        color="from-cyan-400 to-blue-500"
        delay={0.1}
        sparklineData={sparkline1}
        strokeColor="#22d3ee"
      />
      <MetricCard 
        title="Connected Agents" 
        value={totalClientsValue} 
        icon={Users} 
        color="from-blue-400 to-indigo-500"
        delay={0.2}
        sparklineData={sparkline2}
        strokeColor="#60a5fa"
      />
      <MetricCard 
        title="Compliant Agents" 
        value={compliantValue} 
        icon={ShieldCheck} 
        color="from-emerald-400 to-green-500"
        delay={0.3}
        sparklineData={sparkline3}
        strokeColor="#34d399"
      />
      <MetricCard 
        title="Non-Compliant Agents" 
        value={nonCompliantValue} 
        icon={AlertTriangle} 
        color="from-amber-400 to-orange-500"
        delay={0.4}
        sparklineData={sparkline4}
        strokeColor="#fbbf24"
      />
    </div>
  );
};

export default MetricCards;
