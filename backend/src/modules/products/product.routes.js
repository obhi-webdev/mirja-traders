const router = require("express").Router();
const mongoose = require("mongoose");
const Product = require("./product.model");

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
    const page = Math.min(
      10000,
      Math.max(1, Number.parseInt(req.query.page, 10) || 1)
    );
    const limit = Math.min(
      48,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 12)
    );

    const filter = { status: "active" };

    if (req.query.search) {
      const search = String(req.query.search)
        .slice(0, 100)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.name = {
        $regex: search,
        $options: "i"
      };
    }

    if (req.query.category) {
      const slug = String(req.query.category);
      const Category = require("../categories/category.model");
      const category = await Category.findOne({
        slug,
        isActive: true
      });

      if (!category) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          page,
          pages: 0
        });
      }

      filter.category = category._id;
    }

    if (req.query.featured === "true") {
      filter.isFeatured = true;
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: products,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to load products"
    });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      status: "active"
    })
      .populate("category", "name slug")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to load product"
    });
  }
});

module.exports = router;
