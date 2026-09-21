import { defineConfig, devices } from "@playwright/test";

import { screencastDir, screencastResultsDir } from "./playwright.paths";

const evidenceDir = screencastDir();
const resultsDir = screencastResultsDir();

export default defineConfig({
  testDir: evidenceDir,
  testMatch: "video-demo-multi-window.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 300_000,
  expect: { timeout: 30_000 },
  reporter: [["list"]],
  outputDir: resultsDir,
  use: {
    ...devices["Desktop Chrome"],
    locale: "en-US",
    viewport: { width: 1280, height: 720 },
    headless: true,
    trace: "off",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: {
          args: ["--disable-blink-features=AutomationControlled"],
        },
        ignoreDefaultArgs: ["--enable-automation"],
      },
    },
  ],
});
