import { test } from "@playwright/test";

import { evidenceRecordDurationMs, evidenceScreencastQuality, evidenceVideoSize } from "./helpers/evidence-video-settings";
import {
  POINTER_TAIL_VARIANTS,
  POINTER_VARIANT_HOTSPOT,
} from "./helpers/macos-pointer-tail-variants";

test("five tail sizes — #3 is wing v2", async ({ browser }, testInfo) => {
  test.setTimeout(120_000);
  const durationMs = evidenceRecordDurationMs();
  const size = evidenceVideoSize();
  const quality = evidenceScreencastQuality();
  const cursorSize = Number(process.env.EVIDENCE_CURSOR_SIZE ?? "48");

  const context = await browser.newContext();
  const page = await context.newPage();

  const variantsJson = JSON.stringify(
    POINTER_TAIL_VARIANTS.map((v) => ({ id: v.id, label: v.label, pathD: v.pathD })),
  );

  await page.setContent(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: #374151; color: #f9fafb; font-family: system-ui, sans-serif; }
  h1 { margin: 0 0 8px; font-size: 22px; font-weight: 600; text-align: center; padding: 16px 12px 0; }
  p.sub { margin: 0 0 12px; text-align: center; font-size: 14px; color: #d1d5db; }
  .row { display: flex; gap: 10px; padding: 0 12px 12px; height: calc(100% - 72px); }
  .cell {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    background: #f3f4f6; border-radius: 10px; padding: 12px 8px;
    border: 2px solid #111;
  }
  .cell.dark { background: #111827; }
  .num {
    font-size: 28px; font-weight: 800; color: #111; line-height: 1;
    margin-bottom: 8px;
  }
  .cell.dark .num { color: #f9fafb; }
  .preview { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; }
  .preview svg { width: 120px; height: 120px; display: block; }
  .label { font-size: 11px; text-align: center; color: #374151; margin-top: 8px; min-height: 2.6em; }
  .cell.dark .label { color: #e5e7eb; }
  .hit { flex: 0 0 72px; width: 100%; margin-top: 8px; border-radius: 8px;
    background: repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb 8px,#fff 8px,#fff 16px);
    border: 1px dashed #6b7280; font-size: 11px; color: #4b5563;
    display: flex; align-items: center; justify-content: center; text-align: center; padding: 4px;
  }
  .cell.dark .hit {
    background: repeating-linear-gradient(45deg,#1f2937,#1f2937 8px,#111827 8px,#111827 16px);
    color: #9ca3af;
  }
</style></head>
<body>
  <h1>Tail size — 1–2 shorter, 3 = wing v2, 4–5 longer</h1>
  <p class="sub">Hover the striped band in each column to try that live cursor</p>
  <div class="row" id="light"></div>
  <div class="row" id="dark" style="height: calc(50% - 36px); margin-top: -6px;"></div>
</body></html>`);

  await page.evaluate(
    ({ variants, pathHotspot, svgPreviewSize }) => {
      const svgNs = "http://www.w3.org/2000/svg";

      function svgForPath(pathD: string, px: number) {
        const svg = document.createElementNS(svgNs, "svg");
        svg.setAttribute("viewBox", "0 0 32 32");
        svg.setAttribute("width", String(px));
        svg.setAttribute("height", String(px));
        const outline = document.createElementNS(svgNs, "path");
        outline.setAttribute("d", pathD);
        outline.setAttribute("fill", "none");
        outline.setAttribute("stroke", "#FFFFFF");
        outline.setAttribute("stroke-width", "2.5");
        outline.setAttribute("stroke-linejoin", "round");
        const body = document.createElementNS(svgNs, "path");
        body.setAttribute("d", pathD);
        body.setAttribute("fill", "#000000");
        body.setAttribute("stroke", "#FFFFFF");
        body.setAttribute("stroke-width", "1.75");
        body.setAttribute("stroke-linejoin", "round");
        svg.append(outline, body);
        return svg;
      }

      function buildRow(containerId: string, dark: boolean) {
        const row = document.getElementById(containerId)!;
        for (const v of variants) {
          const cell = document.createElement("div");
          cell.className = dark ? "cell dark" : "cell";
          cell.dataset.pointerVariant = String(v.id - 1);

          const num = document.createElement("div");
          num.className = "num";
          num.textContent = String(v.id);

          const preview = document.createElement("div");
          preview.className = "preview";
          preview.appendChild(svgForPath(v.pathD, svgPreviewSize));

          const label = document.createElement("div");
          label.className = "label";
          label.textContent = v.label;

          const hit = document.createElement("div");
          hit.className = "hit";
          hit.textContent = "Move here";
          hit.dataset.pointerVariant = String(v.id - 1);

          cell.append(num, preview, label, hit);
          row.appendChild(cell);
        }
      }

      buildRow("light", false);
      buildRow("dark", true);

      const hostId = "pw-evidence-cursor";
      document.getElementById(hostId)?.remove();

      const host = document.createElement("div");
      host.id = hostId;
      host.setAttribute("data-pw-cursor-version", "variants");
      Object.assign(host.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: "56px",
        height: "56px",
        pointerEvents: "none",
        zIndex: "2147483647",
        transformOrigin: "top left",
        display: "none",
      });
      document.documentElement.appendChild(host);

      const style = document.createElement("style");
      style.id = "pw-evidence-cursor-style";
      style.textContent = "* { cursor: none !important; }";
      document.head.appendChild(style);

      let activeIndex = 0;
      let pressed = false;

      function renderCursor(index: number) {
        activeIndex = index;
        const pathD = variants[index]!.pathD;
        host.replaceChildren();
        host.appendChild(svgForPath(pathD, 56));
      }

      function layout(clientX: number, clientY: number) {
        const el = document.elementFromPoint(clientX, clientY);
        const zone = el?.closest("[data-pointer-variant]") as HTMLElement | null;
        if (zone) {
          host.style.display = "block";
          const idx = Number(zone.dataset.pointerVariant ?? "0");
          if (idx !== activeIndex) renderCursor(idx);
        } else {
          host.style.display = "none";
        }

        const { x: hx, y: hy } = pathHotspot;
        host.style.left = `${clientX - hx}px`;
        host.style.top = `${clientY - hy}px`;
        host.style.transform = pressed ? "scale(0.88)" : "scale(1)";
      }

      document.addEventListener("mousemove", (e) => layout(e.clientX, e.clientY));
      document.addEventListener("mousedown", () => {
        pressed = true;
        layout(0, 0);
      });
      document.addEventListener("mouseup", () => {
        pressed = false;
      });

      renderCursor(0);
    },
    {
      variants: JSON.parse(variantsJson),
      pathHotspot: POINTER_VARIANT_HOTSPOT,
      svgPreviewSize: 120,
    },
  );

  const path = testInfo.outputPath("pointer-variants.webm");
  const recordStarted = Date.now();

  await page.screencast.start({ path, size, quality });
  await page.screencast.hideActions();

  const bands = page.locator("[data-pointer-variant].hit");
  for (let i = 0; i < 5; i += 1) {
    const band = bands.nth(i);
    const box = await band.boundingBox();
    if (!box) continue;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y, { steps: 14 });
    await page.waitForTimeout(350);
    await page.mouse.click(x, y);
    await page.waitForTimeout(250);
  }

  for (let i = 5; i < 10; i += 1) {
    const band = bands.nth(i);
    const box = await band.boundingBox();
    if (!box) continue;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
    await page.waitForTimeout(280);
  }

  while (Date.now() - recordStarted < durationMs) {
    await page.waitForTimeout(200);
  }

  await page.screencast.stop();
  await context.close();
});
