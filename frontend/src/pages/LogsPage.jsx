import React from 'react';
import { motion } from 'framer-motion';
import LogsPanel from '../components/LogsPanel';

const LogsPage = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-cyan-500/20 bg-slate-950/80 p-6 shadow-xl shadow-cyan-500/10"
      >
        <h2 className="text-2xl font-bold text-white">Live Security Logs</h2>
        <p className="mt-2 text-sm text-slate-400">
          Full system event stream with color-coded log levels and real-time updates.
        </p>
      </motion.div>

      <LogsPanel />
    </div>
  );
};

export default LogsPage;
