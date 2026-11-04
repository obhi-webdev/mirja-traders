const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  fileId: { type: String, required: true },
  status: {
    type: String,
    enum: ["stored", "deleting", "pending", "deleted"],
    default: "stored"
  },
  lastError: { type: String, default: "" },
  deletedAt: Date
}, { timestamps: true });

module.exports = mongoose.model("ImageAsset", schema);
