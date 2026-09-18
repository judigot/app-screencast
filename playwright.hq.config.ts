import { defineConfig, devices } from "@playwright/test";

import { evidenceVideoSize } from "./helpers/evidence-video-settings";

import { screencastDir } from "./playwright.paths";

const evidenceDir = screencastDir();
const { width, height } = evidenceVideoSize();

export default defineConfig({
  testDir: evidenceDir,
  testMatch: "video-demo-hq-10s.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: [["list"]],
  outputDir: `${evidenceDir}/test-results`,
  use: {
    ...devices["Desktop Chrome"],
    locale: "en-US",
    viewport: { width, height },
    deviceScaleFactor: 1,
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
