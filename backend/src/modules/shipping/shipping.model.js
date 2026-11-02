const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    default: "default"
  },
  enabled: {
    type: Boolean,
    default: false
  },
  insideDhaka: {
    type: Number,
    default: 0,
    min: 0
  },
  outsideDhaka: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("ShippingSettings", schema);
