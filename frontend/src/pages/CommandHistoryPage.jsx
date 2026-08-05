import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

const CommandHistoryPage = () => {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/command-history', { params: { search, status } });
        setRows(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to load command history:', error);
      }
    };

    fetchHistory();
  }, [search, status]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-800 bg-[#0a0f1a]/80 p-6 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-white">Audit Logs</h2>
        <p className="mt-2 text-sm text-slate-400">Search past execution events by client, command, or status.</p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search client, hostname, or command"
          className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="sent">Sent</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0a0f1a]/80 shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-xs uppercase tracking-widest">
            <tr>
              <th className="px-5 py-4">Client</th>
              <th className="px-5 py-4">Action / Module</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Timestamp</th>
              <th className="px-5 py-4">Execution Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.commandId} className="border-b border-slate-800/50 text-slate-300 hover:bg-slate-800/20 transition-colors">
                <td className="px-5 py-4 font-medium text-white">{row.hostname || row.agentId || 'Unknown'}</td>
                <td className="px-5 py-4">{row.commandType || 'N/A'}</td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${row.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : row.status === 'failed' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-400'}`}>
                    {row.status || 'N/A'}
                  </span>
                </td>
                <td className="px-5 py-4">{row.requestedAt ? new Date(row.requestedAt).toLocaleString() : 'N/A'}</td>
                <td className="px-5 py-4 text-slate-400">{row.resultSummary || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="p-8 text-center text-slate-400 bg-slate-900/20">
            No audit logs available
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandHistoryPage;