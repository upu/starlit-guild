import type { StageItem } from "../story-stage-cues.ts";

const jar = (id: string, x: number, bottom: number): StageItem => ({
  id,
  art: "moss-jar",
  image: "/storybook-study/moss-jar-v1.webp",
  x,
  bottom,
  width: 3.6,
});
export const openingSlab: StageItem = {
  id: "opening-slab",
  art: "low-bench",
  image: "/storybook-study/berne-rest-ledge-v1.webp",
  x: 52,
  bottom: 16,
  width: 18,
};
export const archiveMap: StageItem = {
  id: "archive-map",
  art: "map",
  x: 55,
  bottom: 25,
  width: 10,
  pitch: 55,
  support: openingSlab.id,
};
export const fieldCopy = (owner?: "aria" | "leon"): StageItem => ({
  id: "field-copy",
  art: "paper",
  x: owner ? 0 : 48,
  bottom: owner ? 0 : 25,
  width: owner ? 3.8 : 5,
  actor: owner,
  wrist: !!owner,
  wristAnchor: "bottom",
  pitch: owner ? undefined : 55,
  support: owner ? undefined : openingSlab.id,
  embeddedFrames: owner ? [14, 15, 16, 17, 18] : undefined,
  wristOffset: owner === "aria" ? { x: -0.5625, bottom: 0.84375 } : undefined,
});
export const shadeCloth = (spread = false): StageItem => ({
  id: "shade-cloth",
  art: "cloth",
  actor: "leon",
  x: 0,
  bottom: 0,
  wrist: true,
  wristAnchor: spread ? undefined : "bottom",
  width: spread ? 8 : 4.8,
  pitch: spread ? 35 : undefined,
  image: `/storybook-study/${spread ? "common-packing-cloth-v1" : "folded-shawl-v1"}.webp`,
});
export function offeredSamples(): StageItem[] {
  return [
    openingSlab,
    fieldCopy(),
    ...["tower-jar", "forest-jar"].map((id, index) => ({
      ...jar(id, 0, 0),
      actor: "aria" as const,
      wrist: true,
      wristAnchor: "bottom" as const,
      wristOffset: { x: index ? 1.9 : -1.9, bottom: 0 },
    })),
  ];
}
type Placement = "source" | "hand" | "ground";
const samplePlaces = {
  "near-sample": { source: [35, 24], ground: [70, 20] },
  "far-sample": { source: [40, 24], ground: [25, 20] },
};
function sample(id: "near-sample" | "far-sample", where: Placement, bright: boolean): StageItem {
  const near = id === "near-sample";
  const held = where === "hand";
  const [x, bottom] = held ? [0, 0] : samplePlaces[id][where];
  return {
    id,
    art: "moss",
    width: 3.5,
    x,
    bottom,
    actor: held ? "aria" : undefined,
    wrist: held,
    wristAnchor: "bottom",
    glow: near && bright ? "bright" : undefined,
  };
}
export function comparisonItems(
  near: Placement = "ground",
  far: Placement = "ground",
  bright = false,
): StageItem[] {
  return [
    openingSlab,
    fieldCopy(),
    { ...jar("tower-jar", 27, 27), image: "/storybook-study/moss-jar-open-v1.webp" },
    jar("forest-jar", 39, 14),
    { id: "forest-knot", art: "twine", carrier: "forest-jar", x: 0, bottom: 2.4, width: 1.5 },
    sample("near-sample", near, bright),
    sample("far-sample", far, false),
  ];
}
export function mapItems(owner?: "aria" | "leon"): StageItem[] {
  return [
    ...comparisonItems("ground", "ground", true).filter((i) => i.id !== "field-copy"),
    archiveMap,
    fieldCopy(owner),
  ];
}
