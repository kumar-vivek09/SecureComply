import React from 'react';

const ScoreCard = ({ title, value, subtitle, colorClass }) => {
  return (
    <div className="glass-panel p-6 rounded-xl flex flex-col justify-center h-full">
      <h3 className={`text-4xl font-bold font-['Space_Grotesk'] mb-2 ${colorClass}`}>
        {value}
      </h3>
      <div className="text-sm font-semibold text-white">{title}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
    </div>
  );
};

export default ScoreCard;
