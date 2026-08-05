const mongoose = require('mongoose');

const commandSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true, trim: true, index: true },
    type: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: ['queued', 'sent', 'completed', 'failed', 'expired'],
      default: 'queued',
    },
    requestedBy: { type: String, trim: true, default: 'system' },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    requestedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Command', commandSchema);