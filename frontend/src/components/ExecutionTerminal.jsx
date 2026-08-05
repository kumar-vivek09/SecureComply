import React, { useEffect, useState, useRef } from 'react';
import { Terminal, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const ExecutionTerminal = () => {
  const [logs, setLogs] = useState([
    { type: 'info', text: 'Terminal ready. Waiting for execution commands...' }
  ]);
  const bottomRef = useRef(null);
  const { subscribe } = useSocket();

  useEffect(() => {
    const unsubStatus = subscribe('command-status', (data) => {
      setLogs(prev => [...prev, {
        type: data.status === 'failed' ? 'error' : 'info',
        text: `[${new Date().toLocaleTimeString()}] ${data.agentId ? `${data.agentId}: ` : ''}Command ${data.commandId} status: ${data.status}`
      }]);
    });

    const unsubReport = subscribe('compliance-report', (data) => {
      setLogs(prev => [
        ...prev,
        { type: 'success', text: `[${new Date().toLocaleTimeString()}] Scan completed on ${data.agentId}` },
        { type: 'info', text: `> Modules verified: ${data.findings?.length || 1}` }
      ]);
    });

    return () => {
      unsubStatus();
      unsubReport();
    };
  }, [subscribe]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[350px] overflow-hidden">
      <div className="p-4 border-b border-slate-800/50 flex items-center justify-between bg-gradient-to-r from-cyan-500/5 to-transparent">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold font-['Space_Grotesk'] tracking-widest text-slate-100 uppercase">Execution Terminal</h3>
        </div>
        <button onClick={() => setLogs([{ type: 'info', text: 'Terminal cleared.' }])} className="text-[10px] font-bold tracking-widest font-mono uppercase text-slate-500 hover:text-cyan-400 border border-slate-700/50 hover:border-cyan-500/50 px-2 py-1 rounded transition-colors">
          Clear
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-[#050b14] font-mono text-xs leading-relaxed space-y-1">
        {logs.map((log, index) => {
          let textColor = 'text-slate-400';
          if (log.type === 'error') textColor = 'text-rose-400';
          if (log.type === 'success') textColor = 'text-emerald-400';
          if (log.text.startsWith('>')) textColor = 'text-cyan-400';
          
          return (
            <div key={index} className={`${textColor} break-all`}>
              <span className="opacity-50 mr-2 text-slate-600">~</span>
              {log.text}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ExecutionTerminal;
