const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    default: ""
  },
  image: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    default: "Shop Now"
  },
  buttonLink: {
    type: String,
    default: "/shop"
  },
  placement: {
    type: String,
    enum: ["hero", "sideTop", "sideBottom"],
    default: "hero"
  },
  textColor: {
    type: String,
    default: "#FFFFFF"
  },
  textPosition: {
    type: String,
    enum: ["left", "center", "right"],
    default: "left"
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

bannerSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model("Banner", bannerSchema);
