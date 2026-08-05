const net = require('net');
const { EventEmitter } = require('events');
const { randomUUID } = require('crypto');

const DEFAULT_HOST = process.env.ADMIN_SERVER_HOST || '127.0.0.1';
const DEFAULT_PORT = Number(process.env.ADMIN_SERVER_PORT || 5000);
const DEFAULT_RECONNECT_DELAY = Number(process.env.ADMIN_SERVER_RECONNECT_DELAY || 3000);

class AdminServerBridge extends EventEmitter {
  constructor(options = {}) {
    super();
    this.host = options.host || DEFAULT_HOST;
    this.port = Number(options.port || DEFAULT_PORT);
    this.reconnectDelay = Number(options.reconnectDelay || DEFAULT_RECONNECT_DELAY);
    this.backendId = options.backendId || `backend-${randomUUID().slice(0, 8)}`;
    this.socket = null;
    this.buffer = '';
    this.connected = false;
    this.reconnectTimer = null;
    this.pendingRequests = new Map();
    this.readyPromise = null;
    this.readyResolve = null;
    this.readyReject = null;
  }

  start() {
    if (this.socket || this.connected) {
      return;
    }

    this.connect();
  }

  connect() {
    const socket = new net.Socket();
    this.socket = socket;
    this.buffer = '';

    socket.setEncoding('utf8');
    socket.setNoDelay(true);
    socket.setKeepAlive(true);

    socket.on('connect', () => {
      this.connected = true;
      this.emit('connected', { backendId: this.backendId, host: this.host, port: this.port });
      this.sendRaw({
        type: 'BACKEND_HELLO',
        backendId: this.backendId,
        role: 'backend',
        timestamp: new Date().toISOString(),
      });
      this.resolveReady();
    });

    socket.on('data', (chunk) => this.handleData(chunk));

    socket.on('error', (error) => {
      this.emit('error', error);
    });

    socket.on('close', () => {
      this.handleDisconnect();
    });

    socket.connect(this.port, this.host);
  }

  handleData(chunk) {
    this.buffer += chunk;

    let newlineIndex = this.buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const rawLine = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);
      newlineIndex = this.buffer.indexOf('\n');

      if (!rawLine) {
        continue;
      }

      try {
        const message = JSON.parse(rawLine);
        this.handleMessage(message);
      } catch (error) {
        this.emit('parse-error', { rawLine, error });
      }
    }
  }

  handleMessage(message) {
    const type = message.type || 'UNKNOWN';

    if (type === 'BACKEND_READY') {
      this.emit('backend-ready', message);
      return;
    }

    if (type === 'COMMAND_RESPONSE') {
      const requestId = message.requestId;
      if (requestId && this.pendingRequests.has(requestId)) {
        const pending = this.pendingRequests.get(requestId);
        clearTimeout(pending.timeoutId);
        this.pendingRequests.delete(requestId);
        pending.resolve(message);
      }

      this.emit('command-response', message);
      return;
    }

    if (type === 'COMPLIANCE_REPORT' || type === 'COMPLIANCE_RESULT') {
      this.emit('compliance-report', message);
      return;
    }

    if (type === 'CAPABILITIES') {
      this.emit('capabilities', message);
      return;
    }

    if (type === 'HEARTBEAT') {
      this.emit('heartbeat', message);
      return;
    }

    if (type === 'LOG_EVENT') {
      this.emit('log-event', message);
      return;
    }

    if (type === 'AGENT_CONNECTED') {
      this.emit('agent-connected', message);
      return;
    }

    if (type === 'AGENT_DISCONNECTED') {
      this.emit('agent-disconnected', message);
      return;
    }

    if (type === 'ERROR' || type === 'COMMAND_REJECTED') {
      this.emit('bridge-error', message);
      return;
    }

    this.emit('message', message);
  }

  handleDisconnect() {
    if (this.connected) {
      this.connected = false;
      this.emit('disconnected');
    }

    this.rejectAllPending(new Error('AdminServer connection was closed.'));
    this.scheduleReconnect();
  }

  scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
  }

  sendRaw(message) {
    if (!this.socket || this.socket.destroyed) {
      throw new Error('AdminServer bridge is not connected.');
    }

    this.socket.write(`${JSON.stringify(message)}\n`);
  }

  waitForReady(timeoutMs = 10000) {
    if (this.connected) {
      return Promise.resolve();
    }

    if (this.readyPromise) {
      return this.readyPromise;
    }

    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;

      const timeoutId = setTimeout(() => {
        this.clearReadyPromise();
        reject(new Error('AdminServer bridge did not become ready in time.'));
      }, timeoutMs);

      const cleanup = () => clearTimeout(timeoutId);
      this.once('backend-ready', () => {
        cleanup();
        this.clearReadyPromise();
        resolve();
      });

      this.once('disconnected', () => {
        cleanup();
      });
    });

    return this.readyPromise;
  }

  clearReadyPromise() {
    this.readyPromise = null;
    this.readyResolve = null;
    this.readyReject = null;
  }

  resolveReady() {
    if (this.readyResolve) {
      this.readyResolve();
      this.clearReadyPromise();
    }
  }

  rejectAllPending(error) {
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timeoutId);
      pending.reject(error);
    }

    this.pendingRequests.clear();
  }

  requestCommand({ agentId, command, payload = {}, requestedBy = 'system', timeoutMs = 60000 }) {
    return this.waitForReady(timeoutMs).then(() => {
      if (!agentId) {
        throw new Error('agentId is required to dispatch a command.');
      }

      const requestId = payload.requestId || randomUUID();
      const action = payload.action || 'CHECK';

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Timed out waiting for command response for ${requestId}.`));
        }, timeoutMs);

        this.pendingRequests.set(requestId, { resolve, reject, timeoutId });

        try {
          const rawMessage = {
            type: 'COMMAND_REQUEST',
            requestId,
            agentId,
            command,
            action,
            requestedBy,
            source: 'node-backend',
            timestamp: new Date().toISOString(),
          };

          // Flatten payload to avoid nested objects breaking Java regex parser
          if (payload && typeof payload === 'object') {
            for (const [key, value] of Object.entries(payload)) {
              if (typeof value !== 'object' && key !== 'action') {
                rawMessage[`payload_${key}`] = value;
              }
            }
          }

          this.sendRaw(rawMessage);
        } catch (error) {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(requestId);
          reject(error);
        }
      });
    });
  }
}

let bridgeInstance = null;

const getAdminServerBridge = () => {
  if (!bridgeInstance) {
    bridgeInstance = new AdminServerBridge();
  }

  return bridgeInstance;
};

module.exports = {
  AdminServerBridge,
  getAdminServerBridge,
};