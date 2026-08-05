const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const { EventEmitter } = require('events');

// Startup state machine states
const STATES = {
  INITIALIZING: 'INITIALIZING',
  STARTING_MONGO: 'STARTING_MONGO',
  STARTING_ADMINSERVER: 'STARTING_ADMINSERVER',
  CONNECTING_BRIDGE: 'CONNECTING_BRIDGE',
  STARTING_AGENT: 'STARTING_AGENT',
  READY: 'READY',
  ERROR: 'ERROR',
};

const JAVA_DIR = path.resolve(__dirname, '..', 'controller');

class StartupManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.mode = options.mode || (process.env.NODE_ENV === 'production' ? 'production' : 'development');
    this.state = STATES.INITIALIZING;
    this.startTime = Date.now();
    this.timeline = [];
    this.adminServerProcess = null;
    this.agentProcess = null;
    this.adminServerPort = Number(process.env.ADMIN_SERVER_PORT || 5000);
    this.startupTimeoutMs = Number(process.env.STARTUP_TIMEOUT_MS || 30000);
    this.restartDelayMs = Number(process.env.RESTART_DELAY_MS || 5000);
    this.maxRestarts = Number(process.env.MAX_RESTARTS || 5);
    this.adminServerRestarts = 0;
    this.agentRestarts = 0;
    this.supervisorEnabled = true;
    this.applicationVersion = '1.0.0';
    this.protocolVersion = '1';
  }

  /**
   * Transition to a new state and emit a state-change event.
   */
  _transition(newState, detail = '') {
    const previous = this.state;
    this.state = newState;
    const entry = {
      from: previous,
      to: newState,
      detail,
      timestamp: new Date().toISOString(),
    };
    this.timeline.push(entry);
    this.emit('state-change', entry);
    console.log(`[${entry.timestamp}] [INFO] StartupManager: ${previous} -> ${newState}${detail ? ' | ' + detail : ''}`);
  }

  /**
   * Main entry point. Orchestrates the full deterministic startup sequence.
   * @param {object} deps - { mongoose, adminBridge, io }
   */
  async start(deps) {
    const { mongoose, adminBridge, io } = deps;

    try {
      // Phase 1: MongoDB
      this._transition(STATES.STARTING_MONGO, 'Waiting for Mongoose connection');
      await this._waitForMongo(mongoose);

      // Phase 2: AdminServer (dev mode only)
      this._transition(STATES.STARTING_ADMINSERVER);
      if (this.mode === 'development') {
        await this._spawnAdminServer();
        await this._probePort(this.adminServerPort);
      } else {
        this._log('INFO', 'Production mode: assuming AdminServer is already running');
      }

      // Phase 3: Bridge
      this._transition(STATES.CONNECTING_BRIDGE, 'Connecting AdminServerBridge');
      adminBridge.start();
      await adminBridge.waitForReady(this.startupTimeoutMs);

      // Phase 4: Agent (dev mode only)
      this._transition(STATES.STARTING_AGENT);
      if (this.mode === 'development') {
        await this._spawnAgent();
      } else {
        this._log('INFO', 'Production mode: assuming Agent is already running');
      }

      // Done
      this._transition(STATES.READY, 'All components operational');
      this.emit('system-ready');

      // Start supervisor loop
      if (this.mode === 'development') {
        this._supervise();
      }
    } catch (error) {
      this._transition(STATES.ERROR, error.message);
      this.emit('startup-error', error);
      throw error;
    }
  }

  /**
   * Wait for Mongoose to be connected (or already connected).
   */
  async _waitForMongo(mongoose) {
    if (mongoose.connection.readyState === 1) {
      this._log('INFO', 'MongoDB already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MongoDB connection timed out'));
      }, this.startupTimeoutMs);

      mongoose.connection.once('connected', () => {
        clearTimeout(timeout);
        this._log('INFO', 'MongoDB connected');
        resolve();
      });

      mongoose.connection.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /**
   * Spawn the Java AdminServer as a child process.
   */
  _spawnAdminServer() {
    return new Promise((resolve, reject) => {
      this._log('INFO', 'Spawning AdminServer process');

      const proc = spawn('java', ['-cp', JAVA_DIR, 'AdminServer'], {
        cwd: JAVA_DIR,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.adminServerProcess = proc;

      proc.stdout.on('data', (data) => {
        const text = data.toString().trim();
        if (text) this._log('INFO', `[AdminServer] ${text}`);
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString().trim();
        if (text) this._log('WARN', `[AdminServer:err] ${text}`);
      });

      proc.on('error', (err) => {
        this._log('ERROR', `AdminServer spawn error: ${err.message}`);
        reject(err);
      });

      proc.on('exit', (code) => {
        this._log('WARN', `AdminServer exited with code ${code}`);
        this.adminServerProcess = null;
        this.emit('adminserver-exit', { code });
      });

      // Resolve immediately after spawn, readiness is verified by port probe
      setTimeout(() => resolve(), 500);
    });
  }

  /**
   * Spawn the Java AgentMain as a child process.
   */
  _spawnAgent() {
    return new Promise((resolve, reject) => {
      this._log('INFO', 'Spawning AgentMain process');

      const proc = spawn('java', ['-cp', JAVA_DIR, 'AgentMain'], {
        cwd: JAVA_DIR,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.agentProcess = proc;

      proc.stdout.on('data', (data) => {
        const text = data.toString().trim();
        if (text) this._log('INFO', `[Agent] ${text}`);
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString().trim();
        if (text) this._log('WARN', `[Agent:err] ${text}`);
      });

      proc.on('error', (err) => {
        this._log('ERROR', `AgentMain spawn error: ${err.message}`);
        reject(err);
      });

      proc.on('exit', (code) => {
        this._log('WARN', `AgentMain exited with code ${code}`);
        this.agentProcess = null;
        this.emit('agent-exit', { code });
      });

      // Give the agent a moment to connect
      setTimeout(() => resolve(), 2000);
    });
  }

  /**
   * Probe a TCP port to verify that AdminServer is listening.
   */
  _probePort(port, host = '127.0.0.1') {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + this.startupTimeoutMs;
      const attempt = () => {
        if (Date.now() > deadline) {
          return reject(new Error(`TCP port ${port} did not become reachable within ${this.startupTimeoutMs}ms`));
        }

        const probe = new net.Socket();
        probe.setTimeout(1000);

        probe.on('connect', () => {
          probe.destroy();
          this._log('INFO', `AdminServer TCP port ${port} is reachable`);
          resolve();
        });

        probe.on('error', () => {
          probe.destroy();
          setTimeout(attempt, 500);
        });

        probe.on('timeout', () => {
          probe.destroy();
          setTimeout(attempt, 500);
        });

        probe.connect(port, host);
      };

      attempt();
    });
  }

  /**
   * Supervisor: monitors AdminServer and Agent processes, restarting on crash.
   */
  _supervise() {
    this.on('adminserver-exit', async () => {
      if (!this.supervisorEnabled) return;

      if (this.adminServerRestarts >= this.maxRestarts) {
        this._log('ERROR', `AdminServer max restarts (${this.maxRestarts}) exceeded. Supervisor stopped.`);
        this.emit('supervisor-alert', { component: 'AdminServer', reason: 'max-restarts-exceeded' });
        return;
      }

      this.adminServerRestarts++;
      this._log('WARN', `AdminServer crashed. Restarting in ${this.restartDelayMs}ms (attempt ${this.adminServerRestarts}/${this.maxRestarts})`);
      this.emit('supervisor-restart', { component: 'AdminServer', attempt: this.adminServerRestarts });

      await this._sleep(this.restartDelayMs);
      try {
        await this._spawnAdminServer();
        await this._probePort(this.adminServerPort);
        this._log('INFO', 'AdminServer restarted successfully');
      } catch (error) {
        this._log('ERROR', `AdminServer restart failed: ${error.message}`);
      }
    });

    this.on('agent-exit', async () => {
      if (!this.supervisorEnabled) return;

      if (this.agentRestarts >= this.maxRestarts) {
        this._log('ERROR', `AgentMain max restarts (${this.maxRestarts}) exceeded. Supervisor stopped.`);
        this.emit('supervisor-alert', { component: 'AgentMain', reason: 'max-restarts-exceeded' });
        return;
      }

      this.agentRestarts++;
      this._log('WARN', `AgentMain crashed. Restarting in ${this.restartDelayMs}ms (attempt ${this.agentRestarts}/${this.maxRestarts})`);
      this.emit('supervisor-restart', { component: 'AgentMain', attempt: this.agentRestarts });

      await this._sleep(this.restartDelayMs);
      try {
        await this._spawnAgent();
        this._log('INFO', 'AgentMain restarted successfully');
      } catch (error) {
        this._log('ERROR', `AgentMain restart failed: ${error.message}`);
      }
    });
  }

  /**
   * Gracefully stop all managed processes.
   */
  async shutdown() {
    this.supervisorEnabled = false;

    if (this.agentProcess) {
      this._log('INFO', 'Stopping AgentMain');
      this.agentProcess.kill('SIGTERM');
    }

    if (this.adminServerProcess) {
      this._log('INFO', 'Stopping AdminServer');
      this.adminServerProcess.kill('SIGTERM');
    }
  }

  /**
   * Build the detailed health status object.
   */
  getHealthStatus(deps = {}) {
    const { mongoose, adminBridge } = deps;
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      applicationVersion: this.applicationVersion,
      protocolVersion: this.protocolVersion,
      startupState: this.state,
      mode: this.mode,
      backend: 'running',
      mongo: mongoose ? (mongoose.connection.readyState === 1 ? 'connected' : 'disconnected') : 'unknown',
      socket: 'connected',
      adminServer: this.adminServerProcess ? 'running' : (this.mode === 'production' ? 'external' : 'stopped'),
      bridge: adminBridge ? (adminBridge.connected ? 'connected' : 'disconnected') : 'unknown',
      agents: {
        online: 0,  // Will be populated from MongoDB at runtime
        offline: 0,
      },
      uptime,
      timeline: this.timeline,
    };
  }

  /**
   * Simple readiness check: true if state is READY.
   */
  isReady() {
    return this.state === STATES.READY;
  }

  _log(level, message) {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [${level}] ${message}`);
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = { StartupManager, STATES };
