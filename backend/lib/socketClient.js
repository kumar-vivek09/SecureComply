const net = require('net');

const DEFAULT_HOST = process.env.AGENT_HOST || '127.0.0.1';
const DEFAULT_PORT = Number(process.env.AGENT_PORT || 5000);

const parseResponse = (data) => {
  const payload = data.toString().trim();

  if (!payload) {
    return payload;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
};

const sendTcpJson = (message, options = {}) => {
  const { host = DEFAULT_HOST, port = DEFAULT_PORT, timeout = 6000 } = options;

  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let settled = false;

    const cleanup = () => {
      if (!client.destroyed) {
        client.destroy();
      }
    };

    client.setEncoding('utf8');
    client.setNoDelay(true);
    client.setTimeout(timeout, () => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error('Agent command socket did not respond in time.'));
      }
    });

    client.connect(port, host, () => {
      client.write(`${JSON.stringify(message)}\n`);
    });

    client.once('data', (data) => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(parseResponse(data));
      }
    });

    client.once('error', (error) => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(error);
      }
    });
  });
};

const sendCommandToJava = (command, host = DEFAULT_HOST, port = DEFAULT_PORT, timeout = 6000) => {
  return sendTcpJson(
    {
      type: 'COMMAND_REQUEST',
      command,
    },
    { host, port, timeout }
  ).then((response) => {
    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object') {
      return response.output || response.message || JSON.stringify(response);
    }

    return String(response);
  });
};

module.exports = { sendTcpJson, sendCommandToJava };
