import { defineConfig, devices } from "@playwright/test";

import { screencastAppDir, screencastDir, screencastResultsDir } from "./playwright.paths";

const appDir = screencastAppDir();
const evidenceDir = screencastDir();
const resultsDir = screencastResultsDir();
const port = process.env.PORT ?? "3001";
const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: evidenceDir,
  testMatch: "capture.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: resultsDir,
  use: {
    ...devices["Pixel 5"],
    baseURL,
    locale: "en-AE",
    timezoneId: "Asia/Dubai",
    viewport: { width: 390, height: 844 },
    trace: "off"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Pixel 5"], browserName: "chromium" }
    }
  ],
  webServer: {
    command: "pnpm dev",
    cwd: appDir,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV ?? "test",
      PORT: port,
      TZ: "Asia/Dubai",
      NEXT_PUBLIC_APP_URL: baseURL,
      AUTH_COOKIE_SECURE: "false",
      ENABLE_WHATSAPP_OTP: "false",
      STORAGE_PROVIDER: process.env.STORAGE_PROVIDER ?? "disabled"
    }
  }
});
