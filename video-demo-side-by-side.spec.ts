import { expect, test, type Page } from "@playwright/test";

import {
  clickEvidence,
  installEvidenceCursorOnContext,
  resetEvidenceZoom,
  typeEvidence,
} from "./helpers/evidence-cursor";
import {
  evidenceRecordDurationMs,
  evidenceScreencastQuality,
} from "./helpers/evidence-video-settings";
import {
  installEvidenceOverlays,
  installWindowLabelOnContext,
} from "./helpers/window-label";

const LABEL_LEFT = "Window A — Example.com → IANA";
const LABEL_RIGHT = "Window B — Wikipedia · GitHub Actions";

const PANEL = {
  width: Number(process.env.EVIDENCE_PANEL_WIDTH ?? "960"),
  height: Number(process.env.EVIDENCE_PANEL_HEIGHT ?? "1080"),
};

async function exerciseExample(page: Page) {
  await page.goto("https://example.com/", { waitUntil: "domcontentloaded" });
  await installEvidenceOverlays(page, LABEL_LEFT);
  await expect(page.getByRole("heading", { name: "Example Domain" })).toBeVisible();

  const learnMore = page.locator("a[href]").first();
  await expect(learnMore).toBeVisible({ timeout: 10_000 });
  await clickEvidence(page, learnMore);
  await page.waitForURL(/iana\.org/, { timeout: 20_000 });
  await expect(page.locator("body")).toContainText(/Example Domains/i);

  await resetEvidenceZoom(page);
  await page.mouse.wheel(0, 520);
  await page.waitForTimeout(700);
  await page.mouse.wheel(0, -180);
  await page.waitForTimeout(400);
}

async function suppressWikipediaOverlays(page: Page) {
  await page.addStyleTag({
    content: `
      [id^="portalBanner_"],
      .banner-overlay,
      .overlay-banner-main {
        display: none !important;
        pointer-events: none !important;
      }
    `,
  });
  await page.evaluate(() => {
    document
      .querySelectorAll('[id^="portalBanner_"], .banner-overlay, .overlay-banner-main')
      .forEach((element) => element.remove());
  });
}

async function exerciseWikipedia(page: Page) {
  await page.goto("https://www.wikipedia.org/", { waitUntil: "domcontentloaded" });
  await installEvidenceOverlays(page, LABEL_RIGHT);
  await suppressWikipediaOverlays(page);

  const search = page.locator("#searchInput");
  await expect(search).toBeVisible({ timeout: 15_000 });
  await typeEvidence(page, search, "GitHub Actions", 65);
  await page.keyboard.press("Enter");

  await page.waitForURL(/wikipedia\.org\/(wiki|w\/index\.php)/, {
    timeout: 20_000,
  });
  await expect(page.locator("body")).toContainText(/GitHub/i);

  await resetEvidenceZoom(page);
  await page.mouse.wheel(0, 650);
  await page.waitForTimeout(700);
  await page.mouse.wheel(0, -220);
  await page.waitForTimeout(400);
}

test("public sites side by side", async ({ browser }, testInfo) => {
  test.setTimeout(90_000);
  const durationMs = evidenceRecordDurationMs();
  const quality = evidenceScreencastQuality();
  const panelSize = { width: PANEL.width, height: PANEL.height };

  const leftContext = await browser.newContext({ viewport: panelSize });
  const rightContext = await browser.newContext({ viewport: panelSize });

  await installWindowLabelOnContext(leftContext, LABEL_LEFT);
  await installEvidenceCursorOnContext(leftContext);
  await installWindowLabelOnContext(rightContext, LABEL_RIGHT);
  await installEvidenceCursorOnContext(rightContext);

  const leftPage = await leftContext.newPage();
  const rightPage = await rightContext.newPage();

  const leftPath = testInfo.outputPath("panel-left.webm");
  const rightPath = testInfo.outputPath("panel-right.webm");

  const recordStarted = Date.now();

  await Promise.all([
    leftPage.screencast.start({ path: leftPath, size: panelSize, quality }),
    rightPage.screencast.start({ path: rightPath, size: panelSize, quality }),
  ]);
  await Promise.all([
    leftPage.screencast.hideActions(),
    rightPage.screencast.hideActions(),
  ]);

  await Promise.all([exerciseExample(leftPage), exerciseWikipedia(rightPage)]);

  const deadline = recordStarted + durationMs;
  while (Date.now() < deadline) {
    const remaining = deadline - Date.now();
    await Promise.all([
      leftPage.waitForTimeout(Math.min(200, remaining)),
      rightPage.waitForTimeout(Math.min(200, remaining)),
    ]);
  }

  await Promise.all([
    resetEvidenceZoom(leftPage),
    resetEvidenceZoom(rightPage),
    leftPage.screencast.stop(),
    rightPage.screencast.stop(),
  ]);

  await leftContext.close();
  await rightContext.close();
});
