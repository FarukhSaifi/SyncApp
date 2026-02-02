require("dotenv").config();
const { config } = require("../config");
const connectDB = require("./connection");
const Credential = require("../models/Credential");
const { DATABASE, PLATFORMS } = require("../constants");
const { createLogger } = require("../utils/logger");

const logger = createLogger("DB-SETUP");

async function setupDatabase() {
  try {
    logger.info("Setting up MongoDB database...");
    logger.info("Connecting to MongoDB", {
      mongoUri: config.mongoUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@"),
    });

    await connectDB();
    logger.info("MongoDB connection established");

    const existingMediumCredentials = await Credential.findOne({
      platform_name: PLATFORMS.MEDIUM,
    });
    const existingDevtoCredentials = await Credential.findOne({
      platform_name: PLATFORMS.DEVTO,
    });

    if (!existingMediumCredentials) {
      await Credential.create(DATABASE.DEFAULT_PLATFORM_CREDENTIALS.MEDIUM);
      logger.info("Default Medium credentials record created");
    } else {
      logger.info("Medium credentials already exist");
    }

    if (!existingDevtoCredentials) {
      await Credential.create(DATABASE.DEFAULT_PLATFORM_CREDENTIALS.DEVTO);
      logger.info("Default DEV.to credentials record created");
    } else {
      logger.info("DEV.to credentials already exist");
    }

    logger.info("Database setup completed successfully");
    logger.info("Update API keys in settings", {
      medium: DATABASE.SETUP_URLS.MEDIUM_SETTINGS,
      devto: DATABASE.SETUP_URLS.DEVTO_SETTINGS,
    });
  } catch (error) {
    logger.error("Database setup failed", error);

    if (error.message && error.message.includes("ECONNREFUSED")) {
      logger.info("MongoDB not running - start MongoDB or use Atlas", {
        atlas: DATABASE.SETUP_URLS.MONGODB_ATLAS,
      });
    }

    process.exit(1);
  } finally {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState === DATABASE.MONGOOSE_STATE.CONNECTED) {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
