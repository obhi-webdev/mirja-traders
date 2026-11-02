const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const { z } = require("zod");

const Admin = require("./admin.model");
const { requireAdmin } = require("./auth.middleware");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts"
  }
});

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256)
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid login input"
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database unavailable"
      });
    }

    const email = parsed.data.email.toLowerCase();

    const admin = await Admin.findOne({
      email,
      isActive: true
    }).select("+passwordHash");

    if (!admin || !(await bcrypt.compare(
      parsed.data.password,
      admin.passwordHash
    ))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(503).json({
        success: false,
        message: "Authentication not configured"
      });
    }

    const token = jwt.sign(
      { sub: admin.id },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        issuer: "mirja-traders",
        expiresIn: "8h"
      }
    );

    await Admin.updateOne(
      { _id: admin._id },
      { lastLogin: new Date() }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

router.get("/me", requireAdmin, (req, res) => {
  res.json({
    success: true,
    admin: {
      id: req.admin.id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role
    }
  });
});

module.exports = router;
