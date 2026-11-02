const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
    sparse: true,
    immutable: true
  },
  requestHash: {
    type: String,
    select: false
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    notes: { type: String, default: "" }
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: String,
    price: Number,
    quantity: Number,
    subtotal: Number
  }],
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ["COD"],
    default: "COD"
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid"
  },
  status: {
    type: String,
    enum: [
      "pending", "confirmed", "processing",
      "shipped", "delivered", "cancelled"
    ],
    default: "pending"
  }
}, { timestamps: true });

orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
