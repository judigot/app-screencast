import type { Page } from "@playwright/test";

type ZoomOptions = { x: number; y: number; scale: number };

/** Injected in the page; must be self-contained. */
function setEvidenceZoom(options: ZoomOptions) {
  const html = document.documentElement;
  const w = window as Window & {
    __pwEvidenceZoom?: { scale: number; ox: number; oy: number };
  };
  if (options.scale <= 1) {
    html.style.transform = "";
    html.style.transformOrigin = "";
    delete w.__pwEvidenceZoom;
    return;
  }
  html.style.transition = "none";
  html.style.transformOrigin = `${options.x}px ${options.y}px`;
  html.style.transform = `scale(${options.scale})`;
  w.__pwEvidenceZoom = { scale: options.scale, ox: options.x, oy: options.y };
}

function clearEvidenceZoom() {
  const html = document.documentElement;
  html.style.transform = "";
  html.style.transformOrigin = "";
  const w = window as Window & { __pwEvidenceZoom?: unknown };
  delete w.__pwEvidenceZoom;
}

export function evidenceZoomEnabled(): boolean {
  return process.env.EVIDENCE_ZOOM !== "0";
}

export function evidenceZoomScale(forTyping = false): number {
  if (!evidenceZoomEnabled()) return 1;
  if (forTyping) {
    return Number(process.env.EVIDENCE_ZOOM_TYPE_SCALE ?? "1.38");
  }
  return Number(process.env.EVIDENCE_ZOOM_SCALE ?? "1.28");
}

export async function applyEvidenceZoom(
  page: Page,
  x: number,
  y: number,
  scale = evidenceZoomScale(),
) {
  if (scale <= 1) return;
  await page.evaluate(setEvidenceZoom, { x, y, scale });
}

export async function resetEvidenceZoom(page: Page) {
  if (!evidenceZoomEnabled()) return;
  await page.evaluate(clearEvidenceZoom);
}
