const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Mock data for stats
app.get('/stats', (req, res) => {
  res.json({
    totalClients: 12,
    compliant: 10,
    nonCompliant: 2,
    complianceScore: 83
  });
});

// Mock data for clients
app.get('/clients', (req, res) => {
  res.json([
    { id: 'Client-01', status: 'Connected', compliance: 'Compliant', score: 95 },
    { id: 'Client-02', status: 'Connected', compliance: 'Non-Compliant', score: 65 },
    { id: 'Client-03', status: 'Connected', compliance: 'Warning', score: 78 },
    { id: 'Client-04', status: 'Disconnected', compliance: 'Unknown', score: 0 },
    { id: 'Client-05', status: 'Connected', compliance: 'Compliant', score: 92 },
    { id: 'Client-06', status: 'Connected', compliance: 'Compliant', score: 88 },
    { id: 'Client-07', status: 'Connected', compliance: 'Non-Compliant', score: 45 },
    { id: 'Client-08', status: 'Connected', compliance: 'Warning', score: 76 },
    { id: 'Client-09', status: 'Connected', compliance: 'Compliant', score: 91 },
    { id: 'Client-10', status: 'Disconnected', compliance: 'Unknown', score: 0 },
    { id: 'Client-11', status: 'Connected', compliance: 'Compliant', score: 89 },
    { id: 'Client-12', status: 'Connected', compliance: 'Non-Compliant', score: 52 }
  ]);
});

// Mock command endpoint
app.post('/command', (req, res) => {
  const { command } = req.body;
  console.log('Received command:', command);

  // Simulate command execution
  setTimeout(() => {
    res.json({
      success: true,
      message: `${command} executed successfully`,
      timestamp: new Date().toISOString()
    });
  }, 1000);
});

// Mock logs endpoint
app.get('/logs', (req, res) => {
  const mockLogs = [
    { timestamp: '10:30:15', level: 'INFO', message: 'System scan completed successfully' },
    { timestamp: '10:25:42', level: 'WARNING', message: 'Client-07 compliance score below threshold' },
    { timestamp: '10:20:18', level: 'INFO', message: 'Windows Update check initiated' },
    { timestamp: '10:15:33', level: 'ERROR', message: 'Failed to connect to Client-04' },
    { timestamp: '10:10:27', level: 'INFO', message: 'Antivirus scan completed on Client-02' },
    { timestamp: '10:05:51', level: 'WARNING', message: 'Port scan detected open port 3389 on Client-08' },
    { timestamp: '10:00:12', level: 'INFO', message: 'All clients status updated' },
    { timestamp: '09:55:44', level: 'INFO', message: 'Compliance report generated' }
  ];
  res.json(mockLogs);
});

app.listen(port, () => {
  console.log(`Mock API server running on http://localhost:${port}`);
});