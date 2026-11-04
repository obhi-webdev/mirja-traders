require("dotenv").config();

const mongoose = require("mongoose");
const ImageAsset = require("../modules/media/imageAsset.model");
const { cleanupImage } = require("../modules/media/imageCleanup");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);

  const pending = await ImageAsset.find({
    status: "pending"
  }).select("url").lean();

  console.log("Pending cleanup:", pending.length);

  for (const asset of pending) {
    await cleanupImage(asset.url);
  }

  const remaining = await ImageAsset.countDocuments({
    status: "pending"
  });

  console.log("Remaining pending:", remaining);
}

main()
  .catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
