import type { BrowserContext, Page } from "@playwright/test";

import { installEvidenceCursor } from "./evidence-cursor";

/** How long the Netflix-style caption stays visible before fading out. */
export const EVIDENCE_LABEL_SHOW_MS = 2_800;

type LabelOptions = { label: string; showMs: number };

/** Injected in the page; must be self-contained (no outer closures). */
function applyWindowLabel(options: LabelOptions) {
  const { label, showMs } = options;
  const netflixTextShadow =
    "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, " +
    "-1px 0 0 #000, 1px 0 0 #000, 0 -1px 0 #000, 0 1px 0 #000, " +
    "0 3px 10px rgba(0,0,0,0.85)";

  const scheduleHide = (banner: HTMLElement) => {
    const w = window as Window & {
      __pwEvidenceLabelHide?: ReturnType<typeof setTimeout>;
    };
    if (w.__pwEvidenceLabelHide) clearTimeout(w.__pwEvidenceLabelHide);

    banner.style.visibility = "visible";

    w.__pwEvidenceLabelHide = setTimeout(() => {
      banner.style.visibility = "hidden";
    }, showMs);
  };

  const mount = () => {
    const id = "pw-evidence-window-label";
    let banner = document.getElementById(id);
    if (!banner) {
      banner = document.createElement("div");
      banner.id = id;
      Object.assign(banner.style, {
        position: "fixed",
        left: "50%",
        bottom: "10%",
        transform: "translateX(-50%)",
        zIndex: "2147483646",
        maxWidth: "90vw",
        textAlign: "center",
        background: "transparent",
        pointerEvents: "none",
        color: "#ffffff",
        font: "600 26px/1.25 Netflix Sans, Helvetica Neue, Helvetica, Arial, sans-serif",
        letterSpacing: "0.01em",
        textShadow: netflixTextShadow,
        whiteSpace: "nowrap",
        visibility: "visible",
      });
      const root = document.body ?? document.documentElement;
      root.appendChild(banner);
    }

    banner.textContent = label;
    scheduleHide(banner);
  };

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });
}

function labelOptions(label: string, showMs: number): LabelOptions {
  return { label, showMs };
}

export async function installWindowLabel(
  page: Page,
  label: string,
  showMs = EVIDENCE_LABEL_SHOW_MS,
) {
  const options = labelOptions(label, showMs);
  await page.addInitScript(applyWindowLabel, options);
  await page.evaluate(applyWindowLabel, options);
}

export async function installWindowLabelOnContext(
  context: BrowserContext,
  label: string,
  showMs = EVIDENCE_LABEL_SHOW_MS,
) {
  await context.addInitScript(applyWindowLabel, labelOptions(label, showMs));
}

/** Flash caption + fake pointer (caption auto-hides; cursor stays). */
export async function installEvidenceOverlays(
  page: Page,
  label: string,
  showMs = EVIDENCE_LABEL_SHOW_MS,
) {
  await installWindowLabel(page, label, showMs);
  await installEvidenceCursor(page);
}

/** Re-show caption when switching back to a context (page already loaded). */
export async function flashWindowLabel(
  page: Page,
  label: string,
  showMs = EVIDENCE_LABEL_SHOW_MS,
) {
  await page.evaluate(applyWindowLabel, labelOptions(label, showMs));
}
