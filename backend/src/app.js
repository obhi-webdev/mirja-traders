const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
app.use(express.json({ limit: "1mb" }));
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300
}));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    project: "Mirja Traders",
    status: "Backend running"
  });
});


app.use("/api/products", require("./modules/products/product.routes"));
app.use("/api/categories", require("./modules/categories/category.routes"));

app.use("/api/auth", require("./modules/auth/auth.routes"));

app.use("/api/admin/products", require("./modules/products/product.admin.routes"));
app.use("/api/admin/categories", require("./modules/categories/category.admin.routes"));
app.use("/api/orders", require("./modules/orders/order.routes"));

app.use("/api/checkout", require("./modules/shipping/shipping.routes"));

app.use("/api/banners", require("./modules/banners/banner.routes"));

app.use("/api/website-settings", require("./modules/settings/website.routes"));


const path = require("path");

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin"
    );
    res.setHeader(
      "X-Content-Type-Options",
      "nosniff"
    );
    next();
  },
  express.static(
    path.resolve(
      process.env.UPLOAD_DIR ||
      path.join(__dirname, "../uploads")
    ),
    { index: false, dotfiles: "deny" }
  )
);

app.use(
  "/api/media",
  require("./modules/media/media.routes")
);


// MIRJA FULLSTACK STATIC HOSTING
const frontendDist = path.resolve(
  __dirname,
  "../public"
);

// Static React files.
app.use(express.static(frontendDist, {
  index: false,
  dotfiles: "deny",
  fallthrough: true
}));

// API requests must never receive React index.html.
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});

// React Router fallback for browser navigation and refresh.
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  if (
    req.path.startsWith("/api/") ||
    req.path === "/api" ||
    req.path.startsWith("/uploads/") ||
    req.path.startsWith("/assets/") ||
    req.path.includes(".")
  ) {
    return next();
  }

  if (!req.accepts("html")) {
    return next();
  }

  res.sendFile(
    path.join(frontendDist, "index.html"),
    error => {
      if (error && !res.headersSent) next(error);
    }
  );
});

module.exports = app;
