const express = require('express');
const verifyToken = require('../middleware/auth');
const Client = require('../models/Client');
const Log = require('../models/Log');
const { sendCommandToJava } = require('../lib/socketClient');

const router = express.Router();

router.get('/clients', verifyToken, async (req, res) => {
  try {
    const clients = await Client.find().sort({ lastSeen: -1 }).lean();
    const formatted = clients.map((client) => ({
      id: client.clientId,
      status: client.status,
      compliance: client.complianceStatus,
      score: client.score,
      lastSeen: client.lastSeen,
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
    const compliant = clients.filter((client) => client.complianceStatus === 'compliant').length;
    const nonCompliant = clients.filter((client) => client.complianceStatus === 'non-compliant').length;
    const complianceScore = totalClients
      ? Math.round(
          clients.reduce((sum, client) => sum + client.score, 0) / totalClients
        )
      : 0;

    res.json({ totalClients, compliant, nonCompliant, complianceScore });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Unable to retrieve stats.' });
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

router.post('/command', verifyToken, async (req, res) => {
  const { command } = req.body;
  if (!command) {
    return res.status(400).json({ message: 'Command field is required.' });
  }

  try {
    const result = await sendCommandToJava(command);
    const message = `Command ${command} executed with response: ${result}`;
    const level = result.toLowerCase().includes('error') || result.toLowerCase().includes('failed') ? 'error' : 'info';

    await Log.create({ message, level, timestamp: new Date() });

    res.json({ success: true, command, result, message });
  } catch (error) {
    const message = `Command ${command} failed: ${error.message}`;
    await Log.create({ message, level: 'error', timestamp: new Date() });
    console.error('Command execution error:', error);
    res.status(500).json({ success: false, message: 'Command execution failed.', details: error.message });
  }
});

module.exports = router;
