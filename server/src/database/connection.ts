import mongoose from 'mongoose';
import { config } from '../config';
import { DATABASE } from '../constants';
import { DB_LOG } from '../constants/logging';
import { createLogger } from '../utils/logger';

const logger = createLogger('DB');

const mongooseOptions: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: DATABASE.SERVER_SELECTION_TIMEOUT,
  socketTimeoutMS: DATABASE.SOCKET_TIMEOUT,
};

const connectDB = async (): Promise<mongoose.Connection | typeof mongoose> => {
  try {
    if (mongoose.connection.readyState === DATABASE.MONGOOSE_STATE.CONNECTED) {
      logger.info(DB_LOG.ALREADY_CONNECTED);
      return mongoose.connection;
    }

    const conn = await mongoose.connect(config.mongoUri as string, mongooseOptions);
    logger.info(DB_LOG.CONNECTED);
    return conn;
  } catch (error) {
    logger.error(DB_LOG.CONNECTION_ERROR, error as Error);
    throw error;
  }
};

mongoose.connection.on('connected', () => {
  logger.info(DB_LOG.MONGOOSE_CONNECTED);
});

mongoose.connection.on('error', (err: Error) => {
  logger.error(DB_LOG.MONGOOSE_CONNECTION_ERROR, err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn(DB_LOG.MONGOOSE_DISCONNECTED);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info(DB_LOG.CONNECTION_CLOSED);
  process.exit(0);
});

export default connectDB;
