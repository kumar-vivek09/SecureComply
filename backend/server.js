require('dotenv').config();
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const commandRoutes = require('./routes/commands');
const { getAdminServerBridge } = require('./services/adminServerBridge');
const { StartupManager } = require('./services/StartupManager');
const Client = require('./models/Client');
const CommandHistory = require('./models/CommandHistory');
const ComplianceReport = require('./models/ComplianceReport');
const AuditLog = require('./models/AuditLog');

const app = express();
const port = process.env.PORT || 3001;
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cyber-soc';

// --- Middleware ---
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan('tiny', {
  skip: (req) => req.url === '/stats' || req.url === '/clients'
}));
app.set('models', { Client, CommandHistory, ComplianceReport, AuditLog });

// Debug logging middleware
app.use((req, res, next) => {
  if (req.url !== '/stats' && req.url !== '/clients') {
    console.log(`[${new Date().toISOString()}] [INFO] Incoming request: ${req.method} ${req.url}`);
  }
  next();
});

// --- Services ---
const adminBridge = getAdminServerBridge();
app.set('adminBridge', adminBridge);

const startupManager = new StartupManager();
app.set('startupManager', startupManager);

// --- HTTP Server & Socket.IO ---
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// --- Health Endpoints (BEFORE auth-protected routes) ---
app.get('/health', async (req, res) => {
  try {
    const onlineCount = await Client.countDocuments({ status: 'online' }).catch(() => 0);
    const offlineCount = await Client.countDocuments({ status: 'offline' }).catch(() => 0);
    const health = startupManager.getHealthStatus({ mongoose, adminBridge });
    health.agents = { online: onlineCount, offline: offlineCount };
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

app.get('/health/ready', (req, res) => {
  if (startupManager.isReady()) {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, state: startupManager.state });
  }
});

app.get('/startup/state', (req, res) => {
  res.json({
    state: startupManager.state,
    timeline: startupManager.timeline,
  });
});

// --- Route priority: specific routes BEFORE catch-all ---
app.use('/auth', authRoutes);
app.use('/commands', commandRoutes);
app.use('/', apiRoutes);

// 404 JSON fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// --- Telemetry & Persistence ---
const emitTelemetry = (event, payload) => {
  io.emit(event, payload);
  io.emit('new-log', {
    message: payload.message || payload.summary || payload.output || `${event} received`,
    level: payload.level || 'info',
    timestamp: payload.timestamp || new Date().toISOString(),
  });
};

const persistClientTelemetry = async (payload, status = 'online') => {
  const agentId = payload.agentId || payload.clientId;

  if (!agentId) {
    return;
  }

  const updateFields = {
    agentId,
    hostname: payload.hostname || 'unknown',
    ipAddress: payload.ipAddress || 'unknown',
    status,
    lastHeartbeat: payload.lastHeartbeat ? new Date(Number(payload.lastHeartbeat)) : new Date(),
    osName: payload.osVersion || payload.osName || 'unknown',
    complianceScore: Number.isFinite(Number(payload.complianceScore)) ? Number(payload.complianceScore) : 0,
    lastComplianceCheck: payload.lastComplianceCheck ? new Date(payload.lastComplianceCheck) : undefined,
  };

  // Only update capabilities string array if they were provided (in HELLO, not every heartbeat)
  const capabilitiesRaw = payload.capabilities || '';
  if (capabilitiesRaw) {
    updateFields.capabilities = capabilitiesRaw.split(',').map((c) => c.trim()).filter(Boolean);
  }

  // Update dynamic capability modules if provided (from CAPABILITIES message)
  if (payload.capabilityVersion) {
    updateFields.capabilityVersion = payload.capabilityVersion;
    if (payload.modules && Array.isArray(payload.modules)) {
      updateFields.capabilityModules = payload.modules;
    }
  }

  await Client.findOneAndUpdate(
    { agentId },
    { $set: updateFields },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const persistComplianceReport = async (payload) => {
  const agentId = payload.agentId || payload.clientId;

  if (!agentId) {
    return;
  }

  let findings = payload.findings || [];
  
  // If this is a direct COMPLIANCE_RESULT from a single module execution
  if (payload.moduleId) {
    findings = [payload];
  }

  // Calculate generic riskLevel
  const complianceScore = Number.isFinite(Number(payload.complianceScore)) ? Number(payload.complianceScore) : 0;
  
  await ComplianceReport.create({
    agentId,
    hostname: payload.hostname || 'unknown',
    complianceScore,
    findings,
    summary: payload.summary || payload.message || 'Compliance execution completed',
    generatedAt: payload.timestamp ? new Date(Number(payload.timestamp)) : new Date(),
  });

  await Client.findOneAndUpdate(
    { agentId },
    {
      $set: {
        complianceScore,
        lastComplianceCheck: payload.timestamp ? new Date(Number(payload.timestamp)) : new Date(),
      },
    }
  );
};

// --- Bridge Event Handlers ---
adminBridge.on('connected', (payload) => emitTelemetry('backend-connected', { ...payload, message: 'AdminServer bridge connected' }));
adminBridge.on('disconnected', () => emitTelemetry('backend-disconnected', { message: 'AdminServer bridge disconnected', level: 'warning' }));
adminBridge.on('agent-connected', async (payload) => {
  await persistClientTelemetry(payload, 'online');
  emitTelemetry('agent-connected', { ...payload, message: `Agent connected: ${payload.agentId || payload.hostname || 'unknown'}` });
});
adminBridge.on('agent-disconnected', async (payload) => {
  await persistClientTelemetry(payload, 'offline');
  const msg = `Agent disconnected: ${payload.agentId || payload.hostname || 'unknown'}`;
  emitTelemetry('agent-disconnected', { ...payload, message: msg, level: 'warning' });
  io.emit('alert', { type: 'error', message: msg });
});
adminBridge.on('heartbeat', async (payload) => {
  await persistClientTelemetry(payload, 'online');
  emitTelemetry('heartbeat', { ...payload, message: `Heartbeat received from ${payload.agentId || payload.hostname || 'unknown'}` });
});
adminBridge.on('capabilities', async (payload) => {
  await persistClientTelemetry(payload, 'online');
  emitTelemetry('capabilities', { ...payload, message: `Capabilities synced for ${payload.agentId || 'unknown'}` });
});
adminBridge.on('command-response', async (payload) => {
  emitTelemetry('command-response', { ...payload, message: `Command status update on ${payload.agentId || 'unknown agent'}` });
});
adminBridge.on('compliance-report', async (payload) => {
  await persistComplianceReport(payload);
  const msg = `Compliance result from ${payload.agentId || payload.hostname || 'unknown'}`;
  emitTelemetry('compliance-report', { ...payload, message: msg });
  const score = Number.isFinite(Number(payload.complianceScore)) ? Number(payload.complianceScore) : 0;
  if (score < 100) {
    io.emit('alert', { type: 'warning', message: `Compliance failure on ${payload.hostname || 'unknown'} (Score: ${score}%)` });
  } else {
    io.emit('alert', { type: 'success', message: `Compliance passed on ${payload.hostname || 'unknown'} (Score: 100%)` });
  }
});
adminBridge.on('log-event', (payload) => emitTelemetry('log-event', { ...payload, message: payload.message || 'Log event received' }));

// --- Startup Manager Event Forwarding to Socket.IO ---
startupManager.on('state-change', (entry) => {
  io.emit('startup-state', entry);
});
startupManager.on('supervisor-restart', (info) => {
  io.emit('supervisor-restart', info);
  emitTelemetry('new-log', { message: `${info.component} restarting (attempt ${info.attempt})`, level: 'warning' });
});
startupManager.on('system-ready', () => {
  io.emit('system-ready', { timestamp: new Date().toISOString() });
});

// --- Socket.IO Connection Handler ---
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] [INFO] Dashboard client connected: ${socket.id}`);
  socket.emit('backend-status', { connected: adminBridge.connected });
  socket.emit('startup-state', {
    to: startupManager.state,
    timestamp: new Date().toISOString(),
    timeline: startupManager.timeline,
  });
  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] [INFO] Dashboard client disconnected: ${socket.id}`);
  });
});

// --- Deterministic Startup Sequence ---
mongoose
  .connect(mongoUri, { family: 4, serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log(`[${new Date().toISOString()}] [INFO] Connected to MongoDB`);

    try {
      // Remove any legacy documents where agentId is missing to prevent duplicate key errors on the new index
      await Client.deleteMany({ agentId: { $in: [null, undefined] } });
      
      await Client.syncIndexes();
      console.log(`[${new Date().toISOString()}] [INFO] Synced MongoDB indexes`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] [WARN] Failed to sync indexes:`, err.message);
    }

    server.listen(port, async () => {
      console.log(`[${new Date().toISOString()}] [INFO] API server running on http://localhost:${port}`);

      try {
        await startupManager.start({ mongoose, adminBridge, io });
        console.log(`[${new Date().toISOString()}] [INFO] ========== SYSTEM READY ==========`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] [ERROR] Startup failed: ${error.message}`);
        console.error(`[${new Date().toISOString()}] [WARN] Backend is running but Java components may not be available.`);
        console.error(`[${new Date().toISOString()}] [WARN] Dashboard will show system status. You can still browse the UI.`);
      }
    });
  })
  .catch((error) => {
    console.error(`[${new Date().toISOString()}] [ERROR] MongoDB connection failed: ${error.message}`);
    process.exit(1);
  });

// --- Graceful Shutdown ---
const shutdown = async () => {
  console.log(`[${new Date().toISOString()}] [INFO] Shutting down...`);
  await startupManager.shutdown();
  server.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
