const mongoose = require('mongoose');

const commandHistorySchema = new mongoose.Schema(
  {
    commandId: { type: String, required: true, unique: true, index: true },
    agentId: { type: String, required: true, trim: true, index: true },
    hostname: { type: String, required: true, trim: true },
    commandType: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: ['created', 'queued', 'dispatched', 'running', 'completed', 'failed', 'timed_out'],
      default: 'created',
    },
    requestedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    resultSummary: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CommandHistory', commandHistorySchema);