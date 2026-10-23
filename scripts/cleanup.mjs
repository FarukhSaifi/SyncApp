#!/usr/bin/env node

/**
 * SyncApp monorepo cleanup — remove caches and build artifacts.
 *
 * Usage (from repo root):
 *   npm run clean              # caches + build outputs
 *   npm run clean:deps         # above + node_modules
 *   npm run clean:native       # above + Expo / native build folders
 *   npm run clean:all          # caches + builds + deps + native
 *   node scripts/cleanup.mjs --dry-run
 */

import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

/** Paths relative to repo root. */
const CLEANUP_TARGETS = Object.freeze({
  /** Safe default — caches + compiled output (keeps node_modules). */
  ALWAYS: Object.freeze([
    ".turbo",
    "client/.turbo",
    "server/.turbo",
    "mobile/.turbo",
    "client/.next",
    "server/dist",
    "mobile/dist",
    "mobile/web-build",
    ".eslintcache",
    "client/.eslintcache",
    "server/.eslintcache",
  ]),
  /** Dependency trees — requires `npm install` afterward. */
  DEPS: Object.freeze(["node_modules", "client/node_modules", "server/node_modules", "mobile/node_modules"]),
  /** Expo / React Native generated native artifacts. */
  NATIVE: Object.freeze([
    "mobile/.expo",
    "mobile/ios/build",
    "mobile/ios/Pods",
    "mobile/ios/Podfile.lock",
    "mobile/android/build",
    "mobile/android/app/build",
    "mobile/android/.gradle",
    "mobile/android/.cxx",
  ]),
});

/** Filename patterns removed when found under workspace roots (not node_modules). */
const CLEANUP_GLOBS = Object.freeze({
  EXTENSIONS: Object.freeze([".tsbuildinfo"]),
  NAMES: Object.freeze([".DS_Store"]),
  /** Single root walk — skip heavy / already-handled directories. */
  SCAN_ROOTS: Object.freeze(["."]),
  SKIP_DIR_NAMES: Object.freeze(
    new Set([
      "node_modules",
      ".git",
      ".next",
      "dist",
      ".expo",
      "ios",
      "android",
      ".turbo",
      ".cursor",
      ".vercel",
      "coverage",
    ]),
  ),
});

const FLAGS = Object.freeze({
  DRY_RUN: "--dry-run",
  DEPS: "--deps",
  NATIVE: "--native",
  ALL: "--all",
  HELP: "--help",
});

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  const flags = new Set(argv);
  if (flags.has(FLAGS.HELP)) {
    return { help: true, dryRun: false, deps: false, native: false };
  }
  const all = flags.has(FLAGS.ALL);
  return {
    help: false,
    dryRun: flags.has(FLAGS.DRY_RUN),
    deps: all || flags.has(FLAGS.DEPS),
    native: all || flags.has(FLAGS.NATIVE),
  };
}

function printHelp() {
  console.log(`SyncApp cleanup

Usage:
  node scripts/cleanup.mjs [options]

Options:
  ${FLAGS.DRY_RUN}   Print paths that would be removed
  ${FLAGS.DEPS}      Also remove node_modules (root + workspaces)
  ${FLAGS.NATIVE}    Also remove Expo / iOS / Android build folders
  ${FLAGS.ALL}       Equivalent to ${FLAGS.DEPS} ${FLAGS.NATIVE}
  ${FLAGS.HELP}      Show this help

npm scripts:
  npm run clean
  npm run clean:deps
  npm run clean:native
  npm run clean:all
`);
}

/**
 * @param {string} absPath
 * @param {boolean} dryRun
 * @returns {boolean} whether something was removed (or would be)
 */
function removePath(absPath, dryRun) {
  if (!existsSync(absPath)) {
    return false;
  }
  const rel = relative(ROOT, absPath) || ".";
  if (dryRun) {
    console.log(`  [dry-run] ${rel}`);
    return true;
  }
  try {
    rmSync(absPath, { recursive: true, force: true });
    console.log(`  removed  ${rel}`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`  failed   ${rel}: ${message}`);
    return false;
  }
}

/**
 * Walk workspace trees for leftover cache files (skips heavy dirs).
 * @param {string} dirAbs
 * @param {(fileAbs: string) => void} onFile
 */
function walkForLooseFiles(dirAbs, onFile) {
  if (!existsSync(dirAbs)) {
    return;
  }
  let entries;
  try {
    entries = readdirSync(dirAbs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const childAbs = join(dirAbs, entry.name);
    if (entry.isDirectory()) {
      if (CLEANUP_GLOBS.SKIP_DIR_NAMES.has(entry.name)) {
        continue;
      }
      walkForLooseFiles(childAbs, onFile);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const matchExt = CLEANUP_GLOBS.EXTENSIONS.some((ext) => entry.name.endsWith(ext));
    const matchName = CLEANUP_GLOBS.NAMES.includes(entry.name);
    if (matchExt || matchName) {
      onFile(childAbs);
    }
  }
}

/**
 * @param {{ dryRun: boolean; deps: boolean; native: boolean }} options
 */
function runCleanup(options) {
  const { dryRun, deps, native } = options;
  const targets = [...CLEANUP_TARGETS.ALWAYS];
  if (deps) {
    targets.push(...CLEANUP_TARGETS.DEPS);
  }
  if (native) {
    targets.push(...CLEANUP_TARGETS.NATIVE);
  }

  console.log(dryRun ? "Cleanup (dry-run):" : "Cleanup:");
  let count = 0;

  for (const rel of targets) {
    if (removePath(join(ROOT, rel), dryRun)) {
      count += 1;
    }
  }

  for (const scanRel of CLEANUP_GLOBS.SCAN_ROOTS) {
    const scanAbs = join(ROOT, scanRel);
    if (!existsSync(scanAbs) || !statSync(scanAbs).isDirectory()) {
      continue;
    }
    walkForLooseFiles(scanAbs, (fileAbs) => {
      if (removePath(fileAbs, dryRun)) {
        count += 1;
      }
    });
  }

  if (count === 0) {
    console.log("  (nothing to remove)");
  } else {
    console.log(`\nDone — ${count} path${count === 1 ? "" : "s"}${dryRun ? " would be removed" : " removed"}.`);
  }

  if (deps && !dryRun) {
    console.log("\nNext: npm install");
  }
  if (native && !dryRun) {
    console.log("Native folders cleaned — regenerate iOS/Android with expo prebuild / run:* as needed.");
  }
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}

runCleanup(options);
