import type { StageExtra } from "./story-stage-cues.ts";
import { actor, npc, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import { displayItems, type DisplayState } from "./story-stage-manor-display-items.ts";

const gardener = (patch: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("worker", "庭師", 64),
  bottom: 26,
  left: false,
  ...patch,
});
const owner = (patch: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("merchant", "庭の主人", 28),
  bottom: 44,
  ...patch,
});
type Items = (patch?: DisplayState) => ReturnType<typeof displayItems>;
function uncover(items: Items): LaterBeat[] {
  return [
    {
      at: 0,
      extras: [gardener({ pose: "point" }), owner()],
      items: items({ cover: "draped", lid: "closed" }),
      sequence: [
        { after: 800, items: items({ cover: "lifting" }) },
        { after: 1700, items: items({ cover: "folded", lid: "open" }) },
        {
          after: 2400,
          items: items({ lifted: true, stone: "tilting" }),
          extras: [gardener({ carry: true }), owner()],
        },
        { after: 3200, items: items({ stone: "bottom" }) },
      ],
    },
    { at: 1, actors: { leon: { pose: "offer" } } },
    {
      at: 2,
      extras: [gardener({ carry: true }), owner({ pose: "explain", speaking: true })],
      sequence: [
        { after: 900, items: items({ stone: "top" }) },
        { after: 1700, items: items({ lifted: false }), extras: [gardener(), owner()] },
      ],
    },
    { at: 4, extras: [gardener(), owner({ pose: "explain", speaking: true })] },
    { at: 5, extras: [gardener(), owner()] },
  ];
}
const departingOwner = () =>
  owner({
    x: 28,
    bottom: -55,
    via: [
      { x: 7, bottom: 43 },
      { x: 7, bottom: 10 },
      { x: 28, bottom: -8 },
    ],
  });
const departingGardener = () => gardener({ x: 125, bottom: 20, via: [{ x: 86, bottom: 28 }] });
function closeCase(items: Items): LaterBeat {
  return {
    at: 6,
    extras: [gardener({ pose: "point" }), departingOwner()],
    sequence: [
      { after: 1100, items: items({ lid: "closed", key: "lock" }) },
      { after: 2000, items: items({ key: "belt" }), extras: [gardener(), departingOwner()] },
      {
        after: 3000,
        items: items({ gardenerLeaving: true }),
        extras: [departingGardener(), departingOwner()],
      },
    ],
  };
}
function measureLight(items: Items): LaterBeat {
  return {
    at: 21,
    actors: {
      leon: { x: 35, bottom: 38, left: false, via: [{ x: 35, bottom: 25 }] },
      aria: { x: 45, bottom: 26, left: false, via: [{ x: 36, bottom: 16 }] },
    },
    sequence: [
      {
        after: 1500,
        actors: { leon: { writing: true }, aria: { pose: "offer" } },
        items: items({ recording: true, cloth: "near" }),
      },
      {
        after: 3000,
        actors: { aria: { x: 37, bottom: 24, left: false } },
        items: items({ cloth: "far" }),
      },
      {
        after: 4400,
        actors: { aria: { x: 45, bottom: 26, left: false } },
        items: items({ cloth: "near" }),
      },
      { after: 5800, actors: { leon: { writing: false, pose: "think" } } },
    ],
  };
}
function displayBeats(): LaterBeat[] {
  let state: DisplayState = {};
  const items: Items = (patch = {}) => displayItems((state = { ...state, ...patch }));
  return [
    ...uncover(items),
    closeCase(items),
    { at: 8, actors: { leon: { pose: "offer" } } },
    { at: 10, actors: { leon: { pose: "offer" } } },
    { at: 18, actors: { leon: { pose: "offer" } } },
    measureLight(items),
  ];
}
export const manorDisplay = scene(
  "manor-garden",
  [
    actor("aria", 30, { bottom: 17 }),
    actor("leon", 43, { bottom: 19, left: false, pose: "offer" }),
    actor("mira", 20, { bottom: 36, left: false }),
    actor("finn", 85, { bottom: 15, left: true }),
  ],
  displayBeats(),
);
