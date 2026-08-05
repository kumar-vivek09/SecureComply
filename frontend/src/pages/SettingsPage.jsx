import React, { useState, useEffect } from 'react';
import { Settings, User, Shield, Users, Activity, Plus, Trash2, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { getUser } from '../services/auth';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('account');

  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('ADMIN');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [myPassword, setMyPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const currentUser = getUser();

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/audit-logs');
      setAuditLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const handleGeneratePassword = (e) => {
    e.preventDefault();
    setGeneratedPassword(Math.random().toString(36).slice(-8) + 'X#1');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newEmail || !generatedPassword) return;
    try {
      await api.post('/users', { email: newEmail, role: newRole, password: generatedPassword });
      setNewEmail('');
      setGeneratedPassword('');
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to add user', err);
      alert(err.response?.data?.message || 'Failed to add user');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to delete user', err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!myPassword || !currentUser?.id) return;
    try {
      await api.put(`/users/${currentUser.id}/password`, { password: myPassword });
      setMyPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to change password', err);
      alert('Failed to change password');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="flex flex-col h-full items-start w-full">
            <h3 className="text-xl font-medium text-white mb-6">Account Settings</h3>
            <div className="space-y-4 w-full max-w-md">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email Address / Username</label>
                <input type="text" disabled value={currentUser?.email || currentUser?.username || ''} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                <input type="text" disabled value={currentUser?.role || ''} className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-cyan-400 font-bold tracking-wider cursor-not-allowed uppercase text-sm" />
              </div>
              <form onSubmit={handleChangePassword} className="pt-4 border-t border-slate-800">
                <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                <div className="flex gap-2">
                  <input type="password" required value={myPassword} onChange={(e) => setMyPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#050912] border border-slate-700 rounded-lg px-4 py-2 text-slate-300 focus:border-cyan-500 focus:outline-none" />
                  <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg transition-colors whitespace-nowrap">
                    Update
                  </button>
                </div>
                {passwordSuccess && <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Password updated successfully</p>}
              </form>
            </div>
          </div>
        );
      case 'management':
        return (
          <div className="flex flex-col h-full items-start w-full overflow-hidden">
            <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Account Management
            </h3>
            
            <form onSubmit={handleAddUser} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-5 mb-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-2">Create New User</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
                  <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@company.com" className="w-full bg-[#050912] border border-slate-700 rounded px-3 py-2 text-slate-300 focus:border-cyan-500 focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full bg-[#050912] border border-slate-700 rounded px-3 py-2 text-slate-300 focus:border-cyan-500 focus:outline-none text-sm">
                    <option value="SUPER ADMINISTRATOR">SUPER ADMINISTRATOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="ANALYST">ANALYST</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                    <input type="text" value={generatedPassword} onChange={(e) => setGeneratedPassword(e.target.value)} placeholder="Type or generate..." className="w-full bg-[#050912] border border-slate-700 rounded px-3 py-2 text-cyan-400 font-mono text-sm focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <button type="button" onClick={handleGeneratePassword} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded transition-colors text-sm whitespace-nowrap">
                    Generate
                  </button>
                  <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded transition-colors text-sm flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add User
                  </button>
                </div>
              </div>
            </form>

            <div className="w-full flex-1 border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="text-xs uppercase bg-slate-800/50 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-300">{u.username}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${u.role === 'SUPER ADMINISTRATOR' ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-400'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u._id !== currentUser?.id && (
                          <button onClick={() => handleDeleteUser(u._id)} className="text-slate-500 hover:text-rose-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="flex flex-col h-full items-start w-full overflow-hidden">
            <h3 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Admin Logs
            </h3>
            <div className="w-full flex-1 border border-slate-800 rounded-lg overflow-y-auto bg-slate-900/30">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="text-xs uppercase bg-slate-800/50 text-slate-300 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-medium">Admin</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auditLogs.length > 0 ? auditLogs.map(log => (
                    <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-300">{log.actor}</td>
                      <td className="px-4 py-3">{log.action}</td>
                      <td className="px-4 py-3 text-right text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-slate-500">No logs available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl">
      <div className="rounded-xl border border-slate-800/80 bg-[#0B1221]/60 p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold tracking-widest text-cyan-500 uppercase">System</span>
          <span className="text-[10px] text-slate-500">{'//'}</span>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Configuration</span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-cyan-400" />
          Platform Settings
        </h2>
        <p className="mt-3 text-sm text-slate-400 max-w-2xl">
          Configure platform behavior, user access controls, and administrative logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          <div 
            onClick={() => setActiveTab('account')}
            className={`p-4 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${activeTab === 'account' ? 'bg-cyan-500/10 border-l-4 border-cyan-400 text-cyan-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">My Account</span>
          </div>
          <div 
            onClick={() => setActiveTab('management')}
            className={`p-4 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${activeTab === 'management' ? 'bg-cyan-500/10 border-l-4 border-cyan-400 text-cyan-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Account Management</span>
          </div>
          <div 
            onClick={() => setActiveTab('security')}
            className={`p-4 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${activeTab === 'security' ? 'bg-cyan-500/10 border-l-4 border-cyan-400 text-cyan-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Admin Logs</span>
          </div>

        </div>
        
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-800/80 bg-[#0B1221]/60 p-8 shadow-lg backdrop-blur-xl min-h-[400px]">
             {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
