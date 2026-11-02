const router = require("express").Router();
const mongoose = require("mongoose");
const { z } = require("zod");
const Settings = require("./website.model");
const {
  requireAdmin,
  requireRole
} = require("../auth/auth.middleware");

const defaults = {
  siteName: "Mirja Traders",
  siteTitle: "Mirja Traders | Electronics & Gadgets",
  description: "Discover laptops, smartphones and smart gadgets at Mirja Traders.",
  logoUrl: "",
  logoIconUrl: "",
  logoFirstText: "Mirja",
  logoSecondText: "Traders",
  logoFirstColor: "#2457B5",
  logoSecondColor: "#F59E0B",
  logoIconSize: 42,
  metaPixelId: "",
  pixelEnabled: false
};

const httpsUrl = z.union([
  z.literal(""),
  z.url().max(2048).refine(
    value => value.startsWith("https://"),
    "HTTPS URL required"
  )
]);


const logoImageUrl = z.union([
  z.literal(""),
  z.string().url().max(2048).refine(value =>
    value.startsWith("https://") ||
    (
      process.env.NODE_ENV !== "production" &&
      /^http:\/\/(localhost|127\.0\.0\.1):5001\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/i.test(value)
    ),
    "Use an HTTPS URL or local uploaded image"
  )
]);

const logoColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const schema = z.object({
  siteName: z.string().trim().min(2).max(100),
  siteTitle: z.string().trim().min(5).max(160),
  description: z.string().trim().min(20).max(300),
  logoUrl: httpsUrl,
  logoIconUrl: logoImageUrl,
  logoFirstText: z.string().trim().min(1).max(35),
  logoSecondText: z.string().trim().min(1).max(35),
  logoFirstColor: logoColor,
  logoSecondColor: logoColor,
  logoIconSize: z.number().int().min(24).max(100),
  metaPixelId: z.string().regex(/^$|^[0-9]{10,25}$/),
  pixelEnabled: z.boolean()
}).strict().refine(
  v => !v.pixelEnabled || Boolean(v.metaPixelId),
  {
    message: "Pixel ID required when enabled",
    path: ["metaPixelId"]
  }
);

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
    const config = await Settings.findOne({
      key: "default"
    }).lean();

    const safe = {
      ...defaults,
      ...(config ? {
        siteName: config.siteName,
        siteTitle: config.siteTitle,
        description: config.description,
        logoUrl: config.logoUrl,
        logoIconUrl: config.logoIconUrl ?? defaults.logoIconUrl,
        logoFirstText: config.logoFirstText ?? defaults.logoFirstText,
        logoSecondText: config.logoSecondText ?? defaults.logoSecondText,
        logoFirstColor: config.logoFirstColor ?? defaults.logoFirstColor,
        logoSecondColor: config.logoSecondColor ?? defaults.logoSecondColor,
        logoIconSize: config.logoIconSize ?? defaults.logoIconSize,
        metaPixelId: config.metaPixelId,
        pixelEnabled: config.pixelEnabled
      } : {})
    };

    res.json({ success: true, data: safe });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to load website settings"
    });
  }
});

router.put(
  "/",
  requireAdmin,
  requireRole("super_admin", "admin"),
  async (req, res) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid website settings",
        errors: z.flattenError(parsed.error)
      });
    }

    try {
      const config = await Settings.findOneAndUpdate(
        { key: "default" },
        { $set: parsed.data },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );

      res.json({
        success: true,
        data: {
          siteName: config.siteName,
          siteTitle: config.siteTitle,
          description: config.description,
          logoUrl: config.logoUrl,
          logoIconUrl: config.logoIconUrl ?? defaults.logoIconUrl,
          logoFirstText: config.logoFirstText ?? defaults.logoFirstText,
          logoSecondText: config.logoSecondText ?? defaults.logoSecondText,
          logoFirstColor: config.logoFirstColor ?? defaults.logoFirstColor,
          logoSecondColor: config.logoSecondColor ?? defaults.logoSecondColor,
          logoIconSize: config.logoIconSize ?? defaults.logoIconSize,
          metaPixelId: config.metaPixelId,
          pixelEnabled: config.pixelEnabled
        }
      });
    } catch {
      res.status(500).json({
        success: false,
        message: "Unable to save website settings"
      });
    }
  }
);

module.exports = router;
