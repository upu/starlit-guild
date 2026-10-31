import type { StoryStageCue } from "../story-stage-cues.ts";
import {
  openingCast,
  mapCast,
  archiveArrivalCast,
  copyCast,
  type OpeningCast,
} from "./waterway-opening-cast.ts";
import {
  offeredSamples,
  comparisonItems,
  mapItems,
  archiveMap,
  shadeCloth,
} from "./waterway-opening-items.ts";
import {
  divideSamples,
  compareShade,
  unfoldArchive,
  copyArchive,
  markCopy,
} from "./waterway-opening-motion.ts";

export function waterwayDepartureCue(cue: StoryStageCue, line: number): StoryStageCue {
  const poses = openingPoses(line);
  const actors = openingCast(cue, poses);
  const items = openingItems(line);
  const extras = cue.extras?.map((e) => (e.id === "keeper" ? { ...e, x: 80 } : e));
  const motions = new Map([
    [4, divideSamples],
    [7, compareShade],
    [16, unfoldArchive],
    [22, copyArchive],
    [25, markCopy],
  ]);
  const animate = motions.get(line);
  return {
    ...cue,
    cell: 24,
    actors,
    extras,
    items,
    sequence: animate?.({ ...cue, actors, items, extras }),
    finishBeforeAdvance: !!animate || line === 13,
    initial: Object.fromEntries(actors.map((a) => [a.id, a.x])),
    initialBottom: Object.fromEntries(actors.map((a) => [a.id, a.bottom ?? 14])),
  };
}
function openingPoses(line: number): OpeningCast {
  if (line < 4) return { aria: { carry: true } };
  if (line === 4) return { aria: { carry: true } };
  if (line < 16) return comparisonCast(line);
  if (line < 22) return line === 16 ? archiveArrivalCast : mapCast;
  return line === 22
    ? {
        ...copyCast,
        aria: { ...copyCast.aria, via: [{ x: 38, bottom: 0 }] },
        leon: {
          ...copyCast.leon,
          via: [
            { x: 66, bottom: 0 },
            { x: 39, bottom: 0 },
          ],
        },
      }
    : copyCast;
}
function comparisonCast(line: number): OpeningCast {
  const poses: OpeningCast = line >= 7 ? { leon: { carry: true } } : {};
  if (line >= 13)
    Object.assign(poses, {
      aria: {
        x: 63,
        bottom: 23,
        inspect: true,
        via:
          line === 13
            ? [
                { x: 34, bottom: 0 },
                { x: 66, bottom: 0 },
              ]
            : undefined,
      },
      leon: {
        x: 54,
        bottom: -5,
        carry: true,
        via:
          line === 13
            ? [
                { x: 68, bottom: -8 },
                { x: 54, bottom: -8 },
              ]
            : undefined,
      },
    });
  return poses;
}
function openingItems(line: number) {
  if (line <= 4) return offeredSamples();
  if (line < 16)
    return [...comparisonItems("ground", "ground", line > 7), ...(line >= 7 ? [shadeCloth()] : [])];
  if (line === 16)
    return [
      ...mapItems().filter((i) => i.id !== archiveMap.id),
      {
        ...archiveMap,
        actor: "leon" as const,
        x: 0,
        bottom: 0,
        width: 4.5,
        wrist: true,
        wristAnchor: "bottom" as const,
        image: "/storybook-study/folded-request-v1.webp",
        pitch: undefined,
        support: undefined,
      },
    ];
  return mapItems(line >= 22 ? "leon" : undefined);
}
export function waterwayDepartureExitCue(cue: StoryStageCue): StoryStageCue {
  return {
    ...cue,
    cell: 24,
    extras: cue.extras?.map((e) => (e.id === "keeper" ? { ...e, x: 80 } : e)),
    items: mapItems("leon"),
    sequence: undefined,
    actors: openingCast(cue).map((a) => ({
      ...a,
      x: a.id === "aria" ? 125 : 138,
      bottom: a.id === "aria" ? 0 : -5,
      left: false,
      carry: a.id === "leon",
      holdingWalk: a.id === "leon",
      via: [{ x: a.id === "aria" ? 32.0625 : 39, bottom: a.id === "aria" ? 0 : -5 }],
    })),
  };
}
