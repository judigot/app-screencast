import { FINAL_POINTER_PATH_D } from "./macos-pointer-tail-variants";

/** Bump when silhouette changes (forces replacing legacy cursor nodes in the page). */
export const MACOS_POINTER_VERSION = 13;

export const MACOS_POINTER_VIEW_BOX = "0 0 32 32";

/** Tip of arrow in viewBox coordinates. */
export const MACOS_POINTER_HOTSPOT = { x: 3, y: 2 };

/**
 * Reconstructed macOS arrow (upper-left tip, stem lower-right).
 * Not Apple-official path data.
 */
/** Final silhouette — wing v2 + tail XS (#1). */
export const MACOS_POINTER_PATH_D = FINAL_POINTER_PATH_D;

export function macosPointerDisplaySize(): number {
  return Number(process.env.EVIDENCE_CURSOR_SIZE ?? "56");
}

export function macosPointerSvgMarkup(size = macosPointerDisplaySize()): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MACOS_POINTER_VIEW_BOX}" width="${size}" height="${size}" ` +
    `style="display:block">` +
    `<path fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" d="${MACOS_POINTER_PATH_D}"/>` +
    `<path fill="#000000" stroke="#FFFFFF" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" d="${MACOS_POINTER_PATH_D}"/>` +
    `</svg>`
  );
}

export function macosPointerSvgDataUrl(size?: number): string {
  return `data:image/svg+xml,${encodeURIComponent(macosPointerSvgMarkup(size))}`;
}
