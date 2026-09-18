import { test, expect } from "@playwright/test";

import {
  clickEvidence,
  installEvidenceCursor,
  installEvidenceCursorOnContext,
  resetEvidenceZoom,
  typeEvidence,
} from "./helpers/evidence-cursor";
import { recordEvidenceSegment } from "./helpers/evidence-screencast";
import {
  EVIDENCE_LABEL_SHOW_MS,
  flashWindowLabel,
  installEvidenceOverlays,
  installWindowLabelOnContext,
} from "./helpers/window-label";

const LABEL_CATS = "Window A — youtube.com · cats";
const LABEL_DOGS = "Window B — youtube.com · dogs";

async function dismissCookieBanner(page: import("@playwright/test").Page) {
  const candidates = [
    page.getByRole("button", { name: /Accept all/i }),
    page.getByRole("button", { name: /I agree/i }),
    page.getByRole("button", { name: /Reject all/i }),
    page.locator("button").filter({ hasText: /Accept all|I agree|Reject all/ }),
  ];
  for (const locator of candidates) {
    const first = locator.first();
    if (await first.isVisible({ timeout: 1500 }).catch(() => false)) {
      await clickEvidence(page, first);
      await page.waitForTimeout(400);
      return;
    }
  }
}

async function youtubeSearch(page: import("@playwright/test").Page, query: string, label: string) {
  await page.goto("https://www.youtube.com/", { waitUntil: "domcontentloaded" });
  await installEvidenceOverlays(page, label);
  await dismissCookieBanner(page);
  const search = page.locator('input[name="search_query"], input#search').first();
  await expect(search).toBeVisible({ timeout: 20_000 });
  await clickEvidence(page, search);
  await typeEvidence(page, search, query);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/[?&]search_query=/, { timeout: 20_000 });
  await expect(page.locator("ytd-search ytd-video-renderer").first()).toBeVisible({ timeout: 20_000 });
}

async function assertYoutubeSearchRetained(
  page: import("@playwright/test").Page,
  query: string,
  label: string,
) {
  await flashWindowLabel(page, label);
  await installEvidenceCursor(page);
  await page.waitForTimeout(EVIDENCE_LABEL_SHOW_MS + 200);
  await expect(page).toHaveURL(new RegExp(`search_query=${query}`, "i"));
  const search = page.locator('input[name="search_query"], input#search').first();
  await expect(search).toHaveValue(query);
  await expect(page.locator("ytd-search ytd-video-renderer").first()).toBeVisible();
  await resetEvidenceZoom(page);
  await page.mouse.wheel(0, 280);
  await page.waitForTimeout(700);
  await page.mouse.wheel(0, -140);
  await page.waitForTimeout(500);
}

test("two YouTube contexts — cats / dogs, switch 3×", async ({ browser }, testInfo) => {
  test.setTimeout(300_000);

  const catsContext = await browser.newContext();
  const dogsContext = await browser.newContext();
  await installWindowLabelOnContext(catsContext, LABEL_CATS);
  await installEvidenceCursorOnContext(catsContext);
  await installWindowLabelOnContext(dogsContext, LABEL_DOGS);
  await installEvidenceCursorOnContext(dogsContext);

  const catsPage = await catsContext.newPage();
  const dogsPage = await dogsContext.newPage();

  const segments: string[] = [];

  // Window A: cats
  segments.push(
    await recordEvidenceSegment(catsPage, testInfo, "01-youtube-cats.webm", async () => {
      await youtubeSearch(catsPage, "cats", LABEL_CATS);
    }),
  );

  // Switch 1 → Window B: dogs
  segments.push(
    await recordEvidenceSegment(dogsPage, testInfo, "02-youtube-dogs.webm", async () => {
      await youtubeSearch(dogsPage, "dogs", LABEL_DOGS);
    }),
  );

  // Switch 2 → Window A: cats still loaded (no new navigation)
  segments.push(
    await recordEvidenceSegment(catsPage, testInfo, "03-youtube-cats-retained.webm", async () => {
      await assertYoutubeSearchRetained(catsPage, "cats", LABEL_CATS);
    }),
  );

  // Switch 3 → Window B: dogs still loaded
  segments.push(
    await recordEvidenceSegment(dogsPage, testInfo, "04-youtube-dogs-retained.webm", async () => {
      await assertYoutubeSearchRetained(dogsPage, "dogs", LABEL_DOGS);
    }),
  );

  await catsContext.close();
  await dogsContext.close();

  await testInfo.attach("segment-paths", {
    body: segments.join("\n"),
    contentType: "text/plain",
  });
});
