const router = require("express").Router();
const mongoose = require("mongoose");
const { z } = require("zod");
const Category = require("./category.model");
const Product = require("../products/product.model");
const { requireAdmin, requireRole } = require("../auth/auth.middleware");

router.use(requireAdmin, requireRole("super_admin", "admin"));

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  image: z.string().url().max(2048).or(z.literal("")).optional(),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).optional(),
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
    const categories = await Category.find()
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.json({ success: true, data: categories });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to load categories"
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid category data"
      });
    }

    const category = await Category.create(parsed.data);

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: error.code === 11000
        ? "Category slug already exists"
        : "Unable to create category"
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    const parsed = schema.partial().safeParse(req.body);
    if (!parsed.success || !Object.keys(req.body || {}).length) {
      return res.status(400).json({
        success: false,
        message: "Invalid update data"
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: parsed.data },
      { returnDocument: "after", runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: "Unable to update category"
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }

    const usedByProduct = await Product.exists({
      category: req.params.id
    });

    const usedByChild = await Category.exists({
      parent: req.params.id
    });

    if (usedByProduct || usedByChild) {
      return res.status(409).json({
        success: false,
        message: "Category is in use"
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { returnDocument: "after" }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    res.json({
      success: true,
      message: "Category deactivated"
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to deactivate category"
    });
  }
});

module.exports = router;
