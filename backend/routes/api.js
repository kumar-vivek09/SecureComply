const express = require('express');
const verifyToken = require('../middleware/auth');
const Client = require('../models/Client');
const Log = require('../models/Log');
const CommandHistory = require('../models/CommandHistory');
const ComplianceReport = require('../models/ComplianceReport');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const { executeCommandByCode } = require('../controllers/commandController');

const router = express.Router();

router.get('/clients', verifyToken, async (req, res) => {
  try {
    const clients = await Client.find().sort({ lastHeartbeat: -1 }).lean();
    const formatted = clients.map((client) => ({
      agentId: client.agentId || client.clientId || client.id || String(client._id),
      hostname: client.hostname || client.clientId || client.agentId || 'unknown-host',
      ipAddress: client.ipAddress || client.clientIp || 'unknown',
      status: (client.status || (client.clientId ? 'online' : 'offline')).toString().toLowerCase(),
      lastHeartbeat: client.lastHeartbeat || client.lastSeen || client.updatedAt || client.createdAt || new Date(),
      osName: client.osName || client.osVersion || 'unknown',
      complianceScore: Number.isFinite(Number(client.complianceScore)) ? Number(client.complianceScore) : Number(client.score) || 0,
      lastComplianceCheck: client.lastComplianceCheck || client.updatedAt || null,
      capabilities: client.capabilities || [],
      capabilityModules: client.capabilityModules || [],
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Unable to retrieve clients.' });
  }
});

router.get('/stats', verifyToken, async (req, res) => {
  try {
    const clients = await Client.find().lean();
    const totalClients = clients.length;
    const online = clients.filter((client) => client.status === 'online').length;
    const offline = totalClients - online;
    const compliant = clients.filter((client) => (client.complianceScore || 0) >= 80).length;
    const nonCompliant = totalClients - compliant;
    const complianceScore = totalClients
      ? Math.round(
          clients.reduce((sum, client) => sum + (Number(client.complianceScore) || 0), 0) / totalClients
        )
      : 0;

    res.json({ totalClients, online, offline, compliant, nonCompliant, complianceScore });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ totalClients: 0, online: 0, offline: 0, compliant: 0, nonCompliant: 0, complianceScore: 0 });
  }
});

router.get('/logs', verifyToken, async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(100).lean();
    res.json(logs.map((log) => ({
      message: log.message,
      level: log.level,
      timestamp: log.timestamp,
    })));
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Unable to retrieve logs.' });
  }
});

router.get('/command-history', verifyToken, async (req, res) => {
  try {
    const { search = '', status = '' } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { hostname: { $regex: search, $options: 'i' } },
        { agentId: { $regex: search, $options: 'i' } },
        { commandType: { $regex: search, $options: 'i' } },
      ];
    }

    const history = await CommandHistory.find(query).sort({ requestedAt: -1 }).limit(200).lean();
    res.json(history);
  } catch (error) {
    console.error('Error fetching command history:', error);
    res.status(500).json({ message: 'Unable to retrieve command history.' });
  }
});

router.get('/compliance-reports/:agentId', verifyToken, async (req, res) => {
  try {
    const reports = await ComplianceReport.find({ agentId: req.params.agentId }).sort({ generatedAt: -1 }).limit(50).lean();
    res.json(reports);
  } catch (error) {
    console.error('Error fetching compliance reports:', error);
    res.status(500).json({ message: 'Unable to retrieve compliance reports.' });
  }
});

// --- User Management Routes ---

router.get('/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER ADMINISTRATOR') {
      return res.status(403).json({ message: 'Forbidden: Super Administrator only.' });
    }
    const users = await User.find({}, '-password').lean();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Unable to retrieve users.' });
  }
});

router.post('/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER ADMINISTRATOR') {
      return res.status(403).json({ message: 'Forbidden: Super Administrator only.' });
    }
    const { email, role, password } = req.body;
    if (!email || !role || !password) {
      return res.status(400).json({ message: 'Email, role, and password are required.' });
    }
    
    const username = email.split('@')[0];
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new User({
      username,
      email,
      role,
      password: hashedPassword
    });
    
    await newUser.save();
    
    const auditLog = new AuditLog({
      actor: req.user.username,
      action: `Created new user account '${username}'`,
      targetType: 'user',
      targetId: newUser._id
    });
    await auditLog.save();
    
    const userToReturn = newUser.toObject();
    delete userToReturn.password;
    res.status(201).json(userToReturn);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or username already exists.' });
    }
    res.status(500).json({ message: 'Unable to create user.' });
  }
});

router.delete('/users/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER ADMINISTRATOR') {
      return res.status(403).json({ message: 'Forbidden: Super Administrator only.' });
    }
    
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account.' });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const auditLog = new AuditLog({
      actor: req.user.username,
      action: `Deleted user account '${user.username}'`,
      targetType: 'user',
      targetId: req.params.id
    });
    await auditLog.save();
    
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Unable to delete user.' });
  }
});

router.put('/users/:id/password', verifyToken, async (req, res) => {
  try {
    // Only SUPER ADMIN or the user themselves can change password
    if (req.user.role !== 'SUPER ADMINISTRATOR' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden: Cannot change another user\'s password.' });
    }
    
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'New password is required.' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, { password: hashedPassword });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    const auditLog = new AuditLog({
      actor: req.user.username,
      action: `Changed password for user '${user.username}'`,
      targetType: 'user',
      targetId: req.params.id
    });
    await auditLog.save();
    
    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Unable to update password.' });
  }
});

// --- Audit Logs Route ---

router.get('/audit-logs', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER ADMINISTRATOR') {
      return res.status(403).json({ message: 'Forbidden: Super Administrator only.' });
    }
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).lean();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Unable to retrieve audit logs.' });
  }
});

router.get('/clients/:agentId/reports', verifyToken, async (req, res) => {
  try {
    const reports = await ComplianceReport.find({ agentId: req.params.agentId }).sort({ generatedAt: -1 }).limit(25).lean();
    res.json(reports);
  } catch (error) {
    console.error('Error fetching client reports:', error);
    res.status(500).json({ message: 'Unable to retrieve client reports.' });
  }
});

router.post('/command', verifyToken, async (req, res) => {
  const { command } = req.body;
  if (!req.body.agentId) {
    return res.status(400).json({ message: 'agentId is required.' });
  }

  if (!command) {
    return res.status(400).json({ message: 'Command field is required.' });
  }

  return executeCommandByCode(command, req, res);
});

module.exports = router;
