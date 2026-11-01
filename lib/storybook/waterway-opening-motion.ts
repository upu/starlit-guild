import type { StoryStageCue, StageMoment, StageItem } from "../story-stage-cues.ts";
import {
  openingMoment as moment,
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

const divisionMoment = (c: StoryStageCue, after: number, poses: OpeningCast, items: StageItem[]) =>
  moment(c, after, { leon: { x: 66, bottom: 34 }, ...poses }, items);

export function divideSamples(c: StoryStageCue): StageMoment[] {
  const source = comparisonItems("source", "source");
  return [
    divisionMoment(
      c,
      450,
      { aria: { x: 30.6875, bottom: 18.65625, inspect: true } },
      offeredSamples(),
    ),
    divisionMoment(
      c,
      1200,
      { aria: { x: 30.6875, bottom: 18.65625, inspect: true } },
      source.map((i) =>
        i.id.endsWith("-sample") ? { ...i, image: "/storybook-study/sample-bowl-v1.webp" } : i,
      ),
    ),
    ...placeNear(c),
    ...placeFar(c),
  ];
}
function placeNear(c: StoryStageCue): StageMoment[] {
  const held = comparisonItems("hand", "source");
  return [
    divisionMoment(c, 2000, { aria: { x: 30.6875, bottom: 18.65625, inspect: true } }, held),
    divisionMoment(
      c,
      2600,
      {
        aria: {
          x: 65.6875,
          bottom: 14.65625,
          carry: true,
          via: [
            { x: 33, bottom: 0 },
            { x: 63, bottom: 0 },
          ],
        },
      },
      held,
    ),
    divisionMoment(c, 5100, { aria: { x: 65.6875, bottom: 14.65625, inspect: true } }, held),
    divisionMoment(
      c,
      5700,
      { aria: { x: 65.6875, bottom: 14.65625, inspect: true } },
      comparisonItems("ground", "source"),
    ),
  ];
}
function placeFar(c: StoryStageCue): StageMoment[] {
  const held = comparisonItems("ground", "hand");
  return [
    divisionMoment(
      c,
      6200,
      {
        aria: {
          x: 35.6875,
          bottom: 18.65625,
          via: [
            { x: 63, bottom: 0 },
            { x: 37, bottom: 0 },
          ],
        },
      },
      comparisonItems("ground", "source"),
    ),
    divisionMoment(c, 8500, { aria: { x: 35.6875, bottom: 18.65625, inspect: true } }, held),
    divisionMoment(
      c,
      9100,
      {
        aria: {
          x: 20.6875,
          bottom: 14.65625,
          carry: true,
          via: [
            { x: 36, bottom: 0 },
            { x: 21, bottom: 0 },
          ],
        },
      },
      held,
    ),
    divisionMoment(c, 10800, { aria: { x: 20.6875, bottom: 14.65625, inspect: true } }, held),
    divisionMoment(
      c,
      11400,
      { aria: { x: 20.6875, bottom: 14.65625, inspect: true } },
      comparisonItems(),
    ),
    moment(c, 12000, {}, comparisonItems()),
  ];
}
export function compareShade(c: StoryStageCue): StageMoment[] {
  const items = (bright: boolean, shaded?: string) => [
    ...comparisonItems("ground", "ground", bright).map((i) => ({ ...i, shaded: i.id === shaded })),
    shadeCloth(true),
  ];
  return [
    moment(c, 350, { leon: { x: 66.625, bottom: 22, left: false, carry: true } }, items(false)),
    moment(
      c,
      1400,
      { leon: { x: 66.625, bottom: 22, left: false, carry: true } },
      items(true, "near-sample"),
    ),
    moment(
      c,
      2600,
      {
        leon: {
          x: 28,
          bottom: 22,
          left: true,
          carry: true,
          via: [
            { x: 66, bottom: 34 },
            { x: 28, bottom: 34 },
          ],
        },
      },
      items(true),
    ),
    moment(
      c,
      5000,
      { leon: { x: 28, bottom: 22, left: true, carry: true } },
      items(true, "far-sample"),
    ),
    moment(
      c,
      6200,
      {
        leon: {
          x: 66,
          bottom: 14,
          carry: true,
          via: [
            { x: 28, bottom: 34 },
            { x: 66, bottom: 34 },
          ],
        },
      },
      items(true),
    ),
    moment(c, 8800, { leon: { carry: true } }, [
      ...comparisonItems("ground", "ground", true),
      shadeCloth(),
    ]),
  ];
}
export function unfoldArchive(c: StoryStageCue): StageMoment[] {
  const without = mapItems().filter((i) => i.id !== archiveMap.id);
  return [
    moment(c, 600, archiveArrivalCast, [
      ...without,
      { ...archiveMap, width: 4.5, image: "/storybook-study/folded-request-v1.webp" },
    ]),
    moment(c, 1300, archiveArrivalCast, [...without, { ...archiveMap, resizeMs: 800 }]),
    moment(c, 2300, mapCast, mapItems()),
  ];
}
export function copyArchive(c: StoryStageCue): StageMoment[] {
  const walking = {
    ...copyCast,
    leon: {
      ...copyCast.leon,
      via: [
        { x: 66, bottom: 0 },
        { x: 39, bottom: 0 },
      ],
    },
  };
  return [
    moment(
      c,
      2200,
      { ...walking, leon: { ...walking.leon, carry: false, writing: true } },
      mapItems("leon"),
    ),
    moment(c, 4000, copyCast, mapItems("leon")),
  ];
}
export function markCopy(c: StoryStageCue): StageMoment[] {
  const aria = {
    ...copyCast,
    aria: { ...copyCast.aria, carry: true },
    leon: { ...copyCast.leon, carry: false, pose: "offer" as const },
  };
  return [
    moment(c, 500, aria, mapItems("aria")),
    moment(
      c,
      1100,
      { ...aria, aria: { ...aria.aria, carry: false, writing: true } },
      mapItems("aria"),
    ),
    moment(c, 2200, aria, mapItems("aria")),
    moment(c, 2800, copyCast, mapItems("leon")),
  ];
}
