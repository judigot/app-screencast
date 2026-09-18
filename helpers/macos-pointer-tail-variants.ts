/** Wing shape fixed at chosen “variant 2”; tail/stem length scales 1–2 shorter, 3 center, 4–5 longer. */
export const WING_VARIANT_2_PATH =
  "M3 2 L3 24 L8 20 L11.5 29.5 L15.5 28 L12.5 17.5 L20.5 17 L3 2 Z";

/** Tail size 1 from the tail-length comparison (shorter tail on wing v2 body). */
export const TAIL_XS_PATH =
  "M3 2 L3 24 L8 20 L10.5 27 L14 26 L12.5 17.5 L20.5 17 L3 2 Z";

/** Final PR evidence cursor: wing variant 2 + tail XS (#1). */
export const FINAL_POINTER_PATH_D = TAIL_XS_PATH;

export const POINTER_TAIL_VARIANTS = [
  {
    id: 1,
    label: "Tail XS",
    pathD: TAIL_XS_PATH,
  },
  {
    id: 2,
    label: "Tail S",
    pathD: "M3 2 L3 24 L8 20 L11 28.25 L14.75 27.25 L12.5 17.5 L20.5 17 L3 2 Z",
  },
  {
    id: 3,
    label: "Tail M (wing v2)",
    pathD: WING_VARIANT_2_PATH,
  },
  {
    id: 4,
    label: "Tail L",
    pathD: "M3 2 L3 24 L8 20 L12 30.75 L16 29.25 L12.5 17.5 L20.5 17 L3 2 Z",
  },
  {
    id: 5,
    label: "Tail XL",
    pathD: "M3 2 L3 24 L8 20 L12.5 32 L16.5 30.5 L12.5 17.5 L20.5 17 L3 2 Z",
  },
] as const;

export const POINTER_VARIANT_HOTSPOT = { x: 3, y: 2 };
