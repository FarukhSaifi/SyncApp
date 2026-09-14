/**
 * Central barrel for all SyncApp server types and interfaces.
 * Modular domain types are located in their respective files.
 */

export * from "./ai";
export * from "./storage";
export * from "./auth";
export * from "./posts";
export * from "./users";
export * from "./credentials";
export * from "./publish";
export * from "./config";
export * from "./errors";
export * from "./common";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
