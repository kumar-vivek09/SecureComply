import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Shield } from 'lucide-react';

const ConnectedEndpointsTable = ({ clients }) => {
  if (!clients || clients.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-[#0B1221]/60 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col h-64 overflow-hidden">
        <div className="p-6 border-b border-slate-800/80">
          <h3 className="text-white font-medium">Connected Endpoints</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#94A3B8] font-medium text-sm">No connected endpoints</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-xl border border-slate-800/80 hover:border-t-cyan-500/50 hover:border-l-cyan-500/30 bg-[#0B1221]/60 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden transition-all duration-300 h-full flex flex-col relative group"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-500" />
      <div className="p-6 border-b border-slate-800/80 relative z-10">
        <h3 className="text-white font-medium">Connected Endpoints</h3>
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/50 bg-slate-900/50">
              <th className="py-4 px-6 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Hostname</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Status</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Score</th>
              <th className="py-4 px-6 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Last Check</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {clients.map((client) => {
              const isOnline = client.status === 'online' || client.status === 'connected';
              const scoreValue = client.complianceScore !== undefined && client.complianceScore !== null 
                ? `${client.complianceScore}%` 
                : 'N/A';
              
              return (
                <tr key={`${client.agentId}-${client.hostname}`} className="hover:bg-slate-800/30 transition-colors h-16">
                  <td className="py-3 px-6 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800/80 rounded-lg">
                        <Monitor className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-200">{client.hostname || 'unknown'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-6 align-middle">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                      <span className="text-sm font-medium text-slate-300 uppercase tracking-wide text-[11px]">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-6 align-middle">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                      <span className="text-sm font-medium text-slate-300">
                        {scoreValue}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-6 align-middle text-sm text-slate-400">
                    {client.lastComplianceCheck 
                      ? new Date(client.lastComplianceCheck).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Never'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ConnectedEndpointsTable;
