const mongoose = require("mongoose");
const { config } = require("../config");
const { DATABASE } = require("../constants");
const { createLogger } = require("../utils/logger");

const logger = createLogger("DB");

// Connection options for better serverless support
const mongooseOptions = {
  serverSelectionTimeoutMS: DATABASE.SERVER_SELECTION_TIMEOUT,
  socketTimeoutMS: DATABASE.SOCKET_TIMEOUT,
};

const connectDB = async () => {
  try {
    // Check if already connected (useful for serverless/function reuse)
    if (mongoose.connection.readyState === DATABASE.MONGOOSE_STATE.CONNECTED) {
      logger.info("MongoDB already connected");
      return mongoose.connection;
    }

    const conn = await mongoose.connect(config.mongoUri, mongooseOptions);
    logger.info("Connected to MongoDB database");
    return conn;
  } catch (error) {
    logger.error("MongoDB connection error", error);
    throw error;
  }
};

mongoose.connection.on("connected", () => {
  logger.info("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  logger.error("Mongoose connection error", err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongoose disconnected from MongoDB");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed through app termination");
  process.exit(0);
});

module.exports = connectDB;
