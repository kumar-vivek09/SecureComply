import React from 'react';

const ExecutiveHeader = () => {
  return (
    <div className="flex flex-col gap-1 mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Dashboard Overview
      </h1>
      <p className="text-slate-400 text-sm">
        Monitor your enterprise endpoint compliance status in real-time.
      </p>
    </div>
  );
};

export default ExecutiveHeader;
