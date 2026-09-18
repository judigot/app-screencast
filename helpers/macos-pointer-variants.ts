/** Five silhouettes — left shaft/wing increases from 1 → 5 (same tip hotspot). */
export const POINTER_VARIANTS = [
  {
    id: 1,
    label: "Baseline (narrow left)",
    pathD: "M3 2 L3 22 L7.5 18.5 L11 29 L15 27.5 L12 17 L21 16.5 L3 2 Z",
  },
  {
    id: 2,
    label: "Left +1",
    pathD: "M3 2 L3 24 L8 20 L11.5 29.5 L15.5 28 L12.5 17.5 L20.5 17 L3 2 Z",
  },
  {
    id: 3,
    label: "Left +2",
    pathD: "M3 2 L3 26 L9 21.5 L11.5 30 L15.5 28.5 L12.5 18 L20 17.5 L3 2 Z",
  },
  {
    id: 4,
    label: "Left +3",
    pathD: "M3 2 L3 27 L4 26 L10 22 L11.5 30 L15.5 28.5 L12.5 18 L19.5 17.5 L3 2 Z",
  },
  {
    id: 5,
    label: "Left +4 (widest shaft)",
    pathD: "M2.5 2 L2.5 28.5 L5 27.5 L11 23 L12 30.5 L16 29 L13 18.5 L19 17.5 L2.5 2 Z",
  },
] as const;

export const POINTER_VARIANT_HOTSPOT = { x: 3, y: 2 };
