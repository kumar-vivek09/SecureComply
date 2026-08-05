import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import CommandHistoryPage from './pages/CommandHistoryPage';
import LogsPage from './pages/LogsPage';
import ComplianceCenterPage from './pages/ComplianceCenterPage';
import InfrastructureHealthPage from './pages/InfrastructureHealthPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layout/MainLayout';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001');

function App() {
  useEffect(() => {
    socket.on('alert', (data) => {
      const toastStyle = { background: '#1e293b', color: '#fff', border: '1px solid #334155' };
      if (data.type === 'error') {
        toast.error(data.message, { duration: 5000, style: toastStyle });
      } else if (data.type === 'warning') {
        toast(data.message, { icon: '⚠️', duration: 5000, style: toastStyle });
      } else {
        toast.success(data.message, { duration: 5000, style: toastStyle });
      }
    });
    return () => socket.off('alert');
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="compliance" element={<ComplianceCenterPage />} />
          <Route path="history" element={<CommandHistoryPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="health" element={<InfrastructureHealthPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
