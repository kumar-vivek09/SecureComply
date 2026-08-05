import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, RefreshCw } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

import ClientCard from './enterprise/ClientCard';
import ComplianceCard from './enterprise/ComplianceCard';
import ScoreCard from './enterprise/ScoreCard';
import ResultsTable from './enterprise/ResultsTable';

const LIFECYCLE_STAGES = ['created', 'queued', 'dispatched', 'running', 'completed'];

const CommandPanel = ({ selectedClientId, onSelectedClientChange }) => {
  const [clients, setClients] = useState([]);
  const [loadingCommandId, setLoadingCommandId] = useState(null);
  const [lifecycleState, setLifecycleState] = useState('');
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [recommendationData, setRecommendationData] = useState(null);
  const [moduleResults, setModuleResults] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const { subscribe } = useSocket();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get('/clients');
        const normalizedClients = (Array.isArray(response.data) ? response.data : []).map((client) => ({
          ...client,
          agentId: client.agentId || client.clientId || client.id || String(client._id || ''),
          hostname: client.hostname || client.clientId || client.agentId || 'unknown-host',
        }));
        setClients(normalizedClients);
      } catch (error) {
        console.error('Failed to load clients for command panel:', error);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe('command-status', (data) => {
      if (data.commandId === loadingCommandId) {
        setLifecycleState(data.status);
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'timed_out') {
          if (data.status === 'completed') {
             toast.success('Command completed successfully');
             
             // Check if there's a recommendation in the compliance report
             if (data.resultSummary && data.resultSummary.includes('Recommendation:')) {
               toast.info('A manual recommendation is available.');
             }
          } else {
             toast.error(`Command failed: ${data.status}`);
          }
          setTimeout(() => {
             setLoadingCommandId(null);
             setLifecycleState('');
          }, 5000);
        }
      }
    });

    const unsubCompliance = subscribe('compliance-report', (data) => {
       const findings = data.findings || (data.moduleId ? [data] : []);
       
       if (findings.length > 0) {
          const recommendationFinding = findings.find(f => f.details && f.details.recommendation);
          if (recommendationFinding) {
             setRecommendationData(recommendationFinding.details.recommendation);
             setShowRecommendationModal(true);
          } else {
             setRecommendationData(null);
          }
          
          setModuleResults(prev => {
             const newResults = { ...prev };
             findings.forEach(f => {
                if (f.moduleId) {
                   newResults[`${data.agentId}_${f.moduleId}`] = f;
                }
             });
             return newResults;
          });
       }
    });

    const unsubCapabilities = subscribe('capabilities', (payload) => {
      if (payload.agentId && payload.modules) {
        setClients(prevClients => {
          const index = prevClients.findIndex(c => c.agentId === payload.agentId);
          if (index === -1) return prevClients;
          const newClients = [...prevClients];
          newClients[index] = { ...newClients[index], capabilityModules: payload.modules };
          return newClients;
        });
      }
    });

    return () => {
      unsubscribe();
      unsubCompliance();
      unsubCapabilities();
    };
  }, [subscribe, loadingCommandId]);

  const activeClient = useMemo(() => 
    clients.find(c => c.agentId === selectedClientId) || null,
  [clients, selectedClientId]);
  const availableModules = useMemo(() => {
    if (activeClient && activeClient.capabilityModules && activeClient.capabilityModules.length > 0) {
      return activeClient.capabilityModules;
    }
    return [];
  }, [activeClient]);

  const executeAction = async (moduleId, action) => {
    if (!selectedClientId) {
      toast.error('Select a client first.');
      return;
    }
    


    setLoadingCommandId('starting...');
    setLifecycleState('created');

    try {
      const response = await api.post('/command', {
        agentId: selectedClientId,
        command: moduleId,
        action: action
      });
      setLoadingCommandId(response.data.commandId);
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.details || 'Failed to execute command';
      console.error('Error executing command:', error);
      toast.error(message);
      setLoadingCommandId(null);
      setLifecycleState('');
    }
  };

  const getProgressPercentage = () => {
    const index = LIFECYCLE_STAGES.indexOf(lifecycleState);
    if (index === -1) return 0;
    return Math.round(((index + 1) / LIFECYCLE_STAGES.length) * 100);
  };

  // Calculate Analytics Stats based on activeClient results
  let passedCount = 0;
  let failedCount = 0;
  let manualCount = 0;
  const recentResults = [];
  let complianceScore = 0;

  if (activeClient) {
    const activeResults = Object.values(moduleResults).filter(res => res.agentId === activeClient.agentId);
    activeResults.forEach(res => {
      if (res.status === 'PASS') passedCount++;
      if (res.status === 'FAIL') failedCount++;
      if (res.status === 'MANUAL_REQUIRED') manualCount++;
    });
    const totalCount = passedCount + failedCount + manualCount;
    complianceScore = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
    
    // Sort for recent results
    recentResults.push(...activeResults.sort((a, b) => b.timestamp - a.timestamp));
  }

  const filteredClients = clients.filter(c => c.hostname.toLowerCase().includes(searchQuery.toLowerCase()) || (c.agentId || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex gap-6 w-full pb-10 h-[calc(100vh-140px)]">
      
      {/* LEFT COLUMN: AGENT LIST */}
      <div className="w-80 shrink-0 flex flex-col gap-4 bg-[#0a0f1a]/50 rounded-xl border border-slate-800/80 p-4 h-full">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 tracking-wider">CONNECTED AGENTS</span>
          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold">
            {clients.length}
          </div>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="filter agents..." 
            className="w-full bg-[#050912] border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {filteredClients.map(client => {
            const isOnline = client.status === 'online' || client.status === 'connected';
            const isSelected = selectedClientId === client.agentId;
            return (
              <div 
                key={client.agentId}
                onClick={() => onSelectedClientChange?.(client.agentId)}
                className={`p-3 rounded border cursor-pointer transition-all ${
                  isSelected 
                    ? 'bg-amber-500/10 border-amber-500/50 border-l-2 border-l-amber-500' 
                    : 'bg-[#0B0F19] border-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-200">{client.hostname}</span>
                    <span className="text-[10px] text-slate-500 mt-1">{client.osName || 'Unknown OS'} • {client.ipAddress || 'Unknown IP'}</span>
                  </div>
                  <span className={`text-[9px] font-bold tracking-widest ${isOnline ? 'text-emerald-500' : (client.status === 'idle' ? 'text-amber-500' : 'text-rose-500')} uppercase`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${isOnline ? 'bg-emerald-500' : (client.status === 'idle' ? 'bg-amber-500' : 'bg-rose-500')}`}></span>
                    {client.status || 'Offline'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: MODULE CONTROL */}
      <div className="flex-1 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
        {!activeClient ? (
          <div className="flex-1 flex items-center justify-center border border-slate-800/80 rounded-xl bg-[#0a0f1a]/50">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <Info className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium tracking-wide">Select an agent from the list to manage modules</p>
            </div>
          </div>
        ) : (
          <>
            <ClientCard client={activeClient} />

            <div className="mt-2">
              <h3 className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-4">Available Modules</h3>
              {availableModules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableModules.map(module => (
                    <ComplianceCard 
                      key={module.id} 
                      module={module} 
                      result={moduleResults[`${activeClient.agentId}_${module.id}`]}
                      loadingCommandId={loadingCommandId}
                      onRun={executeAction}
                    />
                  ))}
                </div>
              ) : (
                <div className="border border-slate-800/50 bg-[#0B0F19] p-10 text-center text-slate-500 rounded-xl text-sm">
                  No capabilities discovered for this endpoint yet.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ScoreCard 
                title="Overall Compliance Score" 
                value={`${complianceScore}%`} 
                subtitle={`Total Modules: ${availableModules.length}`}
                colorClass={complianceScore === 100 ? 'text-emerald-400' : complianceScore > 70 ? 'text-blue-400' : 'text-amber-400'}
              />
              
              <div className="border border-slate-800/80 bg-[#0B0F19] p-6 rounded-xl flex flex-col justify-center gap-4">
                 <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                   <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passed</span>
                   <span className="text-lg font-bold text-emerald-500">{passedCount}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                   <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Failed</span>
                   <span className="text-lg font-bold text-rose-500">{failedCount}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manual</span>
                   <span className="text-lg font-bold text-amber-500">{manualCount}</span>
                 </div>
              </div>

              <ResultsTable results={recentResults} />
            </div>
          </>
        )}
      </div>
      
      {/* Global Status/Progress Overlay */}
      <AnimatePresence>
        {lifecycleState && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 w-96 bg-[#0b1221] border border-blue-500/30 rounded-xl p-5 shadow-2xl z-50"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> {lifecycleState}
              </span>
              <span className="text-sm font-semibold text-blue-300">{getProgressPercentage()}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendation Modal */}
      <AnimatePresence>
        {showRecommendationModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b1221] border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-[#0f172a]">
                <div className="flex items-center gap-3">
                  <Info className="text-blue-400 w-5 h-5" />
                  <h3 className="text-white font-bold text-lg">Manual Action Required</h3>
                </div>
                <button onClick={() => setShowRecommendationModal(false)} className="text-slate-400 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {recommendationData ? (
                  <>
                    <div className="bg-slate-900 border border-slate-800 text-slate-300 p-4 rounded-xl text-sm space-y-2">
                      <p><span className="font-semibold text-white">Reason:</span> {recommendationData.reason}</p>
                      <p><span className="font-semibold text-white">Impact:</span> {recommendationData.impact}</p>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-3">Steps to Resolve:</h4>
                      <div className="bg-[#030712] p-4 rounded-xl font-mono text-sm text-blue-300 border border-slate-800 whitespace-pre-wrap">
                        {recommendationData.steps}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 text-center py-4">No recommendation data available.</div>
                )}
              </div>
              <div className="p-4 border-t border-slate-800 bg-[#0f172a] flex justify-end">
                <button 
                  onClick={() => setShowRecommendationModal(false)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Toaster />
    </div>
  );
};

export default CommandPanel;
