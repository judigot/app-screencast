import { defineConfig, devices } from "@playwright/test";

import { evidenceVideoSize } from "./helpers/evidence-video-settings";

import { screencastDir } from "./playwright.paths";

const evidenceDir = screencastDir();
const { width, height } = evidenceVideoSize();

export default defineConfig({
  testDir: evidenceDir,
  testMatch: "video-demo-pointer.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  outputDir: `${evidenceDir}/test-results`,
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width, height },
    headless: true,
    trace: "off",
    video: "off",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
