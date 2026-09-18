import { test, expect } from "@playwright/test";

import {
  clickEvidence,
  installEvidenceCursorOnContext,
  resetEvidenceZoom,
  typeEvidence,
} from "./helpers/evidence-cursor";
import { evidenceRecordDurationMs, evidenceScreencastQuality } from "./helpers/evidence-video-settings";
import { installEvidenceOverlays, installWindowLabelOnContext } from "./helpers/window-label";

const LABEL_CATS = "Window A — cats";
const LABEL_DOGS = "Window B — dogs";

const PANEL = {
  width: Number(process.env.EVIDENCE_PANEL_WIDTH ?? "960"),
  height: Number(process.env.EVIDENCE_PANEL_HEIGHT ?? "1080"),
};

async function dismissCookieBanner(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: /Accept all|I agree|Reject all/i }).first();
  if (await accept.isVisible({ timeout: 1500 }).catch(() => false)) {
    await clickEvidence(page, accept);
  }
}

async function youtubeSearch(page: import("@playwright/test").Page, query: string, label: string) {
  await page.goto("https://www.youtube.com/", { waitUntil: "domcontentloaded" });
  await installEvidenceOverlays(page, label);
  await dismissCookieBanner(page);
  const search = page.locator('input[name="search_query"], input#search').first();
  await expect(search).toBeVisible({ timeout: 20_000 });
  await typeEvidence(page, search, query);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/[?&]search_query=/, { timeout: 20_000 });
  await expect(page.locator("ytd-search ytd-video-renderer").first()).toBeVisible({ timeout: 20_000 });
}

test("two contexts side by side — cats | dogs", async ({ browser }, testInfo) => {
  test.setTimeout(180_000);
  const durationMs = evidenceRecordDurationMs();
  const quality = evidenceScreencastQuality();
  const panelSize = { width: PANEL.width, height: PANEL.height };

  const catsContext = await browser.newContext({ viewport: panelSize });
  const dogsContext = await browser.newContext({ viewport: panelSize });

  await installWindowLabelOnContext(catsContext, LABEL_CATS);
  await installEvidenceCursorOnContext(catsContext);
  await installWindowLabelOnContext(dogsContext, LABEL_DOGS);
  await installEvidenceCursorOnContext(dogsContext);

  const catsPage = await catsContext.newPage();
  const dogsPage = await dogsContext.newPage();

  const leftPath = testInfo.outputPath("panel-cats.webm");
  const rightPath = testInfo.outputPath("panel-dogs.webm");

  await resetEvidenceZoom(catsPage);
  await resetEvidenceZoom(dogsPage);

  const recordStarted = Date.now();

  await Promise.all([
    catsPage.screencast.start({ path: leftPath, size: panelSize, quality }),
    dogsPage.screencast.start({ path: rightPath, size: panelSize, quality }),
  ]);
  await Promise.all([catsPage.screencast.hideActions(), dogsPage.screencast.hideActions()]);

  await Promise.all([
    youtubeSearch(catsPage, "cats", LABEL_CATS),
    youtubeSearch(dogsPage, "dogs", LABEL_DOGS),
  ]);

  const deadline = recordStarted + durationMs;
  while (Date.now() < deadline) {
    const remaining = deadline - Date.now();
    await Promise.all([
      catsPage.waitForTimeout(Math.min(200, remaining)),
      dogsPage.waitForTimeout(Math.min(200, remaining)),
    ]);
  }

  await Promise.all([
    resetEvidenceZoom(catsPage),
    resetEvidenceZoom(dogsPage),
    catsPage.screencast.stop(),
    dogsPage.screencast.stop(),
  ]);

  await catsContext.close();
  await dogsContext.close();

  await testInfo.attach("panel-paths", {
    body: `${leftPath}\n${rightPath}`,
    contentType: "text/plain",
  });
});
