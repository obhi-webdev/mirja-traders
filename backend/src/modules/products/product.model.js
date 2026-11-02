const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  sku: String,
  name: String,
  options: {
    type: Map,
    of: String
  },
  price: Number,
  stock: {
    type: Number,
    default: 0,
    min: 0
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  sku: {
    type: String,
    trim: true
  },
  description: String,
  shortDescription: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  comparePrice: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  images: [String],
  variants: [variantSchema],
  brand: String,
  specifications: {
    type: Map,
    of: String
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ["draft", "active", "archived"],
    default: "draft"
  },
  seo: {
    title: String,
    description: String
  }
}, { timestamps: true });

productSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Product", productSchema);
