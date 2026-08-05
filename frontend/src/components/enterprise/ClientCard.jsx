import React from 'react';
import { Monitor, Circle, Clock, Wifi } from 'lucide-react';

const ClientCard = ({ client }) => {
  if (!client) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center h-40 text-slate-500 rounded-xl">
        <Monitor className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm font-medium">Select an endpoint from the sidebar</p>
      </div>
    );
  }

  const isOnline = client.status === 'online' || client.status === 'connected';

  return (
    <div className="glass-panel p-6 rounded-xl flex items-start justify-between">
      <div className="flex items-start gap-5">
        <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 shadow-inner">
          <Monitor className="w-10 h-10 text-slate-400" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight mb-1">
            {client.hostname || 'UNKNOWN-CLIENT'}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <Circle className="w-2 h-2 fill-current" />
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <span className="text-slate-600 text-xs px-2">|</span>
            <span className="text-slate-400 text-sm">{client.osName || 'Windows 11 Pro'}</span>
            <span className="text-slate-600 text-xs px-2">|</span>
            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
              <Wifi className="w-3.5 h-3.5" />
              {client.ipAddress || client.ip || 'Unknown IP'}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-slate-500 text-xs uppercase font-medium tracking-wider">Last Heartbeat</span>
        <div className="flex items-center gap-1.5 text-slate-300 text-sm font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {client.lastHeartbeat ? new Date(client.lastHeartbeat).toLocaleTimeString() : 'Just now'}
        </div>
      </div>
    </div>
  );
};

export default ClientCard;
