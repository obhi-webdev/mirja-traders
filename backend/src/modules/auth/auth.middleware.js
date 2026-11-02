const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Admin = require("./admin.model");

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ")
      ? header.slice(7)
      : null;

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "mirja-traders"
    });

    if (!mongoose.isValidObjectId(decoded.sub)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication"
      });
    }

    const admin = await Admin.findById(decoded.sub);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Access denied"
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session"
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions"
      });
    }
    next();
  };
}

module.exports = { requireAdmin, requireRole };
