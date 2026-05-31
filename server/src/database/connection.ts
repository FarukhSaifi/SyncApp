import mongoose from "mongoose";

import { config } from "../config";
import { DATABASE } from "../constants";
import { DB_LOG } from "../constants/logging";
import { createLogger } from "../utils/logger";

const logger = createLogger("DB");

const isServerless = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

const mongooseOptions: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: isServerless ? 10000 : DATABASE.SERVER_SELECTION_TIMEOUT,
  socketTimeoutMS: DATABASE.SOCKET_TIMEOUT,
  maxPoolSize: isServerless ? 5 : 10,
  minPoolSize: isServerless ? 0 : 1,
  maxIdleTimeMS: isServerless ? 10000 : 30000,
  // Vercel serverless often fails Atlas SRV lookups over IPv6; force IPv4.
  ...(isServerless ? { family: 4 } : {}),
};

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

let listenersAttached = false;

function attachConnectionListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on("connected", () => {
    logger.info(DB_LOG.MONGOOSE_CONNECTED);
  });

  mongoose.connection.on("error", (err: Error) => {
    logger.error(DB_LOG.MONGOOSE_CONNECTION_ERROR, err);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn(DB_LOG.MONGOOSE_DISCONNECTED);
    cached.conn = null;
    cached.promise = null;
  });
}

/**
 * Connect to MongoDB with a cached promise (safe for Vercel serverless warm starts).
 * Retries on failure by clearing the cached promise.
 */
const connectDB = async (): Promise<typeof mongoose> => {
  attachConnectionListeners();

  if (mongoose.connection.readyState === DATABASE.MONGOOSE_STATE.CONNECTED) {
    return mongoose;
  }

  if (!cached.promise) {
    logger.info("Connecting to MongoDB", {
      isServerless,
      hasUri: Boolean(config.mongoUri),
    });

    cached.promise = mongoose
      .connect(config.mongoUri as string, mongooseOptions)
      .then((conn) => {
        cached.conn = conn;
        logger.info(DB_LOG.CONNECTED);
        return conn;
      })
      .catch((error) => {
        cached.promise = null;
        cached.conn = null;
        logger.error(DB_LOG.CONNECTION_ERROR, error as Error);
        throw error;
      });
  }

  return cached.promise;
};

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === DATABASE.MONGOOSE_STATE.CONNECTED;
}

export function getDbConnectionMeta(): { host: string; name: string } {
  return {
    host: mongoose.connection.host || "",
    name: mongoose.connection.name || "",
  };
}

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info(DB_LOG.CONNECTION_CLOSED);
  process.exit(0);
});

export default connectDB;
