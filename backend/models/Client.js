const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    agentId: { type: String, required: true, unique: true, trim: true, index: true },
    hostname: { type: String, required: true, trim: true },
    ipAddress: { type: String, required: true, trim: true },
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    lastHeartbeat: { type: Date, default: Date.now },
    osName: { type: String, default: 'unknown', trim: true },
    complianceScore: { type: Number, default: 0, min: 0, max: 100 },
    lastComplianceCheck: { type: Date },
    capabilities: { type: [String], default: [] },
    capabilityVersion: { type: String, default: null },
    capabilityModules: { type: [Object], default: [] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Client', clientSchema);
