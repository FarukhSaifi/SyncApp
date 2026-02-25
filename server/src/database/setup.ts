import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from '../config';
import connectDB from './connection';
import Credential from '../models/Credential';
import { DATABASE, PLATFORMS } from '../constants';
import { DB_LOG } from '../constants/logging';
import { createLogger } from '../utils/logger';

const logger = createLogger('DB-SETUP');

async function setupDatabase(): Promise<void> {
  try {
    logger.info(DB_LOG.SETUP_START);
    logger.info(DB_LOG.CONNECTING, {
      mongoUri: (config.mongoUri as string).replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
    });

    await connectDB();
    logger.info(DB_LOG.CONNECTION_ESTABLISHED);

    const existingMediumCredentials = await Credential.findOne({
      platform_name: PLATFORMS.MEDIUM,
    });
    const existingDevtoCredentials = await Credential.findOne({
      platform_name: PLATFORMS.DEVTO,
    });

    if (!existingMediumCredentials) {
      await Credential.create(DATABASE.DEFAULT_PLATFORM_CREDENTIALS.MEDIUM);
      logger.info(DB_LOG.DEFAULT_MEDIUM_CREATED);
    } else {
      logger.info(DB_LOG.MEDIUM_EXISTS);
    }

    if (!existingDevtoCredentials) {
      await Credential.create(DATABASE.DEFAULT_PLATFORM_CREDENTIALS.DEVTO);
      logger.info(DB_LOG.DEFAULT_DEVTO_CREATED);
    } else {
      logger.info(DB_LOG.DEVTO_EXISTS);
    }

    logger.info(DB_LOG.SETUP_COMPLETED);
    logger.info(DB_LOG.SETUP_UPDATE_KEYS, {
      medium: DATABASE.SETUP_URLS.MEDIUM_SETTINGS,
      devto: DATABASE.SETUP_URLS.DEVTO_SETTINGS,
    });
  } catch (error) {
    logger.error(DB_LOG.SETUP_FAILED, error as Error);

    if ((error as Error).message && (error as Error).message.includes('ECONNREFUSED')) {
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
