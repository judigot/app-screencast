import { test, expect } from "@playwright/test";

import {
  clickEvidence,
  installEvidenceCursor,
  installEvidenceCursorOnContext,
  typeEvidence,
} from "./helpers/evidence-cursor";
import { evidenceRecordDurationMs, evidenceScreencastQuality, evidenceVideoSize } from "./helpers/evidence-video-settings";

test("macOS pointer — high-contrast canvas", async ({ browser }, testInfo) => {
  test.setTimeout(60_000);
  const durationMs = evidenceRecordDurationMs();
  const size = evidenceVideoSize();
  const quality = evidenceScreencastQuality();

  const context = await browser.newContext();
  await installEvidenceCursorOnContext(context);
  const page = await context.newPage();

  await page.setContent(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; height: 100%; background: #6b7280; }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(#fff2 1px, transparent 1px),
      linear-gradient(90deg, #fff2 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .panel {
    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: min(520px, 80vw); padding: 28px; border-radius: 12px;
    background: #f9fafb; box-shadow: 0 8px 32px #0006;
    font: 16px system-ui, sans-serif;
  }
  label { display: block; margin-bottom: 8px; color: #111; }
  input { width: 100%; padding: 12px; font: 18px system-ui; border: 2px solid #111; border-radius: 8px; }
  button { margin-top: 16px; padding: 12px 20px; font: 16px system-ui; background: #111; color: #fff; border: 0; border-radius: 8px; }
  h1 { margin: 0 0 12px; font-size: 22px; }
</style></head>
<body>
  <div class="grid"></div>
  <div class="panel">
    <h1>Pointer test</h1>
    <label for="t">Type here</label>
    <input id="t" placeholder="macOS arrow cursor" />
    <button type="button" id="btn">Click me</button>
  </div>
</body></html>`);

  const path = testInfo.outputPath("pointer-demo.webm");
  const recordStarted = Date.now();

  await page.screencast.start({ path, size, quality });
  await page.screencast.hideActions();
  await installEvidenceCursor(page);

  const input = page.locator("#t");
  const button = page.getByRole("button", { name: "Click me" });

  await page.mouse.move(120, 120, { steps: 16 });
  await page.mouse.move(960, 200, { steps: 20 });
  await typeEvidence(page, input, "macOS pointer");
  await clickEvidence(page, button);
  await expect(button).toHaveText("Click me");

  while (Date.now() - recordStarted < durationMs) {
    await page.mouse.move(400 + Math.sin(Date.now() / 400) * 120, 500, { steps: 4 });
    await page.waitForTimeout(120);
  }

  await page.screencast.stop();
  await context.close();
});
