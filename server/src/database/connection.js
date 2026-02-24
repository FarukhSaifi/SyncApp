const mongoose = require("mongoose");
const { config } = require("../config");
const { DATABASE } = require("../constants");
const { DB_LOG } = require("../constants/logging");
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
      logger.info(DB_LOG.ALREADY_CONNECTED);
      return mongoose.connection;
    }

    const conn = await mongoose.connect(config.mongoUri, mongooseOptions);
    logger.info(DB_LOG.CONNECTED);
    return conn;
  } catch (error) {
    logger.error(DB_LOG.CONNECTION_ERROR, error);
    throw error;
  }
};

mongoose.connection.on("connected", () => {
  logger.info(DB_LOG.MONGOOSE_CONNECTED);
});

mongoose.connection.on("error", (err) => {
  logger.error(DB_LOG.MONGOOSE_CONNECTION_ERROR, err);
});

mongoose.connection.on("disconnected", () => {
  logger.warn(DB_LOG.MONGOOSE_DISCONNECTED);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info(DB_LOG.CONNECTION_CLOSED);
  process.exit(0);
});

module.exports = connectDB;
