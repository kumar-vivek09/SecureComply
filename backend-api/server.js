const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mock data
let clients = [
  { id: 'PC-001', status: 'Connected', compliance: 'Compliant', score: 95 },
  { id: 'PC-002', status: 'Connected', compliance: 'Non-Compliant', score: 75 },
  { id: 'PC-003', status: 'Disconnected', compliance: 'Unknown', score: 0 },
];

let logs = [
  { timestamp: '2024-01-15 10:30:00', message: 'System started' },
  { timestamp: '2024-01-15 10:35:00', message: 'Client PC-001 connected' },
  { timestamp: '2024-01-15 10:40:00', message: 'Antivirus check completed for PC-001' },
];

// Routes
app.get('/clients', (req, res) => {
  res.json(clients);
});

app.get('/stats', (req, res) => {
  const totalClients = clients.length;
  const compliant = clients.filter(c => c.compliance === 'Compliant').length;
  const nonCompliant = clients.filter(c => c.compliance === 'Non-Compliant').length;
  const complianceScore = Math.round((compliant / totalClients) * 100);

  res.json({
    totalClients,
    compliant,
    nonCompliant,
    complianceScore,
  });
});

app.post('/command', (req, res) => {
  const { command } = req.body;
  
  // Add log entry
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  logs.push({
    timestamp,
    message: 'Command ' + command + ' sent to clients',
  });

  // Simulate command execution
  setTimeout(() => {
    logs.push({
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      message: 'Command ' + command + ' executed successfully',
    });
  }, 2000);

  res.json({ status: 'Command sent', command });
});

app.get('/logs', (req, res) => {
  res.json(logs.slice(-20)); // Return last 20 logs
});

app.listen(PORT, () => {
  console.log('API server running on http://localhost:' + PORT);
});
