const mongoose = require("mongoose");
const Product = require("../products/product.model");
const Category = require("../categories/category.model");
const Banner = require("../banners/banner.model");
const Settings = require("../settings/website.model");
const { cleanupImage } = require("./imageCleanup");

module.exports = async function imageCleanupMiddleware(req, res, next) {
  const method = req.method;
  const path = req.path;

  let target = null;
  let id = null;

  if (method === "PATCH") {
    let match = path.match(/^\/api\/admin\/products\/([a-f0-9]{24})$/i);

    if (match) {
      target = "product";
      id = match[1];
    }

    match = path.match(/^\/api\/admin\/categories\/([a-f0-9]{24})$/i);

    if (match) {
      target = "category";
      id = match[1];
    }

    match = path.match(/^\/api\/banners\/admin\/([a-f0-9]{24})$/i);

    if (match) {
      target = "banner";
      id = match[1];
    }
  }

  if (
    method === "DELETE" &&
    /^\/api\/banners\/admin\/[a-f0-9]{24}\/permanent$/i.test(path)
  ) {
    target = "banner";
    id = path.split("/")[4];
  }

  if (
    method === "PUT" &&
    path === "/api/website-settings"
  ) {
    target = "settings";
  }

  if (!target || mongoose.connection.readyState !== 1) {
    return next();
  }

  try {
    let before = null;

    if (target === "product") {
      before = await Product.findById(id).select("images").lean();
    } else if (target === "category") {
      before = await Category.findById(id).select("image").lean();
    } else if (target === "banner") {
      before = await Banner.findById(id).select("image").lean();
    } else {
      before = await Settings.findOne({ key: "default" })
        .select("logoUrl logoIconUrl")
        .lean();
    }

    const urls = [
      ...(before?.images || []),
      before?.image,
      before?.logoUrl,
      before?.logoIconUrl
    ].filter(Boolean);

    res.once("finish", () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;

      // Cleanup runs only after the database operation succeeds.
      for (const url of new Set(urls)) {
        cleanupImage(url).catch(error => {
          console.error("[ImageKit cleanup]", error.message);
        });
      }
    });

    return next();
  } catch (error) {
    console.error("[ImageKit cleanup] Inspection failed:", error.message);
    // Never block normal dashboard functionality.
    return next();
  }
};
