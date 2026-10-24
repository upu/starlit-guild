import type { StageExtra } from "./story-stage-cues.ts";
import { actor, npc, scene } from "./story-stage-later-shared.ts";
import { gardenItems } from "./story-stage-survey-garden-items.ts";

const gardener = (patch: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("worker", "庭師", 76),
  bottom: 42,
  left: false,
  limp: true,
  ...patch,
});
const items = gardenItems();
export const surveyGarden = scene(
  "manor-back-paths",
  [
    actor("aria", 25, { bottom: 14 }),
    actor("leon", 46, { bottom: 14, left: false }),
    actor("mira", 36, { bottom: 34, left: false, nameAbove: true }),
    actor("finn", 69, { bottom: 14, left: false, gloves: "worn" }),
  ],
  [
    {
      at: 0,
      extras: [gardener({ x: 88, bottom: 50, carry: true, speaking: true })],
      items: items(),
      sequence: [
        {
          after: 200,
          extras: [gardener({ carry: true, speaking: true })],
          items: items({ workerBottom: 42 }),
        },
        { after: 1600, extras: [gardener({ inspect: true, left: true })] },
        { after: 2000, items: items({ pot: "ground" }) },
        { after: 2800, extras: [gardener()] },
      ],
    },
    {
      at: 2,
      actors: { finn: { gloves: "worn" } },
      sequence: [
        { after: 450, actors: { finn: { gloves: "remove" } } },
        {
          after: 1100,
          actors: { finn: { gloves: undefined, pose: "offer" } },
          items: items({ gloves: "hand", key: "glove" }),
        },
        { after: 1800, items: items({ key: "finger" }) },
      ],
    },
    { at: 3, actors: { leon: { pose: "think" } } },
    { at: 4, sequence: [{ after: 150, items: items({ angle: 360 }) }] },
    { at: 5, actors: { finn: { pose: "offer" } } },
    { at: 7, actors: { finn: { pose: "offer" } } },
    {
      at: 10,
      actors: {
        finn: { x: 67, bottom: 42, left: false, pose: "offer", via: [{ x: 67, bottom: 30 }] },
        aria: {
          x: 20,
          bottom: 54,
          left: true,
          pose: "offer",
          via: [
            { x: 12, bottom: 20 },
            { x: 12, bottom: 44 },
          ],
        },
      },
      sequence: [
        { after: 1500, items: items({ gloves: "offer" }), extras: [gardener({ pose: "explain" })] },
        { after: 2300, items: items({ gloves: "worker" }) },
        { after: 2700, items: items({ gloves: "pocket" }) },
        { after: 3400, items: items({ key: "worker" }) },
        { after: 4100, items: items({ key: "belt" }), extras: [gardener()] },
      ],
    },
    { at: 11, actors: { aria: { pose: "offer", via: undefined } } },
    { at: 12, actors: { leon: { left: false, pose: "offer" } } },
    {
      at: 13,
      actors: {
        finn: { x: 64, bottom: 10, left: true, pose: "idle", via: [{ x: 60, bottom: 29 }] },
        mira: {
          x: 69,
          bottom: 38,
          left: false,
          inspect: false,
          nameOffset: -20,
          via: [
            { x: 39, bottom: 26 },
            { x: 58, bottom: 26 },
          ],
        },
      },
      sequence: [
        { after: 1900, actors: { mira: { inspect: true, via: undefined, nameOffset: -20 } } },
      ],
    },
    {
      at: 14,
      actors: {
        finn: { x: 64, bottom: 10, left: true, pose: "idle", via: [{ x: 60, bottom: 29 }] },
      },
      sequence: [{ after: 1300, actors: { finn: { pose: "offer", via: undefined } } }],
    },
    { at: 15, actors: { finn: { pose: "offer" } } },
  ],
);
