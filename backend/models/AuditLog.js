const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true, index: true },
    targetType: { type: String, default: 'command', trim: true },
    targetId: { type: String, default: '', trim: true },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
    },
    status: { type: String, default: 'recorded', trim: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);