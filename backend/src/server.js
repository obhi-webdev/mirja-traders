require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

const PORT = Number(process.env.PORT) || 5001;

async function startServer() {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected");
    } else {
      console.log("MongoDB not configured yet");
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Mirja Traders API: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
  }
}

startServer();
