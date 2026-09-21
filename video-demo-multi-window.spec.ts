import { expect, test, type Page } from "@playwright/test";

import {
  installEvidenceCursor,
  installEvidenceCursorOnContext,
  resetEvidenceZoom,
  typeEvidence,
} from "./helpers/evidence-cursor";
import { recordEvidenceSegment } from "./helpers/evidence-screencast";
import {
  flashWindowLabel,
  installEvidenceOverlays,
  installWindowLabelOnContext,
} from "./helpers/window-label";

const LABEL_LEFT = "Window A — IANA Example Domains";
const LABEL_RIGHT = "Window B — Wikipedia · Playwright";

async function loadExample(page: Page) {
  await page.goto("https://example.com/", { waitUntil: "domcontentloaded" });
  await installEvidenceOverlays(page, LABEL_LEFT);
  await expect(page.getByRole("heading", { name: "Example Domain" })).toBeVisible();

  await page.getByRole("link", { name: /More information/i }).click();
  await page.waitForURL(/iana\.org/, { timeout: 20_000 });
  await expect(page.locator("body")).toContainText(/Example Domains/i);
}

async function loadWikipedia(page: Page) {
  await page.goto("https://www.wikipedia.org/", { waitUntil: "domcontentloaded" });
  await installEvidenceOverlays(page, LABEL_RIGHT);

  const search = page.locator("#searchInput");
  await expect(search).toBeVisible({ timeout: 15_000 });
  await typeEvidence(page, search, "Playwright software", 65);
  await page.keyboard.press("Enter");

  await page.waitForURL(/wikipedia\.org\/(wiki|w\/index\.php)/, {
    timeout: 20_000,
  });
  await expect(page.locator("body")).toContainText(/Playwright/i);
}

async function revisitExample(page: Page) {
  await flashWindowLabel(page, LABEL_LEFT);
  await installEvidenceCursor(page);
  await expect(page).toHaveURL(/iana\.org/);
  await resetEvidenceZoom(page);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(800);
  await page.mouse.wheel(0, -220);
  await page.waitForTimeout(450);
}

async function revisitWikipedia(page: Page) {
  await flashWindowLabel(page, LABEL_RIGHT);
  await installEvidenceCursor(page);
  await expect(page).toHaveURL(/wikipedia\.org\//);
  await resetEvidenceZoom(page);
  await page.mouse.wheel(0, 650);
  await page.waitForTimeout(800);
  await page.mouse.wheel(0, -220);
  await page.waitForTimeout(450);
}

test("public sites multi-window switching", async ({ browser }, testInfo) => {
  test.setTimeout(240_000);

  const leftContext = await browser.newContext();
  const rightContext = await browser.newContext();

  await installWindowLabelOnContext(leftContext, LABEL_LEFT);
  await installEvidenceCursorOnContext(leftContext);
  await installWindowLabelOnContext(rightContext, LABEL_RIGHT);
  await installEvidenceCursorOnContext(rightContext);

  const leftPage = await leftContext.newPage();
  const rightPage = await rightContext.newPage();

  await recordEvidenceSegment(
    leftPage,
    testInfo,
    "01-example.webm",
    async () => {
      await loadExample(leftPage);
    },
  );

  await recordEvidenceSegment(
    rightPage,
    testInfo,
    "02-wikipedia.webm",
    async () => {
      await loadWikipedia(rightPage);
    },
  );

  await recordEvidenceSegment(
    leftPage,
    testInfo,
    "03-example-retained.webm",
    async () => {
      await revisitExample(leftPage);
    },
  );

  await recordEvidenceSegment(
    rightPage,
    testInfo,
    "04-wikipedia-retained.webm",
    async () => {
      await revisitWikipedia(rightPage);
    },
  );

  await leftContext.close();
  await rightContext.close();
});
