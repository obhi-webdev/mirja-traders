const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

const Product = require("../modules/products/product.model");
const Category = require("../modules/categories/category.model");

const products = [
  {
    name: "HP 15 Core i5 Laptop",
    slug: "demo-hp-15-core-i5-laptop",
    categoryName: "Laptop",
    brand: "HP",
    price: 58500,
    comparePrice: 62900,
    shortDescription: "A practical laptop for office, study and everyday productivity.",
    description: "Demo listing: HP 15 series laptop for students and professionals. Model configuration, availability and warranty must be verified before sale.",
    specifications: {
      Processor: "Intel Core i5 (demo configuration)",
      RAM: "8GB",
      Storage: "512GB SSD",
      Display: "15.6 inch"
    }
  },
  {
    name: "Lenovo IdeaPad Slim 3",
    slug: "demo-lenovo-ideapad-slim-3",
    categoryName: "Laptop",
    brand: "Lenovo",
    price: 52900,
    comparePrice: 56900,
    shortDescription: "Slim laptop concept for learning, office work and browsing.",
    description: "Demo listing: Lenovo IdeaPad Slim 3. Exact processor, generation, warranty and specifications require verification.",
    specifications: {
      Display: "15.6 inch (demo)",
      Storage: "SSD",
      Design: "Slim and portable",
      Usage: "Office and education"
    }
  },
  {
    name: "AMOLED Bluetooth Smart Watch",
    slug: "demo-amoled-bluetooth-smart-watch",
    categoryName: "Smart Watch",
    brand: "Generic",
    price: 2490,
    comparePrice: 3190,
    shortDescription: "Stylish smartwatch concept with Bluetooth calling.",
    description: "Demo smartwatch with example features including Bluetooth calling and activity tracking. Final specifications depend on the actual supplier model.",
    specifications: {
      Display: "AMOLED (demo)",
      Calling: "Bluetooth",
      Tracking: "Activity monitoring",
      Compatibility: "Verify with supplier"
    }
  },
  {
    name: "Sports Fitness Smart Watch",
    slug: "demo-sports-fitness-smart-watch",
    categoryName: "Smart Watch",
    brand: "Generic",
    price: 1890,
    comparePrice: 2390,
    shortDescription: "Everyday fitness watch concept with notifications.",
    description: "Demo listing for a sports smartwatch. Battery life, water resistance and health tracking specifications are not verified.",
    specifications: {
      Style: "Sports",
      Features: "Fitness tracking",
      Notifications: "Phone notifications",
      Battery: "Rechargeable"
    }
  },
  {
    name: "Apple iPhone 15 128GB",
    slug: "demo-apple-iphone-15-128gb",
    categoryName: "iPhone",
    brand: "Apple",
    price: 79900,
    comparePrice: 84900,
    shortDescription: "iPhone 15 product listing example.",
    description: "Demo listing for Apple iPhone 15 128GB. Price, condition, region, warranty and inventory must be confirmed before accepting orders.",
    specifications: {
      Storage: "128GB",
      Display: "Super Retina XDR",
      Camera: "Dual camera system",
      Model: "iPhone 15"
    }
  },
  {
    name: "Apple iPhone 14 128GB",
    slug: "demo-apple-iphone-14-128gb",
    categoryName: "iPhone",
    brand: "Apple",
    price: 64900,
    comparePrice: 69900,
    shortDescription: "iPhone 14 product listing example.",
    description: "Demo listing for Apple iPhone 14 128GB. Confirm device condition, variant, warranty and actual market price before sale.",
    specifications: {
      Storage: "128GB",
      Display: "Super Retina XDR",
      Camera: "Dual camera system",
      Model: "iPhone 14"
    }
  },
  {
    name: "RGB Gaming Soundbox",
    slug: "demo-rgb-gaming-soundbox",
    categoryName: "Soundbox",
    brand: "Generic",
    price: 1850,
    comparePrice: 2450,
    shortDescription: "RGB gaming speaker concept for desktop setups.",
    description: "Demo listing for a gaming soundbox with example RGB lighting and stereo sound features. Verify connectivity and power specifications.",
    specifications: {
      Lighting: "RGB",
      Audio: "Stereo",
      Usage: "Desktop gaming",
      Connectivity: "Supplier confirmation required"
    }
  },
  {
    name: "Portable Bluetooth Speaker",
    slug: "demo-portable-bluetooth-speaker",
    categoryName: "Soundbox",
    brand: "Generic",
    price: 2250,
    comparePrice: 2890,
    shortDescription: "Portable wireless speaker concept for everyday listening.",
    description: "Demo listing for a rechargeable Bluetooth speaker. Playback time, power rating and water resistance must be confirmed.",
    specifications: {
      Connection: "Bluetooth",
      Battery: "Rechargeable",
      Design: "Portable",
      Usage: "Music and everyday audio"
    }
  }
];

async function main() {
  const apply = process.argv.includes("--apply");

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI missing in backend/.env");
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  });

  console.log("\nConnected database:", mongoose.connection.name);
  console.log("Mode:", apply ? "WRITE" : "DRY RUN");
  console.log("Demo product count:", products.length);

  const categories = await Category.find({
    isActive: true
  }).select("name slug").lean();

  console.log("\nActive categories:");
  categories.forEach(c => console.log("-", c.name, c.slug));

  const prepared = [];

  for (const item of products) {
    const category = categories.find(c =>
      c.name.trim().toLowerCase() ===
      item.categoryName.toLowerCase() ||
      (item.categoryName === "Smart Watch" &&
       c.slug === "smart-wtach")
    );

    if (!category) {
      console.log("SKIP (category missing):", item.name);
      continue;
    }

    const existing = await Product.findOne({
      slug: item.slug
    }).select("_id").lean();

    if (existing) {
      console.log("SKIP (already exists):", item.name);
      continue;
    }

    prepared.push({
      name: item.name,
      slug: item.slug,
      sku: item.slug.toUpperCase().slice(0, 90),
      category: category._id,
      brand: item.brand,
      price: item.price,
      comparePrice: item.comparePrice,
      shortDescription: item.shortDescription,
      description: item.description,
      specifications: item.specifications,
      stock: 0,
      images: [],
      isFeatured: true,
      status: "draft",
      seo: {
        title: item.name + " | Mirja Traders",
        description: item.shortDescription
      }
    });

    console.log("READY:", item.name, "৳" + item.price);
  }

  console.log("\nReady to insert:", prepared.length);
  console.log("Stock: 0 | Status: draft | Images: pending");

  if (!apply) {
    console.log("\nDRY RUN COMPLETE. No data changed.");
    return;
  }

  const readline = require("readline/promises");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let answer;
  try {
    answer = await rl.question(
      `Type INSERT ${mongoose.connection.name} to confirm: `
    );
  } finally {
    rl.close();
  }

  if (answer !== `INSERT ${mongoose.connection.name}`) {
    console.log("Cancelled. No data inserted.");
    return;
  }

  let inserted = 0;

  for (const item of prepared) {
    const result = await Product.updateOne(
      { slug: item.slug },
      { $setOnInsert: item },
      { upsert: true, runValidators: true }
    );

    if (result.upsertedCount) inserted++;
  }

  console.log("\nSUCCESS. Products inserted:", inserted);
  console.log("All new products are DRAFT and stock is 0.");
}

main()
  .catch(error => {
    console.error("FAILED:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
