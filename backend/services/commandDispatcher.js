const COMMAND_ALIASES = {
  ANTIVIRUS: 'ANTIVIRUS',
  WINDOWS_UPDATE: 'WINDOWS_UPDATE',
  WINDOWSUPDATE: 'WINDOWS_UPDATE',
  PORT_SCAN: 'PORT_SCAN',
  PORTSCAN: 'PORT_SCAN',
  ALL: 'COMPLIANCE_AUDIT',
  ALL_CHECKS: 'COMPLIANCE_AUDIT',
  COMPLIANCE_AUDIT: 'COMPLIANCE_AUDIT',
};

const normalizeCommand = (command) => {
  if (typeof command !== 'string') {
    return null;
  }

  const normalized = command.trim().toUpperCase().replace(/[-\s]+/g, '_');
  return COMMAND_ALIASES[normalized] || normalized;
};

const dispatchCommand = async ({ command, clientId = null, agentId = null, host, port, timeout, app, metadata = {} }) => {
  const normalizedCommand = normalizeCommand(command);

  if (!normalizedCommand) {
    throw new Error('Unsupported command.');
  }

  const bridge = app?.get?.('adminBridge') || metadata.app?.get?.('adminBridge');
  if (!bridge) {
    throw new Error('AdminServer bridge is not available.');
  }

  const targetAgentId = agentId || clientId;

  const response = await bridge.requestCommand({
    agentId: targetAgentId,
    command: normalizedCommand,
    payload: metadata,
    requestedBy: metadata.requestedBy || 'system',
    timeoutMs: timeout,
  });

  return {
    command: normalizedCommand,
    response,
  };
};

module.exports = {
  dispatchCommand,
  normalizeCommand,
};