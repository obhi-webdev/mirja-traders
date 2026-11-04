const mongoose = require("mongoose");
const ImageAsset = require("./imageAsset.model");
const Product = require("../products/product.model");
const Category = require("../categories/category.model");
const Banner = require("../banners/banner.model");
const Settings = require("../settings/website.model");

async function isReferenced(url) {
  const [product, category, banner, settings] = await Promise.all([
    Product.exists({ images: url }),
    Category.exists({ image: url }),
    Banner.exists({ image: url }),
    Settings.exists({
      $or: [{ logoUrl: url }, { logoIconUrl: url }]
    })
  ]);

  return Boolean(product || category || banner || settings);
}

async function cleanupImage(url) {
  if (!url || mongoose.connection.readyState !== 1) return;

  // Only files registered by our own upload system are eligible.
  const asset = await ImageAsset.findOne({ url });

  if (!asset || asset.status === "deleted") {
    if (!asset) {
      console.log("[ImageKit cleanup] Untracked image skipped");
    }
    return;
  }

  if (await isReferenced(url)) return;

  const locked = await ImageAsset.findOneAndUpdate(
    {
      _id: asset._id,
      status: { $in: ["stored", "pending"] }
    },
    {
      $set: { status: "deleting", lastError: "" }
    },
    { returnDocument: "after" }
  );

  if (!locked) return;

  try {
    // Verify again before permanent deletion.
    if (await isReferenced(url)) {
      await ImageAsset.updateOne(
        { _id: locked._id, status: "deleting" },
        { $set: { status: "stored" } }
      );
      return;
    }

    const { default: ImageKit } = await import("@imagekit/nodejs");

    const client = new ImageKit({
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      timeout: 30000,
      maxRetries: 1
    });

    const remote = await client.files.get(locked.fileId);

    if (
      !remote ||
      remote.url !== locked.url ||
      typeof remote.filePath !== "string" ||
      !remote.filePath.startsWith("/mirja-traders/")
    ) {
      throw new Error("ImageKit file identity verification failed");
    }

    await client.files.delete(locked.fileId);

    await ImageAsset.updateOne(
      { _id: locked._id },
      {
        $set: {
          status: "deleted",
          deletedAt: new Date(),
          lastError: ""
        }
      }
    );

    console.log("[ImageKit cleanup] Deleted:", locked.fileId);
  } catch (error) {
    await ImageAsset.updateOne(
      { _id: locked._id, status: "deleting" },
      {
        $set: {
          status: "pending",
          lastError: String(error.message || error).slice(0, 300)
        }
      }
    );

    console.error("[ImageKit cleanup] Pending:", error.message);
  }
}

module.exports = { cleanupImage };
