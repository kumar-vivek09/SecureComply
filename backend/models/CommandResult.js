const mongoose = require('mongoose');

const commandResultSchema = new mongoose.Schema(
  {
    commandId: { type: String, required: true, index: true },
    clientId: { type: String, required: true, index: true },
    success: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['success', 'failed', 'partial'],
      default: 'success',
    },
    output: { type: String, default: '' },
    error: { type: String, default: '' },
    exitCode: { type: Number, default: 0 },
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    receivedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CommandResult', commandResultSchema);