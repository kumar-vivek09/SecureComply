const CommandHistory = require('../models/CommandHistory');
const CommandResult = require('../models/CommandResult');
const AuditLog = require('../models/AuditLog');
const { dispatchCommand, normalizeCommand } = require('../services/commandDispatcher');

const COMMAND_LABELS = {
  ANTIVIRUS: 'Antivirus Check',
  WINDOWS_UPDATE: 'Windows Update Check',
  PORT_SCAN: 'Port Scan',
  COMPLIANCE_AUDIT: 'Compliance Audit',
};

const TERMINAL_STATES = new Set(['completed', 'failed', 'timed_out']);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getIo = (req) => req?.app?.get('io');

const emitLog = (req, message, level = 'info') => {
  const io = getIo(req);

  if (io) {
    io.emit('new-log', {
      message,
      level,
      timestamp: new Date().toISOString(),
    });
  }
};

const recordAuditLog = async (entry) => {
  try {
    await AuditLog.create(entry);
  } catch (error) {
    console.error('Failed to persist audit log:', error);
  }
};

const updateCommandState = async (req, commandRecord, status, resultSummary = '') => {
  // PREVENT INVALID STATE TRANSITIONS (Guard)
  if (TERMINAL_STATES.has(commandRecord.status)) {
     console.log(`[INFO] requestId=${commandRecord.commandId} - Skipped invalid transition from ${commandRecord.status} -> ${status}`);
     return; 
  }
  
  commandRecord.status = status;
  console.log(`[INFO] requestId=${commandRecord.commandId} - State transition -> ${status.toUpperCase()}`);

  const io = getIo(req);
  await CommandHistory.updateOne(
    { _id: commandRecord._id },
    {
      status,
      ...(resultSummary ? { resultSummary } : {}),
      ...(status === 'completed' || status === 'failed' || status === 'timed_out' ? { completedAt: new Date() } : {}),
    }
  ).catch(() => null);

  if (io) {
    io.emit('command-status', {
      commandId: commandRecord.commandId,
      agentId: commandRecord.agentId,
      commandType: commandRecord.commandType,
      status,
      timestamp: new Date().toISOString(),
    });
  }
};

const startCommandExecution = async (req, commandRecord, dispatchArgs) => {
  const lifecycle = { state: 'created', cancelled: false };

  const simulateLifecycle = async () => {
    const delays = [
      { state: 'queued', delay: 100 },
      { state: 'dispatched', delay: 200 }, // cumulative 300ms
      { state: 'running', delay: 300 },    // cumulative 600ms
    ];
    for (const step of delays) {
      await sleep(step.delay);
      if (lifecycle.cancelled) break;
      lifecycle.state = step.state;
      await updateCommandState(req, commandRecord, lifecycle.state);
    }
  };

  // Start simulation asynchronously
  simulateLifecycle();

  try {
    const dispatchResult = await dispatchCommand(dispatchArgs);
    const response = dispatchResult?.response || dispatchResult;
    const output = typeof response === 'string' ? response : JSON.stringify(response);
    const resultSummary = response.resultSummary || response.summary || response.message || output.slice(0, 240);

    // Terminal State
    lifecycle.state = 'completed';
    lifecycle.cancelled = true;
    await updateCommandState(req, commandRecord, lifecycle.state, resultSummary);

    await CommandResult.create({
      commandId: commandRecord.commandId,
      clientId: commandRecord.agentId,
      success: true,
      status: 'success',
      output,
      rawResponse: response,
      receivedAt: new Date(),
    });

    await recordAuditLog({
      actor: dispatchArgs.requestedBy,
      action: 'COMMAND_EXECUTED',
      targetType: 'command',
      targetId: commandRecord.commandId,
      severity: 'info',
      status: 'completed',
      details: {
        agentId: commandRecord.agentId,
        command: commandRecord.type,
        source: dispatchArgs.payload.source,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error(`[ERROR] Command failed: ${error.message}`);
    lifecycle.state = 'failed';
    lifecycle.cancelled = true;
    await updateCommandState(req, commandRecord, lifecycle.state, error.message);

    await CommandResult.create({
      commandId: commandRecord.commandId,
      clientId: commandRecord.agentId,
      success: false,
      status: 'failed',
      output: error.message,
      receivedAt: new Date(),
    });

    await recordAuditLog({
      actor: dispatchArgs.requestedBy,
      action: 'COMMAND_FAILED',
      targetType: 'command',
      targetId: commandRecord.commandId,
      severity: 'error',
      status: 'failed',
      details: {
        agentId: commandRecord.agentId,
        command: commandRecord.type,
        error: error.message,
      },
      timestamp: new Date(),
    });
  }
};

const executeCommandByCode = async (command, req, res) => {
  const normalizedCommand = normalizeCommand(command);

  if (!normalizedCommand) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported command.',
    });
  }

  const agentId = req.body?.agentId || req.body?.clientId || req.params?.clientId;
  const clientSnapshot = await req.app.get('models')?.Client?.findOne({ agentId }).lean().catch(() => null);
  const hostname = clientSnapshot?.hostname || req.body?.hostname || 'unknown-host';
  const requestedBy = req.user?.username || 'system';
  const payload = { ...req.body };

  delete payload.command;
  delete payload.clientId;
  delete payload.agentId;

  const commandId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  // State: CREATED
  const commandRecord = await CommandHistory.create({
    commandId,
    agentId,
    hostname,
    commandType: normalizedCommand,
    type: normalizedCommand,
    status: 'created',
    requestedAt: new Date(),
  });

  // IMMEDIATELY RETURN TO FRONTEND
  res.status(202).json({
    success: true,
    message: 'Command accepted and queued for execution',
    commandId,
    status: 'created'
  });

  // RUN LIFECYCLE & DISPATCH IN BACKGROUND
  startCommandExecution(req, commandRecord, {
    app: req.app,
    command: normalizedCommand,
    agentId,
    payload: {
      ...payload,
      requestedBy,
      source: req.originalUrl,
      commandId,
      requestId: commandId, // Link request tracing
    },
    requestedBy,
  });
};

const runAntivirus = (req, res) => executeCommandByCode('ANTIVIRUS', req, res);

const runWindowsUpdate = (req, res) => executeCommandByCode('WINDOWS_UPDATE', req, res);

const runPortScan = (req, res) => executeCommandByCode('PORT_SCAN', req, res);

const runAllChecks = (req, res) => executeCommandByCode('COMPLIANCE_AUDIT', req, res);

module.exports = {
  runAntivirus,
  runWindowsUpdate,
  runPortScan,
  runAllChecks,
  executeCommandByCode,
};