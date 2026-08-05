import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, RefreshCw, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const LogsPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasNewLogs, setHasNewLogs] = useState(false);
  const isAtBottomRef = useRef(true);
  const scrollContainerRef = useRef(null);
  const { subscribe } = useSocket();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/logs');
      const logsArray = Array.isArray(response.data) ? response.data : [];
      setLogs(logsArray.slice(0, 50));
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const threshold = 24;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;

    isAtBottomRef.current = atBottom;

    if (atBottom) {
      setHasNewLogs(false);
    }
  };

  const jumpToBottom = () => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    setHasNewLogs(false);
    isAtBottomRef.current = true;
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe('new-log', (log) => {
      setLogs(prev => {
        const updated = [...prev, log];
        if (!isAtBottomRef.current) {
          setHasNewLogs(true);
        }
        return updated.slice(-100); // Keep only last 100 logs
      });
    });

    return unsubscribe;
  }, [subscribe]);

  const clearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      setLogs([]);
      setHasNewLogs(false);
    }
  };

  const getLogLevel = (log) => {
    const message = typeof log === 'string' ? log : log.message;
    const levelText = String(message).toLowerCase();
    if (levelText.includes('error') || levelText.includes('failed')) return 'error';
    if (levelText.includes('warning') || levelText.includes('warn')) return 'warning';
    return 'info';
  };

  const getLogIcon = (level) => {
    const icons = {
      error: <AlertCircle className="w-4 h-4" />,
      warning: <AlertTriangle className="w-4 h-4" />,
      info: <Info className="w-4 h-4" />,
    };
    return icons[level] || icons.info;
  };

  const getLogColor = (level) => {
    const colors = {
      error: 'text-red-400 bg-red-500/10 border-red-500/30',
      warning: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      info: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    };
    return colors[level] || colors.info;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-xl overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-lg border border-cyan-500/20 shadow-lg"
    >
      <div className="p-6 border-b border-cyan-500/10 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live System Logs
          </h3>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearLogs}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-2">
        {hasNewLogs && (
          <button
            type="button"
            onClick={jumpToBottom}
            className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 transition-colors hover:bg-cyan-500/20"
          >
            New Logs Available
          </button>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-80 overflow-y-auto bg-slate-950/80 p-4 space-y-2 font-mono text-xs"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/50">
            <p>No logs available</p>
          </div>
        ) : (
          logs.map((log, index) => {
            const level = getLogLevel(log);
            const logText = typeof log === 'string' ? log : log.message;
            const timestamp = typeof log === 'string' ? '' : log.timestamp;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`p-2 rounded border flex items-start gap-2 ${getLogColor(level)}`}
              >
                <div className="flex-shrink-0 mt-0.5">{getLogIcon(level)}</div>
                <div className="flex-1">
                  <div className="mb-1 text-[11px] text-white/60">
                    {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
                  </div>
                  <div className="break-words text-sm text-white/85">{logText}</div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default LogsPanel;
