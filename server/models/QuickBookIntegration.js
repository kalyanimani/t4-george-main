const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const QuickBookIntegrationSchema = new Schema(
  {
    clientId: { type: String, required: true, unique: true },
    clientSecret: { type: String, required: true, unique: true },
    realmId: { type: String },
    accessToken: String,
    refreshToken: { type: String, required: true },
    refreshTokenUpdatedAt: Date,
    accesssTokenUpdatedAt: Date,
    lastProductSyncedAt: Date,
  },
  { timestamps: true }
);

module.exports = QuickBookIntegration = mongoose.model('QuickBookIntegration', QuickBookIntegrationSchema);
