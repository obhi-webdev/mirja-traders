const router = require("express").Router();
const mongoose = require("mongoose");
const { z } = require("zod");
const Product = require("./product.model");
const Category = require("../categories/category.model");
const { requireAdmin, requireRole } = require("../auth/auth.middleware");

router.use(requireAdmin);
router.use(requireRole("super_admin", "admin"));

const slug = z.string().trim().min(2).max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const schema = z.object({
  name: z.string().trim().min(2).max(200),
  slug,
  sku: z.string().trim().max(100).optional(),
  description: z.string().max(20000).optional(),
  shortDescription: z.string().max(1000).optional(),
  category: z.string().optional(),
  price: z.number().finite().nonnegative(),
  comparePrice: z.number().finite().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  images: z.array(z.string().url().max(2048)).max(15).optional(),
  brand: z.string().trim().max(150).optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  seo: z.object({
    title: z.string().max(200).optional(),
    description: z.string().max(500).optional()
  }).strict().optional()
}).strict();

function databaseReady(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database unavailable"
    });
  }
  next();
}

router.use(databaseReady);

async function validateCategory(categoryId) {
  if (!categoryId) return true;
  if (!mongoose.isValidObjectId(categoryId)) return false;
  return Boolean(await Category.exists({
    _id: categoryId,
    isActive: true
  }));
}

router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: products });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to load products"
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid product data",
        errors: z.flattenError(parsed.error)
      });
    }

    if (!(await validateCategory(parsed.data.category))) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }

    const product = await Product.create(parsed.data);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: error.code === 11000
        ? "Product slug already exists"
        : "Unable to create product"
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const parsed = schema.partial().safeParse(req.body);

    if (!parsed.success || !Object.keys(req.body || {}).length) {
      return res.status(400).json({
        success: false,
        message: "Invalid update data"
      });
    }

    if (!(await validateCategory(parsed.data.category))) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.data },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: error.code === 11000
        ? "Product slug already exists"
        : "Unable to update product"
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "archived" } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      message: "Product archived"
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to archive product"
    });
  }
});

module.exports = router;
