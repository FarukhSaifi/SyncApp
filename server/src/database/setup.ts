import mongoose from "mongoose";
import { loadAppEnv } from "../config/loadEnv";

loadAppEnv();

import { config } from "../config";
import { DATABASE } from "../constants";
import { DB_LOG } from "../constants/logging";
import { createLogger } from "../utils/logger";
import connectDB from "./connection";

const logger = createLogger("DB-SETUP");

async function setupDatabase(): Promise<void> {
  try {
    logger.info(DB_LOG.SETUP_START);
    logger.info(DB_LOG.CONNECTING, {
      mongoUri: (config.mongoUri as string).replace(/\/\/[^:]+:[^@]+@/, "//***:***@"),
    });

    await connectDB();
    logger.info(DB_LOG.CONNECTION_ESTABLISHED);
    logger.info(DB_LOG.SETUP_COMPLETED);
    logger.info(DB_LOG.SETUP_UPDATE_KEYS, {
      medium: DATABASE.SETUP_URLS.MEDIUM_SETTINGS,
      devto: DATABASE.SETUP_URLS.DEVTO_SETTINGS,
    });
  } catch (error) {
    logger.error(DB_LOG.SETUP_FAILED, error as Error);

    if ((error as Error).message && (error as Error).message.includes("ECONNREFUSED")) {
      logger.info(DB_LOG.MONGODB_NOT_RUNNING, {
        atlas: DATABASE.SETUP_URLS.MONGODB_ATLAS,
      });
    }

    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === DATABASE.MONGOOSE_STATE.CONNECTED) {
      await mongoose.connection.close();
      logger.info(DB_LOG.CONNECTION_CLOSED_SETUP);
    }
  }
}

if (require.main === module) {
  setupDatabase();
}

export default setupDatabase;
