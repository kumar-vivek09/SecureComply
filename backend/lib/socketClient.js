const net = require('net');

const sendCommandToJava = (command, host = '127.0.0.1', port = 5000, timeout = 6000) => {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let settled = false;

    const cleanup = () => {
      if (!client.destroyed) {
        client.destroy();
      }
    };

    client.setEncoding('utf8');
    client.setTimeout(timeout, () => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error('Java socket server did not respond in time.'));
      }
    });

    client.connect(port, host, () => {
      client.write(`${command}\n`);
    });

    client.once('data', (data) => {
      if (!settled) {
        settled = true;
        cleanup();
        resolve(data.toString().trim());
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

module.exports = { sendCommandToJava };
