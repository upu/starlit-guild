import { fixedRoadLayout } from "./road-fixed-layout.ts";

export const waterwayBackgrounds = {
  blocked: "/storybook-study/drain-workyard-blocked-v1.png",
  cleared: "/storybook-study/drain-workyard-cleared-v1.png",
  open: "/storybook-study/drain-workyard-open-v1.png",
} as const;

export type WaterwayPhase = keyof typeof waterwayBackgrounds;
// Source-art dry stones immediately in front of the trunk's lower face.
export const waterwayCutFoot = { x: 1217, y: 340 };

/** This yard has one fixed camera; actors walk between work areas, not through repeating walls. */
export function waterwayLayout(width: number, height: number) {
  const layout = fixedRoadLayout(width, height);
  return {
    ...layout,
    // The left rim of the inset hatch. Feet remain on the dry bank.
    inspectionHand: layout.project(1043, 653),
    cover: layout.project(1120, 635),
  };
}
