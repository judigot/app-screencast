import { test, expect } from "@playwright/test";

import {
  clickEvidence,
  installEvidenceCursorOnContext,
  resetEvidenceZoom,
  typeEvidence,
} from "./helpers/evidence-cursor";
import { evidenceRecordDurationMs, evidenceScreencastQuality, evidenceVideoSize } from "./helpers/evidence-video-settings";
import { installEvidenceOverlays, installWindowLabelOnContext } from "./helpers/window-label";

const LABEL = "Window A — youtube.com · cats";

async function dismissCookieBanner(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: /Accept all|I agree|Reject all/i }).first();
  if (await accept.isVisible({ timeout: 1500 }).catch(() => false)) {
    await clickEvidence(page, accept);
  }
}

test("HQ 10s — YouTube cats with pointer, zoom, caption", async ({ browser }, testInfo) => {
  test.setTimeout(120_000);
  const durationMs = evidenceRecordDurationMs();

  const context = await browser.newContext();
  await installWindowLabelOnContext(context, LABEL);
  await installEvidenceCursorOnContext(context);
  const page = await context.newPage();

  await resetEvidenceZoom(page);
  const path = testInfo.outputPath("hq-10s.webm");
  const size = evidenceVideoSize();
  const quality = evidenceScreencastQuality();

  await page.screencast.start({ path, size, quality });
  await page.screencast.hideActions();
  await installEvidenceOverlays(page, LABEL);

  const recordStarted = Date.now();

  await page.goto("https://www.youtube.com/", { waitUntil: "domcontentloaded" });
  await installEvidenceOverlays(page, LABEL);
  await dismissCookieBanner(page);

  const search = page.locator('input[name="search_query"], input#search').first();
  await expect(search).toBeVisible({ timeout: 20_000 });
  await typeEvidence(page, search, "cats");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/[?&]search_query=/, { timeout: 20_000 });
  await expect(page.locator("ytd-search ytd-video-renderer").first()).toBeVisible({ timeout: 20_000 });

  while (Date.now() - recordStarted < durationMs) {
    await page.waitForTimeout(200);
  }

  await resetEvidenceZoom(page);
  await page.screencast.stop();
  await context.close();

  await testInfo.attach("webm", { path, contentType: "video/webm" });
});
