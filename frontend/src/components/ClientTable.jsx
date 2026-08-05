import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Search, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const ClientTable = ({ clients }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status) => {
    const badges = {
      online: 'bg-green-500/20 text-green-300 border-green-500/30',
      offline: 'bg-red-500/20 text-red-300 border-red-500/30',
      connected: 'bg-green-500/20 text-green-300 border-green-500/30',
      disconnected: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return badges[String(status || '').toLowerCase()] || badges.offline;
  };

  const getComplianceBadge = (compliance) => {
    const badges = {
      compliant: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', icon: CheckCircle, border: 'border-emerald-500/30' },
      'non-compliant': { bg: 'bg-red-500/20', text: 'text-red-300', icon: AlertCircle, border: 'border-red-500/30' },
      warning: { bg: 'bg-amber-500/20', text: 'text-amber-300', icon: Clock, border: 'border-amber-500/30' },
    };
    return badges[String(compliance || '').toLowerCase()] || badges['non-compliant'];
  };

  const filteredClients = clients.filter(client =>
    String(client.agentId || client.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(client.hostname || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-cyan-500/20 shadow-lg"
    >
      {/* Header */}
      <div className="p-6 border-b border-cyan-500/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-cyan-400" />
            Connected Clients
          </h3>
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium">
            {filteredClients.length} clients
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyan-400/60" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-cyan-500/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cyan-500/10 bg-white/[0.02]">
              <th className="px-6 py-4 text-left text-cyan-300 font-semibold">Client ID</th>
              <th className="px-6 py-4 text-left text-cyan-300 font-semibold">Status</th>
              <th className="px-6 py-4 text-left text-cyan-300 font-semibold">Compliance</th>
              <th className="px-6 py-4 text-left text-cyan-300 font-semibold">Score</th>
              <th className="px-6 py-4 text-left text-cyan-300 font-semibold">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client, index) => {
              const agentLabel = client.hostname || client.id || client.agentId;
              const statusLabel = client.status || 'offline';
              const complianceLabel = client.compliance || (Number.isFinite(client.complianceScore) && client.complianceScore >= 80 ? 'compliant' : 'non-compliant');
              const complianceScore = Number.isFinite(client.complianceScore) ? client.complianceScore : client.score || 0;
              const complianceInfo = getComplianceBadge(complianceLabel);
              const ComplianceIcon = complianceInfo.icon;

              return (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(6, 182, 212, 0.05)' }}
                  className="border-b border-cyan-500/10 transition-colors"
                >
                  <td className="px-6 py-4 text-white font-medium">{agentLabel}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {String(statusLabel).toLowerCase() === 'online' || String(statusLabel).toLowerCase() === 'connected' ? (
                        <Wifi className="w-4 h-4 text-green-400" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(statusLabel)}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <ComplianceIcon className="w-4 h-4" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${complianceInfo.bg} ${complianceInfo.text} ${complianceInfo.border}`}>
                        {complianceLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full max-w-xs h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${complianceScore}%` }}
                          transition={{ duration: 1 }}
                          className={`h-full rounded-full ${
                            complianceScore >= 80
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                              : complianceScore >= 50
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                              : 'bg-gradient-to-r from-red-400 to-pink-500'
                          }`}
                        />
                      </div>
                      <span className="text-white font-medium min-w-[50px]">{complianceScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/70 text-xs">
                    {new Date(client.lastHeartbeat || client.lastSeen || Date.now()).toLocaleTimeString()}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredClients.length === 0 && (
        <div className="px-6 py-8 text-center text-white/50">
          No clients found
        </div>
      )}
    </motion.div>
  );
};

export default ClientTable;
