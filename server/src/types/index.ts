/**
 * Central barrel for all SyncApp server types and interfaces.
 * Modular domain types are located in their respective files.
 */

export * from "./ai";
export * from "./auth";
export * from "./common";
export * from "./config";
export * from "./credentials";
export * from "./errors";
export * from "./posts";
export * from "./publish";
export * from "./storage";
export * from "./users";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}
