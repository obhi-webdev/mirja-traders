const router = require("express").Router();
const mongoose = require("mongoose");
const { z } = require("zod");
const Banner = require("./banner.model");

const {
  requireAdmin,
  requireRole
} = require("../auth/auth.middleware");

const schema = z.object({
  title: z.string().trim().min(2).max(150),
  subtitle: z.string().trim().max(400).optional(),
  image: z.string().url().max(2048).refine(
    value =>
      value.startsWith("https://") ||
      (
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/(localhost|127\.0\.0\.1):5001\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/i.test(value)
      ),
    "A valid HTTPS image URL is required"
  ),
  buttonText: z.string().trim().max(60).optional(),
  buttonLink: z.string().trim().regex(
    /^\/(?!\/)[a-zA-Z0-9/_?=&%-]*$/,
    "Internal website path required"
  ).max(300).optional(),
  placement: z.enum([
    "hero", "sideTop", "sideBottom"
  ]).optional(),
  textColor: z.string()
    .regex(/^#[0-9a-fA-F]{6}$/).optional(),
  textPosition: z.enum([
    "left", "center", "right"
  ]).optional(),
  showTextOverlay: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional()
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

router.get("/", async (req, res) => {
  try {
    const data = await Banner.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ success: true, data });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to load banners"
    });
  }
});

router.get("/admin",
  requireAdmin,
  requireRole("super_admin", "admin"),
  async (req, res) => {
    try {
      const data = await Banner.find()
        .sort({ sortOrder: 1, createdAt: -1 })
        .limit(100)
        .lean();

      res.json({ success: true, data });
    } catch {
      res.status(500).json({
        success: false,
        message: "Unable to load banners"
      });
    }
  }
);

router.post("/admin",
  requireAdmin,
  requireRole("super_admin", "admin"),
  async (req, res) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner information"
      });
    }

    try {
      const data = await Banner.create(parsed.data);
      res.status(201).json({ success: true, data });
    } catch {
      res.status(500).json({
        success: false,
        message: "Unable to create banner"
      });
    }
  }
);

router.patch("/admin/:id",
  requireAdmin,
  requireRole("super_admin", "admin"),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID"
      });
    }

    const parsed = schema.partial().safeParse(req.body);

    if (!parsed.success || !Object.keys(parsed.data).length) {
      return res.status(400).json({
        success: false,
        message: "Invalid update information"
      });
    }

    try {
      const data = await Banner.findByIdAndUpdate(
        req.params.id,
        { $set: parsed.data },
        { returnDocument: "after", runValidators: true }
      );

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Banner not found"
        });
      }

      res.json({ success: true, data });
    } catch {
      res.status(500).json({
        success: false,
        message: "Unable to update banner"
      });
    }
  }
);

router.delete("/admin/:id",
  requireAdmin,
  requireRole("super_admin", "admin"),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID"
      });
    }

    try {
      const data = await Banner.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive: false } },
        { returnDocument: "after" }
      );

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Banner not found"
        });
      }

      res.json({
        success: true,
        message: "Banner deactivated"
      });
    } catch {
      res.status(500).json({
        success: false,
        message: "Unable to deactivate banner"
      });
    }
  }
);


router.delete(
  "/admin/:id/permanent",
  requireAdmin,
  requireRole("super_admin"),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid banner ID"
      });
    }

    try {
      const deleted = await Banner.findByIdAndDelete(
        req.params.id
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Banner not found"
        });
      }

      res.json({
        success: true,
        message: "Banner permanently deleted"
      });
    } catch {
      res.status(500).json({
        success: false,
        message: "Unable to delete banner"
      });
    }
  }
);

module.exports = router;
