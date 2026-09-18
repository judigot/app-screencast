import type { Page } from "@playwright/test";
import type { TestInfo } from "@playwright/test";

import { installEvidenceCursor, resetEvidenceZoom } from "./evidence-cursor";

/** Re-mount fake pointer after segment actions (labels unchanged if already on page). */
async function refreshEvidenceCursor(page: import("@playwright/test").Page) {
  await installEvidenceCursor(page);
}

const videoSize = { width: 1280, height: 720 };

export async function recordEvidenceSegment(
  page: Page,
  testInfo: TestInfo,
  fileName: string,
  run: () => Promise<void>,
) {
  await installEvidenceCursor(page);
  await resetEvidenceZoom(page);
  const path = testInfo.outputPath(fileName);
  await page.screencast.start({ path, size: videoSize });
  await page.screencast.hideActions();
  await installEvidenceCursor(page);
  await run();
  await refreshEvidenceCursor(page);
  await resetEvidenceZoom(page);
  await page.waitForTimeout(500);
  await page.screencast.stop();
  return path;
}
