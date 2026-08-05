import React from 'react';
import { Shield, Play } from 'lucide-react';

const ComplianceCard = ({ module, result, loadingCommandId, onRun }) => {
  let statusText = 'UNKNOWN';
  let badgeClass = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  
  if (result?.status === 'PASS') {
    statusText = 'PASS';
    badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (result?.status === 'FAIL') {
    statusText = 'FAIL';
    badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (result?.status === 'MANUAL_REQUIRED') {
    statusText = 'MANUAL REQUIRED';
    badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  const isLoading = loadingCommandId && (loadingCommandId === 'starting...' || loadingCommandId !== null);
  // Ideally, loading state would be tracked per-module, but we'll use the global one for now to disable the button.

  return (
    <div className="glass-card p-5 rounded-xl flex flex-col justify-between">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded border border-slate-800 text-blue-500">
            <Shield className="w-5 h-5" />
          </div>
          <h4 className="text-[15px] font-semibold text-slate-200 leading-tight">
            {module.displayName}
          </h4>
        </div>
      </div>
      
      <div className="space-y-4 flex-1">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium block mb-1">Status</span>
          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${badgeClass}`}>
            {statusText}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium block mb-1">Last Scan</span>
            <span className="text-sm text-slate-300">
              {result?.timestamp ? new Date(Number(result.timestamp)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Never'}
            </span>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium block mb-1">Execution</span>
            <span className="text-sm text-slate-300">
              {result?.workflowDurationMs ? `${(result.workflowDurationMs / 1000).toFixed(1)} sec` : '--'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-800/60 flex justify-end">
        <button
          onClick={() => onRun(module.id, 'CHECK')}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600/10 text-blue-400 border border-blue-500/30 hover:bg-blue-600/20 hover:border-blue-500/50 transition-all text-xs font-semibold disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Run Compliance
        </button>
      </div>
    </div>
  );
};

export default ComplianceCard;
