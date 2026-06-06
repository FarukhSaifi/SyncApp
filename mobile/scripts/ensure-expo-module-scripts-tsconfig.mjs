/**
 * expo-constants ships a tsconfig that extends expo-module-scripts (dev-only).
 * That package is not installed in app node_modules, which breaks the IDE when that file is opened.
 * This shim points the extend at Expo's public base config instead.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shimDir = path.join(root, "node_modules", "expo-module-scripts");
const shimPath = path.join(shimDir, "tsconfig.base.json");

const contents = `${JSON.stringify({ extends: "expo/tsconfig.base.json" }, null, 2)}\n`;

if (!fs.existsSync(shimPath) || fs.readFileSync(shimPath, "utf8") !== contents) {
  fs.mkdirSync(shimDir, { recursive: true });
  fs.writeFileSync(shimPath, contents);
}
