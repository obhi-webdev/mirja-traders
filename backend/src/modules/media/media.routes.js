const router = require("express").Router();
const multer = require("multer");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

const {
  requireAdmin,
  requireRole
} = require("../auth/auth.middleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  },
  fileFilter(req, file, cb) {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported image format"));
    }

    cb(null, true);
  }
});

function detectImage(buffer) {
  if (
    buffer.length >= 3 &&
    buffer.subarray(0, 3).equals(
      Buffer.from([255, 216, 255])
    )
  ) return ".jpg";

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([137,80,78,71,13,10,26,10])
    )
  ) return ".png";

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) return ".webp";

  return null;
}

router.post(
  "/image",
  requireAdmin,
  requireRole("super_admin", "admin"),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30
  }),
  (req, res, next) => {
    upload.single("image")(req, res, error => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Use JPG, PNG or WebP up to 5 MB"
        });
      }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image"
      });
    }

    const ext = detectImage(req.file.buffer);
    const types = {
      ".jpg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp"
    };

    if (!ext || types[ext] !== req.file.mimetype) {
      return res.status(400).json({
        success: false,
        message: "Invalid image content"
      });
    }

    try {
      const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

      if (!privateKey) {
        return res.status(503).json({
          success: false,
          message: "Image storage is not configured"
        });
      }

      // Dynamic import supports the ESM SDK in Express CommonJS.
      const { default: ImageKit, toFile } =
        await import("@imagekit/nodejs");

      const client = new ImageKit({
        privateKey,
        timeout: 30000,
        maxRetries: 1
      });

      const filename = crypto.randomUUID() + ext;

      const result = await client.files.upload({
        file: await toFile(
          req.file.buffer,
          filename,
          { type: req.file.mimetype }
        ),
        fileName: filename,
        folder: "/mirja-traders",
        useUniqueFileName: false,
        isPrivateFile: false
      });

      if (
        !result.url ||
        typeof result.url !== "string" ||
        !result.url.startsWith("https://")
      ) {
        return res.status(502).json({
          success: false,
          message: "ImageKit did not return a valid HTTPS URL"
        });
      }

      res.status(201).json({
        success: true,
        url: result.url,
        filename: result.name || filename,
        fileId: result.fileId || null,
        storage: "imagekit"
      });

    } catch (error) {
      console.error("ImageKit upload failure:", {
        type: error.name,
        status: error.status || null
      });

      res.status(502).json({
        success: false,
        message: "Cloud image upload failed. Check ImageKit configuration."
      });
    }
  }
);

module.exports = router;
