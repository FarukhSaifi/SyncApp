import { config } from "@config";
import connectDB from "@database/connection";
import type { MongooseCache } from "@types";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

import { MEMORY_MONGO_LAUNCH_TIMEOUT_MS } from "./testInfra";

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let mongod: MongoMemoryReplSet | null = null;
let mongoLifecycle: Promise<void> = Promise.resolve();

function enqueueMongoLifecycle<T>(fn: () => Promise<T>): Promise<T> {
  const run = mongoLifecycle.then(fn, fn);
  mongoLifecycle = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Start in-memory Mongo (replica set for transactions) and point `config.mongoUri` at it. */
export async function startMemoryMongo(): Promise<void> {
  return enqueueMongoLifecycle(async () => {
    if (mongod) {
      await stopMemoryMongoInternal();
    }
    mongod = await MongoMemoryReplSet.create({
      replSet: { count: 1 },
      instanceOpts: [{ launchTimeout: MEMORY_MONGO_LAUNCH_TIMEOUT_MS }],
    });
    await mongod.waitUntilRunning();
    config.mongoUri = mongod.getUri();
    global.mongooseCache = { conn: null, promise: null };
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await connectDB();
  });
}

async function stopMemoryMongoInternal(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  global.mongooseCache = { conn: null, promise: null };
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

export async function stopMemoryMongo(): Promise<void> {
  return enqueueMongoLifecycle(stopMemoryMongoInternal);
}

export async function clearMemoryMongo(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
