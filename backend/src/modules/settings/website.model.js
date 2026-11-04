const mongoose = require("mongoose");

const websiteSchema = new mongoose.Schema({
  key: {
    type: String,
    default: "default",
    unique: true
  },
  siteName: {
    type: String,
    default: "Mirja Traders"
  },
  siteTitle: {
    type: String,
    default: "Mirja Traders | Electronics & Gadgets"
  },
  description: {
    type: String,
    default: "Discover laptops, smartphones and smart gadgets at Mirja Traders."
  },
  logoUrl: {
    type: String,
    default: ""
  },
  logoIconUrl: { type: String, default: "" },
  logoFirstText: { type: String, default: "Mirja" },
  logoSecondText: { type: String, default: "Traders" },
  logoFirstColor: { type: String, default: "#2457B5" },
  logoSecondColor: { type: String, default: "#F59E0B" },
  logoIconSize: { type: Number, default: 42, min: 24, max: 100 },
  footerBackgroundColor: { type: String, default: "#EA580C" },
  footerHeadingColor: { type: String, default: "#FFFFFF" },
  footerTextColor: { type: String, default: "#FFF7ED" },
  footerLinkColor: { type: String, default: "#FFEDD5" },
  footerAccentColor: { type: String, default: "#FFFFFF" },
  metaPixelId: {
    type: String,
    default: ""
  },
  pixelEnabled: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("WebsiteSettings", websiteSchema);
