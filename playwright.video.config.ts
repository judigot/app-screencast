import { defineConfig, devices } from "@playwright/test";

import { screencastAppDir, screencastDir } from "./playwright.paths";

const appDir = screencastAppDir();
const evidenceDir = screencastDir();
const port = process.env.PORT ?? "3001";
const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: evidenceDir,
  testMatch: process.env.EVIDENCE_VIDEO_SPEC ?? "video-demo.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  globalSetup: `${appDir}/e2e/setup/global.setup.ts`,
  outputDir: `${evidenceDir}/test-results`,
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    locale: "en-AE",
    timezoneId: "Asia/Dubai",
    viewport: { width: 1280, height: 720 },
    headless: true,
    trace: "off",
    // Screencast starts in the spec after /login is visible (avoids ~2s about:blank lead-in).
    video: "off",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: "pnpm dev",
    cwd: appDir,
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: port,
      TZ: "Asia/Dubai",
      NEXT_PUBLIC_APP_URL: baseURL,
      AUTH_COOKIE_SECURE: "false",
      ENABLE_WHATSAPP_OTP: "false",
      STORAGE_PROVIDER: "local",
      LOCAL_STORAGE_PATH: process.env.LOCAL_STORAGE_PATH ?? ".local-storage",
      WASHER_SIGNUP_API_KEY: process.env.E2E_WASHER_SIGNUP_API_KEY ?? "",
      CLEANER_SIGNUP_API_KEY: "",
      NEXT_PUBLIC_DATADOG_RUM_ENABLED: "false",
      NEXT_PUBLIC_DATADOG_APPLICATION_ID: "",
      NEXT_PUBLIC_DATADOG_CLIENT_TOKEN: "",
    },
  },
});
