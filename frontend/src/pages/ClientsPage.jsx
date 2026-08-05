import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Clock3, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [reportsByClient, setReportsByClient] = useState({});
  const [selectedClientId, setSelectedClientId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    const response = await api.get('/clients');
    const list = (Array.isArray(response.data) ? response.data : []).map((client) => ({
      ...client,
      agentId: client.agentId || client.clientId || client.id || String(client._id || ''),
      hostname: client.hostname || client.clientId || client.agentId || 'unknown-host',
    }));
    setClients(list);
    if (!selectedClientId && list.length > 0) {
      setSelectedClientId(list[0].agentId);
    }
  }, [selectedClientId]);

  const fetchReports = async (agentId) => {
    if (!agentId) {
      return;
    }

    const response = await api.get(`/clients/${agentId}/reports`);
    setReportsByClient((prev) => ({
      ...prev,
      [agentId]: Array.isArray(response.data) ? response.data : [],
    }));
  };

  useEffect(() => {
    const load = async () => {
      try {
        await fetchClients();
      } catch (error) {
        console.error('Fetch clients failed:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [fetchClients]);

  useEffect(() => {
    if (selectedClientId) {
      fetchReports(selectedClientId).catch((error) => console.error('Fetch reports failed:', error));
    }
  }, [selectedClientId]);

  const selectedReports = useMemo(() => reportsByClient[selectedClientId] || [], [reportsByClient, selectedClientId]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-6 shadow-xl shadow-cyan-500/10"
      >
        <h2 className="text-2xl font-bold text-white">Connected Clients</h2>
        <p className="mt-2 text-sm text-slate-400">
          Live inventory of connected agents, their heartbeat, and compliance state.
        </p>
      </motion.div>

      {loading ? (
        <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-10 text-center text-slate-400">
          Loading clients...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/80 shadow-xl shadow-cyan-500/10">
            <div className="border-b border-cyan-500/10 p-5">
              <h3 className="text-lg font-bold text-white">Inventory</h3>
            </div>
            <div className="divide-y divide-cyan-500/10">
              {clients.map((client) => (
                <button
                  key={client.agentId}
                  onClick={() => setSelectedClientId(client.agentId)}
                  className={`w-full px-5 py-4 text-left transition-colors hover:bg-cyan-500/5 ${selectedClientId === client.agentId ? 'bg-cyan-500/10' : ''}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-white">{client.hostname}</div>
                      <div className="text-xs text-slate-400">{client.agentId} · {client.ipAddress}</div>
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${client.status === 'online' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-500/30 bg-slate-500/10 text-slate-300'}`}>
                      {client.status === 'online' ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                      {client.status}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
                    <div className="rounded-2xl bg-white/5 px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-slate-500">OS</div>
                      <div>{client.osName}</div>
                    </div>
                    <div className="rounded-2xl bg-white/5 px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Heartbeat</div>
                      <div>{client.lastHeartbeat ? new Date(client.lastHeartbeat).toLocaleString() : 'n/a'}</div>
                    </div>
                    <div className="rounded-2xl bg-white/5 px-3 py-2">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Compliance</div>
                      <div>{Number.isFinite(client.complianceScore) ? `${client.complianceScore}%` : '0%'}</div>
                    </div>
                  </div>
                </button>
              ))}

              {clients.length === 0 && (
                <div className="p-8 text-center text-slate-400">No connected clients yet.</div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-5 shadow-xl shadow-cyan-500/10">
              <div className="flex items-center gap-2 text-white">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-bold">Selected Client</h3>
              </div>
              {selectedClientId ? (
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <div>Agent ID: <span className="text-white">{selectedClientId}</span></div>
                  <div>Last compliance check: <span className="text-white">{selectedReports[0]?.generatedAt ? new Date(selectedReports[0].generatedAt).toLocaleString() : 'No report yet'}</span></div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-400">Select a client to view compliance history.</div>
              )}
            </div>

            <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-5 shadow-xl shadow-cyan-500/10">
              <div className="flex items-center gap-2 text-white">
                <Clock3 className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-bold">Compliance Reports</h3>
              </div>

              <div className="mt-4 space-y-3">
                {selectedReports.map((report, index) => (
                  <div key={`${report._id || index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white">{report.summary || 'Compliance report'}</div>
                      <div className="text-xs text-slate-400">{report.generatedAt ? new Date(report.generatedAt).toLocaleString() : ''}</div>
                    </div>
                    <div className="mt-2 grid gap-2 text-xs uppercase tracking-wide text-slate-500 sm:grid-cols-2">
                      <div>Risk: {report.riskLevel}</div>
                      <div>Score: {report.complianceScore}%</div>
                    </div>
                  </div>
                ))}

                {selectedClientId && selectedReports.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-400">
                    No compliance reports recorded for this client yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
