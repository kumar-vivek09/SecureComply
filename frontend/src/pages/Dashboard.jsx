import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gauge } from 'lucide-react';
import api from '../services/api';

import ExecutiveHeader from '../components/enterprise/ExecutiveHeader';
import MetricCards from '../components/enterprise/MetricCards';
import ComplianceDistribution from '../components/enterprise/ComplianceDistribution';
import ConnectedEndpointsTable from '../components/enterprise/ConnectedEndpointsTable';
import RecentActivityTable from '../components/enterprise/RecentActivityTable';
import TrendChart from '../components/enterprise/TrendChart';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    compliant: 0,
    nonCompliant: 0,
    complianceScore: 0,
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get('/clients');
      const clientsArray = (Array.isArray(response.data) ? response.data : []).map((client) => ({
        ...client,
        agentId: client.agentId || client.clientId || client.id || String(client._id || ''),
        hostname: client.hostname || client.clientId || client.agentId || 'unknown-host',
      }));
      setClients(clientsArray);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchClients();
      await fetchStats();
      setLoading(false);
    };

    loadData();

    const interval = setInterval(() => {
      fetchStats();
      fetchClients();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchClients, fetchStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-amber-500 text-xl"
        >
          <Gauge className="w-8 h-8" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen max-w-7xl mx-auto pb-10">
      <ExecutiveHeader />
      <MetricCards stats={stats} />
      <TrendChart />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <ConnectedEndpointsTable clients={clients} />
        </div>
        <div className="lg:col-span-1">
          <ComplianceDistribution stats={stats} />
        </div>
      </div>

      <div className="w-full">
        <RecentActivityTable />
      </div>
    </div>
  );
};

export default Dashboard;
