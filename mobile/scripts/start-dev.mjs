#!/usr/bin/env node
/**
 * Start Expo without interactive port prompts (Turbo/CI have no TTY).
 * Uses EXPO_PORT (default 8081), or the next free port if that one is busy.
 */
import { spawn } from "node:child_process";
import net from "node:net";

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function resolvePort(preferred) {
  for (let port = preferred; port < preferred + 20; port += 1) {
    if (await canListen(port)) {
      return port;
    }
  }
  return preferred;
}

const preferred = Number(process.env.EXPO_PORT || 8081);
const port = await resolvePort(Number.isFinite(preferred) ? preferred : 8081);

if (port !== preferred) {
  console.warn(`[mobile] Port ${preferred} is busy; starting Expo on ${port}`);
}

const child = spawn("npx", ["expo", "start", "--port", String(port)], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
