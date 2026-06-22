const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true, trim: true },
  status: { type: String, enum: ['connected', 'disconnected'], default: 'connected' },
  complianceStatus: { type: String, enum: ['compliant', 'non-compliant'], default: 'compliant' },
  score: { type: Number, default: 0, min: 0, max: 100 },
  lastSeen: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Client', clientSchema);
