import React, { useEffect, useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const ReportsPage = () => {
  const [clients, setClients] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { subscribe } = useSocket();

  const fetchReport = useCallback(async () => {
    if (!selectedAgentId) return;
    try {
      const response = await api.get(`/compliance-reports/${selectedAgentId}`);
      setReports(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load report:', error);
      setReports([]);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get('/clients');
        const list = Array.isArray(response.data) ? response.data : [];
        setClients(list);
        if (list.length > 0) {
          setSelectedAgentId(list[0].agentId || list[0].clientId || list[0].id || String(list[0]._id || ''));
        }
      } catch (error) {
        console.error('Failed to load clients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    const unsubscribe = subscribe('compliance-report', () => {
      fetchReport();
    });
    return () => unsubscribe();
  }, [subscribe, fetchReport]);

  if (loading) {
    return <div className="text-slate-400 p-8">Loading reports...</div>;
  }

  const selectedClient = clients.find(c => (c.agentId || c.clientId || c.id || String(c._id)) === selectedAgentId);

  const getConsolidatedReport = () => {
    if (!reports || reports.length === 0) return null;
    
    const baseReport = { ...reports[0] };
    const latestFindingsMap = new Map();

    reports.forEach(report => {
      if (Array.isArray(report.findings)) {
        report.findings.forEach(finding => {
          if (!latestFindingsMap.has(finding.module)) {
            // Attach the report timestamp to the finding so we know when this specific module was executed
            const findingWithTimestamp = { ...finding, executedAt: report.generatedAt };
            latestFindingsMap.set(finding.module, findingWithTimestamp);
          }
        });
      }
    });

    baseReport.findings = Array.from(latestFindingsMap.values());
    
    const passed = baseReport.findings.filter(f => f.status === 'PASS' || f.status === 'passed').length;
    const failed = baseReport.findings.filter(f => f.status === 'FAIL' || f.status === 'failed').length;
    const manual = baseReport.findings.filter(f => f.status === 'MANUAL_REQUIRED' || f.status === 'manual').length;
    const total = passed + failed + manual;
    
    baseReport.complianceScore = total > 0 ? Math.round((passed / total) * 100) : 0;
    baseReport.summary = `Consolidated report aggregating the latest results from ${baseReport.findings.length} security modules.`;
    
    return baseReport;
  };

  const handleDownloadReport = (report) => {
    if (!report || !selectedClient) return;

    let content = `SECURECOMPLY COMPLIANCE REPORT\n`;
    content += `===============================\n`;
    content += `Client: ${selectedClient.hostname || 'Unknown'}\n`;
    content += `IP Address: ${selectedClient.ipAddress || 'Unknown'}\n`;
    content += `Report Date: ${report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'N/A'}\n`;
    
    let displayScore = report.complianceScore || 0;
    const passed = Array.isArray(report.findings) ? report.findings.filter(f => f.status === 'PASS' || f.status === 'passed').length : 0;
    const failed = Array.isArray(report.findings) ? report.findings.filter(f => f.status === 'FAIL' || f.status === 'failed').length : 0;
    const manual = Array.isArray(report.findings) ? report.findings.filter(f => f.status === 'MANUAL_REQUIRED' || f.status === 'manual').length : 0;
    const total = passed + failed + manual;
    if (displayScore === 0 && total > 0) displayScore = Math.round((passed / total) * 100);
    
    content += `Compliance Score: ${displayScore}%\n\n`;
    content += `EXECUTION DETAILS\n`;
    content += `-----------------\n`;
    if (report.summary) {
        content += `${report.summary}\n`;
    } else {
        content += `No summary available.\n`;
    }
    content += `\n`;

    content += `MODULE FINDINGS\n`;
    content += `---------------\n`;
    if (Array.isArray(report.findings) && report.findings.length > 0) {
        report.findings.forEach(f => {
            content += `- Module: ${f.module || 'Unknown'}\n`;
            content += `  Status: ${f.status || 'N/A'}\n`;
            
            let detailsString = 'N/A';
            if (f.details) {
                detailsString = typeof f.details === 'object' ? JSON.stringify(f.details) : String(f.details);
            }
            content += `  Details: ${detailsString}\n`;
            
            if (f.executedAt) {
                content += `  Executed At: ${new Date(f.executedAt).toLocaleString()}\n`;
            }
            if (f.executionTimeMs !== undefined) {
                content += `  Execution Duration: ${f.executionTimeMs}ms\n`;
            }
            content += `\n`;
        });
    } else {
        content += `No specific module findings recorded.\n`;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedClient.hostname || 'client'}_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderReportDetails = () => {
    const consolidatedReport = getConsolidatedReport();
    if (!consolidatedReport) {
      return (
        <div className="p-8 text-center text-slate-400 border border-slate-800 rounded-xl bg-slate-900/50">
          No compliance report available
        </div>
      );
    }

    // Default missing values to N/A as per rules
    const passedModules = Array.isArray(consolidatedReport.findings) ? consolidatedReport.findings.filter(f => f.status === 'PASS' || f.status === 'passed').length : 'N/A';
    const failedModules = Array.isArray(consolidatedReport.findings) ? consolidatedReport.findings.filter(f => f.status === 'FAIL' || f.status === 'failed').length : 'N/A';
    const manualModules = Array.isArray(consolidatedReport.findings) ? consolidatedReport.findings.filter(f => f.status === 'MANUAL_REQUIRED' || f.status === 'manual').length : 'N/A';
    
    let displayScore = consolidatedReport.complianceScore || 0;

    return (
      <div className="border border-slate-800 rounded-xl bg-slate-900/50 p-6 space-y-6">
        <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">{selectedClient?.hostname || 'Unknown Client'} Report</h2>
          <button onClick={() => handleDownloadReport(consolidatedReport)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg transition-colors text-sm font-medium">
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Compliance Score</div>
            <div className="text-3xl font-bold text-white">{Number.isFinite(displayScore) ? `${displayScore}%` : 'N/A'}</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Last Scan</div>
            <div className="text-sm font-medium text-slate-300">
              {consolidatedReport.generatedAt ? new Date(consolidatedReport.generatedAt).toLocaleString() : 'N/A'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-950/20 p-4 rounded-lg border border-emerald-900/50 text-center">
            <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-1">Passed Modules</div>
            <div className="text-2xl font-bold text-emerald-400">{passedModules}</div>
          </div>
          <div className="bg-rose-950/20 p-4 rounded-lg border border-rose-900/50 text-center">
            <div className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mb-1">Failed Modules</div>
            <div className="text-2xl font-bold text-rose-400">{failedModules}</div>
          </div>
          <div className="bg-amber-950/20 p-4 rounded-lg border border-amber-900/50 text-center">
            <div className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1">Manual Required</div>
            <div className="text-2xl font-bold text-amber-400">{manualModules}</div>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Execution Details</div>
          <div className="text-sm text-slate-300 whitespace-pre-wrap">
            {consolidatedReport.summary || 'N/A'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-[250px_1fr] gap-6">
      <div className="border border-slate-800 rounded-xl bg-[#0a0f1a] overflow-hidden flex flex-col">
        <div className="bg-slate-900/80 p-4 border-b border-slate-800 shrink-0">
          <h3 className="font-bold text-slate-200 text-sm tracking-wide">CONNECTED CLIENTS</h3>
        </div>
        <div className="divide-y divide-slate-800/50 overflow-y-auto flex-1 h-[500px]">
          {clients.map(client => {
            const id = client.agentId || client.clientId || client.id || String(client._id);
            const isSelected = selectedAgentId === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedAgentId(id)}
                className={`w-full text-left px-4 py-3 transition-colors ${isSelected ? 'bg-amber-500/10 text-amber-500' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <div className="font-medium text-sm">{client.hostname || 'Unknown Client'}</div>
              </button>
            );
          })}
          {clients.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500">No clients found</div>
          )}
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Compliance Reports</h1>
          <p className="text-sm text-slate-400">View final security assessments for individual connected clients.</p>
        </div>
        {renderReportDetails()}
      </div>
    </div>
  );
};

export default ReportsPage;
