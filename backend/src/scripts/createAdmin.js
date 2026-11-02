require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const Admin = require("../modules/auth/admin.model");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function askPassword() {
  return new Promise(resolve => {
    const original = rl._writeToOutput;
    rl._writeToOutput = function (text) {
      if (text.includes("Password:")) {
        rl.output.write(text);
      } else if (rl.stdoutMuted) {
        if (text.includes("\n")) rl.output.write("\n");
      } else {
        original.call(rl, text);
      }
    };

    rl.stdoutMuted = true;
    rl.question("Password: ", password => {
      rl.stdoutMuted = false;
      rl._writeToOutput = original;
      resolve(password);
    });
  });
}

async function main() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI missing");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const existingSuperAdmin = await Admin.exists({
      role: "super_admin"
    });

    if (existingSuperAdmin) {
      console.log("Super Admin already exists.");
      return;
    }

    const name = (await ask("Admin Name: ")).trim();
    const email = (await ask("Admin Email: "))
      .trim()
      .toLowerCase();
    const password = await askPassword();

    if (
      !name ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 12 ||
      password.length > 128
    ) {
      throw new Error(
        "Valid name, email and 12-128 character password required"
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await Admin.create({
      name,
      email,
      passwordHash,
      role: "super_admin",
      isActive: true
    });

    console.log("\nSuper Admin created successfully.");
  } catch (error) {
    console.error("\nAdmin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

main();
