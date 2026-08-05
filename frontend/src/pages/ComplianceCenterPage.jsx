import React, { useState } from 'react';
import CommandPanel from '../components/CommandPanel';

const ComplianceCenterPage = () => {
  const [selectedClientId, setSelectedClientId] = useState('');

  return (
    <div className="space-y-6 w-full max-w-7xl">
      <div className="rounded-xl border border-slate-800/80 bg-[#0a0f1a]/80 p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">Compliance</span>
          <span className="text-[10px] text-slate-500">{'//'}</span>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Module Control</span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Compliance Center</h2>
        <p className="mt-3 text-sm text-slate-400 max-w-2xl">
          Execute targeted compliance modules against connected endpoints, or run a full platform audit across the fleet.
        </p>
      </div>
      <CommandPanel
        selectedClientId={selectedClientId}
        onSelectedClientChange={setSelectedClientId}
      />
    </div>
  );
};

export default ComplianceCenterPage;
