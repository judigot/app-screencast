import { defineConfig, devices } from "@playwright/test";

import { evidenceVideoSize } from "./helpers/evidence-video-settings";
import { screencastDir, screencastResultsDir } from "./playwright.paths";

const evidenceDir = screencastDir();
const resultsDir = screencastResultsDir();
const { width, height } = evidenceVideoSize();

export default defineConfig({
  testDir: evidenceDir,
  testMatch: "video-demo-pointer-variants.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: [["list"]],
  outputDir: resultsDir,
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width, height },
    headless: true,
    trace: "off",
    video: "off",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
