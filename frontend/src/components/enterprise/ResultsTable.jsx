import React from 'react';

const ResultsTable = ({ results = [] }) => {
  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-white">Recent Compliance Results</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {results.length === 0 ? (
          <div className="text-slate-500 text-sm flex items-center justify-center h-full">
            No Data Available
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800/50">
                <th className="pb-3 font-medium">Module</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 6).map((res, i) => {
                let statusColor = 'text-slate-400';
                if (res.status === 'PASS') statusColor = 'text-emerald-400';
                if (res.status === 'FAIL') statusColor = 'text-rose-400';
                if (res.status === 'MANUAL_REQUIRED') statusColor = 'text-amber-400';
                
                // Format the status string for display
                const formattedStatus = res.status === 'MANUAL_REQUIRED' ? 'Manual Required' : res.status;

                return (
                  <tr key={i} className="border-b border-slate-800/30 last:border-0">
                    <td className="py-3 text-slate-300 font-medium">
                      {res.moduleId ? res.moduleId.replace('_', ' ') : 'Unknown Module'}
                    </td>
                    <td className={`py-3 font-semibold ${statusColor}`}>
                      {formattedStatus}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ResultsTable;
