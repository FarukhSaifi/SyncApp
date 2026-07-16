#!/usr/bin/env node
/**
 * Replace all Vercel project env vars (non-sensitive):
 *   - Production + Preview <- server/.env.prod
 *   - Development          <- server/.env.dev
 *
 * Usage:
 *   cd server
 *   npm run env:sync
 *
 * Requires:
 *   npx vercel login
 *   server/.vercel/project.json linked to sync-app-server
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const sources = [
  {
    file: join(root, ".env.prod"),
    targets: ["production", "preview"],
    label: "server/.env.prod",
  },
  {
    file: join(root, ".env.dev"),
    targets: ["development"],
    label: "server/.env.dev",
  },
];

function parseEnvFile(path) {
  const env = {};

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key) env[key] = value;
  }

  return env;
}

function runVercel(args, options = {}) {
  const result = spawnSync("npx", ["vercel", ...args], {
    cwd: root,
    encoding: "utf8",
    ...options,
  });

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  return result.stdout || "";
}

function listCurrentEnvEntries() {
  const output = runVercel(["env", "ls", "--format", "json"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  const parsed = JSON.parse(output);
  const pairs = new Set();

  for (const env of parsed.envs || []) {
    if (!env.key) continue;
    const targets = Array.isArray(env.target) ? env.target : [env.target].filter(Boolean);
    for (const target of targets) {
      pairs.add(`${env.key}\u0000${target}`);
    }
  }

  return [...pairs].sort().map((pair) => {
    const [key, target] = pair.split("\u0000");
    return { key, target };
  });
}

function removeEnvKey(key, target) {
  console.log(`Removing ${key} (${target})`);
  const result = spawnSync("npx", ["vercel", "env", "rm", key, target, "--yes"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    const output = `${result.stdout || ""}${result.stderr || ""}`;
    if (output.includes("env_not_found") || output.includes("was not found")) {
      console.log(`Already removed: ${key} (${target})`);
      return;
    }
    process.stdout.write(output);
    process.exit(result.status ?? 1);
  }
}

function addEnvKey(key, value, target) {
  console.log(`Adding ${key} -> ${target} (non-sensitive)`);
  runVercel(["env", "add", key, target, "--force", "--yes", "--no-sensitive"], {
    input: `${value}\n`,
    stdio: ["pipe", "inherit", "inherit"],
  });
}

for (const source of sources) {
  if (!existsSync(source.file)) {
    console.error(`Missing ${source.file}`);
    process.exit(1);
  }
}

execFileSync("npx", ["vercel", "whoami"], { cwd: root, stdio: "ignore" });

for (const { key, target } of listCurrentEnvEntries()) {
  removeEnvKey(key, target);
}

for (const source of sources) {
  const env = parseEnvFile(source.file);
  const entries = Object.entries(env).filter(([, value]) => value !== "");
  const skipped = Object.keys(env).filter((key) => env[key] === "");

  console.log(`\nSyncing ${entries.length} non-empty keys from ${source.label} -> ${source.targets.join(",")}`);
  if (skipped.length) {
    console.log(`Skipping empty keys: ${skipped.join(", ")}`);
  }

  for (const [key, value] of entries) {
    for (const target of source.targets) {
      addEnvKey(key, value, target);
    }
  }
}

console.log("\nDone. Redeploy production so the new env is injected.");
