import { expect, type BrowserContext, type Locator, type Page } from "@playwright/test";

import { applyEvidenceZoom, evidenceZoomScale, resetEvidenceZoom } from "./evidence-zoom";
import {
  MACOS_POINTER_HOTSPOT,
  MACOS_POINTER_PATH_D,
  MACOS_POINTER_VERSION,
  macosPointerDisplaySize,
} from "./macos-pointer-svg";

type CursorInitOptions = {
  version: number;
  pathD: string;
  hotspotX: number;
  hotspotY: number;
  size: number;
};

export function evidenceCursorInitOptions(): CursorInitOptions {
  return {
    version: MACOS_POINTER_VERSION,
    pathD: MACOS_POINTER_PATH_D,
    hotspotX: MACOS_POINTER_HOTSPOT.x,
    hotspotY: MACOS_POINTER_HOTSPOT.y,
    size: macosPointerDisplaySize(),
  };
}

/** Injected in the page; must be self-contained (no outer closures). */
function applyEvidenceCursorInit(options: CursorInitOptions) {
  const { version, pathD, hotspotX, hotspotY, size } = options;
  const hostId = "pw-evidence-cursor";
  const svgNs = "http://www.w3.org/2000/svg";

  const mount = () => {
    if (!document.getElementById("pw-evidence-cursor-style")) {
      const style = document.createElement("style");
      style.id = "pw-evidence-cursor-style";
      style.textContent = "* { cursor: none !important; }";
      document.head.appendChild(style);
    }

    const legacy = document.getElementById(hostId);
    if (legacy?.getAttribute("data-pw-cursor-version") !== String(version)) {
      legacy?.remove();
      document.querySelector("img#pw-evidence-cursor")?.remove();
    }

    let pressed = false;
    let lastX = 80;
    let lastY = 80;

    let host = document.getElementById(hostId);
    if (!host) {
      host = document.createElement("div");
      host.id = hostId;
      host.setAttribute("data-pw-cursor-version", String(version));
      Object.assign(host.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: `${size}px`,
        height: `${size}px`,
        pointerEvents: "none",
        zIndex: "2147483647",
        transformOrigin: "top left",
      });

      const layout = (clientX: number, clientY: number) => {
        lastX = clientX;
        lastY = clientY;
        const w = window as Window & {
          __pwEvidenceZoom?: { scale: number; ox: number; oy: number };
        };
        const zoom = w.__pwEvidenceZoom;
        const z = zoom?.scale ?? 1;
        const ox = zoom?.ox ?? 0;
        const oy = zoom?.oy ?? 0;
        const lx = ox + (clientX - ox) / z;
        const ly = oy + (clientY - oy) / z;
        host!.style.left = `${lx - hotspotX}px`;
        host!.style.top = `${ly - hotspotY}px`;
        const clickScale = pressed ? 0.88 : 1;
        host!.style.transform = `scale(${clickScale / z})`;
        if (host!.parentElement !== document.documentElement) {
          document.documentElement.appendChild(host!);
        }
      };

      document.addEventListener("mousemove", (e) => layout(e.clientX, e.clientY));
      document.addEventListener("mousedown", () => {
        pressed = true;
        layout(lastX, lastY);
      });
      document.addEventListener("mouseup", () => {
        pressed = false;
        layout(lastX, lastY);
      });

      (host as HTMLDivElement & { __pwLayout?: typeof layout }).__pwLayout = layout;
      layout(lastX, lastY);
    }

    host.replaceChildren();
    const svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("viewBox", "0 0 32 32");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.style.display = "block";

    const outline = document.createElementNS(svgNs, "path");
    outline.setAttribute("d", pathD);
    outline.setAttribute("fill", "none");
    outline.setAttribute("stroke", "#FFFFFF");
    outline.setAttribute("stroke-width", "2.5");
    outline.setAttribute("stroke-linejoin", "round");
    outline.setAttribute("stroke-linecap", "round");

    const body = document.createElementNS(svgNs, "path");
    body.setAttribute("d", pathD);
    body.setAttribute("fill", "#000000");
    body.setAttribute("stroke", "#FFFFFF");
    body.setAttribute("stroke-width", "1.75");
    body.setAttribute("stroke-linejoin", "round");
    body.setAttribute("stroke-linecap", "round");

    svg.append(outline, body);
    host.appendChild(svg);

    const layoutFn = (host as HTMLDivElement & { __pwLayout?: (x: number, y: number) => void }).__pwLayout;
    layoutFn?.(lastX, lastY);

    if (host.parentElement !== document.documentElement) {
      document.documentElement.appendChild(host);
    }
  };

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });
}

export async function installEvidenceCursor(page: Page) {
  const options = evidenceCursorInitOptions();
  await page.addInitScript(applyEvidenceCursorInit, options);
  await page.evaluate(applyEvidenceCursorInit, options);
}

export async function installEvidenceCursorOnContext(context: BrowserContext) {
  const options = evidenceCursorInitOptions();
  await context.addInitScript(applyEvidenceCursorInit, options);
}

/** Restore the browser’s default cursor (remove fake arrow + cursor:none). */
export const EVIDENCE_CURSOR_TEARDOWN = () => {
  document.getElementById("pw-evidence-cursor")?.remove();
  document.querySelector("img#pw-evidence-cursor")?.remove();
  document
    .querySelectorAll("style")
    .forEach((el) => {
      if (el.textContent?.includes("cursor: none")) el.remove();
    });
};

export async function removeEvidenceCursor(page: Page) {
  await page.evaluate(EVIDENCE_CURSOR_TEARDOWN);
}

export function useNativeEvidenceCursor(): boolean {
  return process.env.EVIDENCE_NATIVE_CURSOR === "1";
}

export async function moveTo(
  page: Page,
  locator: Locator,
  steps = 12,
  zoomScale = evidenceZoomScale(false),
) {
  await installEvidenceCursor(page);
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error("missing bounding box for locator");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  const position = await page.evaluate(() => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }));

  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const mx = position.x + (x - position.x) * t;
    const my = position.y + (y - position.y) * t;
    await applyEvidenceZoom(page, mx, my, zoomScale);
    await page.mouse.move(mx, my);
    await page.waitForTimeout(12);
  }

  await page.waitForTimeout(80);
}

export { resetEvidenceZoom };

export async function clickEvidence(page: Page, locator: Locator) {
  await moveTo(page, locator);
  await locator.click();
  await page.waitForTimeout(150);
}

export async function typeEvidence(
  page: Page,
  locator: Locator,
  text: string,
  delay = 75,
) {
  await installEvidenceCursor(page);
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error("missing bounding box for locator");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const typeScale = evidenceZoomScale(true);
  await applyEvidenceZoom(page, x, y, typeScale);
  await page.mouse.move(x, y);
  await locator.click();
  await locator.pressSequentially(text, { delay });
  await page.waitForTimeout(120);
}

export async function expectVisibleSlow(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  await page.waitForTimeout(200);
}
