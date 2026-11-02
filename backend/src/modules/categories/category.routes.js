const router = require("express").Router();
const mongoose = require("mongoose");
const Category = require("./category.model");

router.get("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database unavailable"
      });
    }

    const categories = await Category.find({
      isActive: true
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to load categories"
    });
  }
});

module.exports = router;
