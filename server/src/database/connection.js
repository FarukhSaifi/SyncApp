const mongoose = require("mongoose");
const { config } = require("../config");
const { DATABASE } = require("../constants");

// Connection options for better serverless support
const mongooseOptions = {
  serverSelectionTimeoutMS: DATABASE.SERVER_SELECTION_TIMEOUT,
  socketTimeoutMS: DATABASE.SOCKET_TIMEOUT,
};

const connectDB = async () => {
  try {
    // Check if already connected (useful for serverless/function reuse)
    if (mongoose.connection.readyState === DATABASE.MONGOOSE_STATE.CONNECTED) {
      console.log("✅ MongoDB already connected");
      return mongoose.connection;
    }

    // Connect to MongoDB
    const conn = await mongoose.connect(config.mongoUri, mongooseOptions);
    console.log("✅ Connected to MongoDB database");
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("✅ Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ Mongoose disconnected from MongoDB");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed through app termination");
  process.exit(0);
});

module.exports = connectDB;
