const mongoose = require("mongoose");
const { config } = require("../config");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
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
