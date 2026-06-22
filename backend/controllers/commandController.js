const { exec } = require('child_process');
const path = require('path');

const runJava = (className, res, req) => {
  console.log("Running Java class:", className);
  const classpath = path.join(__dirname, '../controller');
  const command = `java -cp "${classpath}" ${className}`;

  exec(command, (error, stdout, stderr) => {
    const io = req?.app?.get('io');

    if (error) {
      console.error(`Error executing ${className}:`, error);
      const errorMsg = stderr || error.message;
      
      // Emit error log via WebSocket
      if (io) {
        io.emit('new-log', {
          message: errorMsg,
          level: 'error',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(500).json({
        success: false,
        error: errorMsg,
        message: `Failed to execute ${className}`
      });
    }

    // Emit success log via WebSocket
    if (io) {
      io.emit('new-log', {
        message: stdout.trim(),
        level: 'info',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `${className} executed successfully`,
      output: stdout.trim()
    });
  });
};

const runAntivirus = (req, res) => {
  runJava('Antivirus', res, req);
};

const runWindowsUpdate = (req, res) => {
  runJava('WindowsUpdate', res, req);
};

const runPortScan = (req, res) => {
  runJava('PortScanner', res, req);
};

const runAllChecks = (req, res) => {
  console.log("Running Java class: SecurityModule");
  const classpath = path.join(__dirname, '../controller');
  const command = `java -cp "${classpath}" SecurityModule`;

  exec(command, (error, stdout, stderr) => {
    const io = req?.app?.get('io');

    if (error) {
      console.error('Error executing SecurityModule:', error);
      const errorMsg = stderr || error.message;
      
      // Emit error log via WebSocket
      if (io) {
        io.emit('new-log', {
          message: errorMsg,
          level: 'error',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(500).json({
        success: false,
        error: errorMsg,
        message: 'Failed to execute SecurityModule'
      });
    }

    // Emit success log via WebSocket
    if (io) {
      io.emit('new-log', {
        message: stdout.trim(),
        level: 'info',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'SecurityModule executed successfully',
      output: stdout.trim()
    });
  });
};

module.exports = {
  runAntivirus,
  runWindowsUpdate,
  runPortScan,
  runAllChecks
};
console.log("Running command:", command);