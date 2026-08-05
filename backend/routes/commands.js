const express = require('express');
const router = express.Router();
const { runAntivirus, runWindowsUpdate, runPortScan, runAllChecks } = require('../controllers/commandController');

router.post('/antivirus', runAntivirus);
router.post('/windows-update', runWindowsUpdate);
router.post('/port-scan', runPortScan);
router.post('/all-checks', runAllChecks);

module.exports = router;