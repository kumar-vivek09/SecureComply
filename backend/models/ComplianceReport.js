const mongoose = require('mongoose');

const complianceReportSchema = new mongoose.Schema(
  {
    agentId: { type: String, required: true, index: true },
    hostname: { type: String, required: true, trim: true },
    complianceScore: { type: Number, required: true, min: 0, max: 100 },
    findings: { type: [mongoose.Schema.Types.Mixed], default: [] },
    summary: { type: String, default: '' },
    generatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ComplianceReport', complianceReportSchema);