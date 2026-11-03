const router = require("express").Router();
const mongoose = require("mongoose");
const crypto = require("crypto");
const { z } = require("zod");
const ShippingSettings = require("../shipping/shipping.model");
const Product = require("../products/product.model");
const Order = require("./order.model");
const { requireAdmin, requireRole } = require("../auth/auth.middleware");

const schema = z.object({
  requestId: z.string().uuid(),
  deliveryZone: z.enum(["insideDhaka", "outsideDhaka"]),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().regex(/^01[3-9]\d{8}$/),
    address: z.string().trim().min(10).max(500),
    city: z.string().trim().min(2).max(100),
    notes: z.string().max(1000).optional()
  }).strict(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1).max(20)
  }).strict()).min(1).max(30)
}).strict();

router.post("/", async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid checkout information"
    });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database unavailable"
    });
  }

  const { customer, items, requestId } = parsed.data;
  const ids = items.map(i => i.productId);

  if (
    ids.some(id => !mongoose.isValidObjectId(id)) ||
    new Set(ids).size !== ids.length
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid or duplicate products"
    });
  }


  // Identify identical retries without creating another order.
  const requestHash = crypto
    .createHash("sha256")
    .update(JSON.stringify({
      customer,
      items,
      deliveryZone: parsed.data.deliveryZone
    }))
    .digest("hex");

  try {
    await Order.init();

    const existing = await Order.findOne({
      requestId
    }).select("+requestHash").lean();

    if (existing) {
      if (existing.requestHash !== requestHash) {
        return res.status(409).json({
          success: false,
          message: "Checkout details changed. Start a new attempt."
        });
      }

      return res.json({
        success: true,
        message: "Order already placed",
        orderNumber: existing.orderNumber,
        total: existing.total
      });
    }
  } catch {
    return res.status(503).json({
      success: false,
      message: "Checkout temporarily unavailable"
    });
  }

  const shippingConfig = await ShippingSettings.findOne({
    key: "default"
  }).lean();

  if (!shippingConfig?.enabled) {
    return res.status(503).json({
      success: false,
      message: "Checkout is currently disabled"
    });
  }

  const deliveryCharge =
    shippingConfig[parsed.data.deliveryZone];

  const session = await mongoose.startSession();

  try {
    let createdOrder;

    await session.withTransaction(async () => {
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            status: "active",
            stock: { $gte: item.quantity }
          },
          { $inc: { stock: -item.quantity } },
          { returnDocument: "before", session }
        );

        if (!product) {
          throw new Error("Product unavailable or insufficient stock");
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          subtotal: product.price * item.quantity
        });
      }

      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.subtotal, 0
      );

      const [order] = await Order.create([{
        requestId,
        requestHash,
        orderNumber: "MT-" + crypto.randomUUID(),
        customer,
        items: orderItems,
        subtotal,
        deliveryCharge,
        total: subtotal + deliveryCharge,
        paymentMethod: "COD",
        paymentStatus: "unpaid",
        status: "pending"
      }], { session });

      createdOrder = order;
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderNumber: createdOrder.orderNumber,
      total: createdOrder.total
    });
  } catch (error) {
    if (
      error.code === 11000 ||
      error.code === 112 ||
      error.hasErrorLabel?.("TransientTransactionError")
    ) {
      try {
        const existing = await Order.findOne({
          requestId
        }).select("+requestHash").lean();

        if (existing) {
          if (existing.requestHash !== requestHash) {
            return res.status(409).json({
              success: false,
              message: "Checkout details changed. Start a new attempt."
            });
          }

          return res.json({
            success: true,
            message: "Order already placed",
            orderNumber: existing.orderNumber,
            total: existing.total
          });
        }
      } catch {
        // Keep the same request ID for a later retry.
      }

      return res.status(409).json({
        success: false,
        message: "Order may be processing. Retry the same checkout."
      });
    }

    const stockError = error.message.includes("insufficient stock") ||
      error.message.includes("Product unavailable");

    res.status(stockError ? 409 : 500).json({
      success: false,
      message: stockError
        ? "One or more products are unavailable"
        : "Unable to place order. Please try again."
    });
  } finally {
    await session.endSession();
  }
});

router.get("/admin", requireAdmin,
  requireRole("super_admin", "admin", "manager"),
  async (req, res) => {
    try {
      const orders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      res.json({ success: true, data: orders });
    } catch {
      res.status(500).json({
        success: false,
        message: "Unable to load orders"
      });
    }
  }
);


router.patch("/admin/:id/status",
  requireAdmin,
  requireRole("super_admin", "admin"),
  async (req, res) => {
    const allowed = [
      "pending", "confirmed", "processing",
      "shipped", "delivered", "cancelled"
    ];
    const nextStatus = req.body?.status;

    if (
      !mongoose.isValidObjectId(req.params.id) ||
      !allowed.includes(nextStatus) ||
      Object.keys(req.body || {}).some(k => k !== "status")
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status request"
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database unavailable"
      });
    }

    const session = await mongoose.startSession();

    try {
      let result;

      await session.withTransaction(async () => {
        const order = await Order.findById(req.params.id).session(session);

        if (!order) {
          const err = new Error("Order not found");
          err.httpStatus = 404;
          throw err;
        }

        if (order.status === nextStatus) {
          result = { status: order.status, unchanged: true };
          return;
        }

        if (["cancelled", "delivered"].includes(order.status)) {
          const err = new Error("Finalized orders cannot be changed");
          err.httpStatus = 409;
          throw err;
        }

        if (nextStatus === "cancelled") {
          for (const item of order.items) {
            await Product.updateOne(
              { _id: item.product },
              { $inc: { stock: item.quantity } },
              { session }
            );
          }
        }

        order.status = nextStatus;
        await order.save({ session });
        result = { status: order.status, unchanged: false };
      });

      res.json({
        success: true,
        message: "Order status updated",
        data: result
      });
    } catch (error) {
      res.status(error.httpStatus || 500).json({
        success: false,
        message: error.httpStatus
          ? error.message
          : "Unable to update order status"
      });
    } finally {
      await session.endSession();
    }
  }
);


const trackingLimiter = require("express-rate-limit")({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Try again later."
  }
});

const trackingSchema = z.object({
  orderNumber: z.string()
    .regex(/^MT-[0-9a-f-]{36}$/i),
  phone: z.string()
    .regex(/^01[3-9]\d{8}$/)
}).strict();

router.post("/track", trackingLimiter, async (req, res) => {
  const parsed = trackingSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid order number and phone number"
    });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database unavailable"
    });
  }

  try {
    const order = await Order.findOne({
      orderNumber: parsed.data.orderNumber,
      "customer.phone": parsed.data.phone
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No matching order found"
      });
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          subtotal: item.subtotal
        })),
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        total: order.total
      }
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to track order"
    });
  }
});


module.exports = router;
