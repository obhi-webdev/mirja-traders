const router = require("express").Router();
const mongoose = require("mongoose");
const { z } = require("zod");
const Settings = require("./shipping.model");
const {
  requireAdmin,
  requireRole
} = require("../auth/auth.middleware");

const schema = z.object({
  enabled: z.boolean(),
  insideDhaka: z.number().int().min(0).max(10000),
  outsideDhaka: z.number().int().min(0).max(10000)
}).strict();

router.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database unavailable"
    });
  }
  next();
});

router.get("/config", async (req, res) => {
  try {
    const config = await Settings.findOne({
      key: "default"
    }).lean();

    res.json({
      success: true,
      data: {
        enabled: config?.enabled ?? false,
        insideDhaka: config?.insideDhaka ?? 0,
        outsideDhaka: config?.outsideDhaka ?? 0,
        paymentMethod: "COD"
      }
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to load checkout settings"
    });
  }
});

router.put(
  "/config",
  requireAdmin,
  requireRole("super_admin", "admin"),
  async (req, res) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery settings"
      });
    }

    try {
      const config = await Settings.findOneAndUpdate(
        { key: "default" },
        { $set: result.data },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

      res.json({
        success: true,
        data: config
      });
    } catch {
      res.status(500).json({
        success: false,
        message: "Unable to save delivery settings"
      });
    }
  }
);

module.exports = router;
