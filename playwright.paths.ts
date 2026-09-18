import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));

/** Directory containing this package (override with SCREENCAST_DIR). */
export function screencastDir(): string {
  return process.env.SCREENCAST_DIR ?? packageRoot;
}

/** Host app root (dev server, e2e setup). Required for app-backed demo specs. */
export function screencastAppDir(): string {
  const dir = process.env.SCREENCAST_APP_DIR;
  if (!dir) {
    throw new Error(
      "Set SCREENCAST_APP_DIR to your web app root (package.json + dev server).",
    );
  }
  return dir;
}
