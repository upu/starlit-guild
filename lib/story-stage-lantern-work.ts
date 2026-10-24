import { actor, npc, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import { lanternItems, finishedLanternItems } from "./story-stage-lantern-items.ts";
import { lanternAddressBeats } from "./story-stage-lantern-address.ts";

const porter = (x = 70, bottom = 39) => ({ ...npc("worker", "荷運び人", x), bottom });
const cleaning = () => lanternItems({ lamp: "clean", pan: "leon", cloth: "aria" });
const handover: LaterBeat = {
  at: 7,
  night: true,
  actors: {
    aria: {
      x: 61,
      bottom: 25,
      via: [{ x: 43, bottom: 20 }],
      fieldWork: undefined,
      carry: true,
      pose: "offer",
      reachOver: undefined,
    },
  },
  extras: [{ ...porter(67, 25), pose: "explain" }],
  sequence: [
    { after: 1300, actors: { aria: { carry: false } } },
    { after: 1500, items: lanternItems({ lamp: "clean", pan: "leon", cloth: "worker" }) },
    {
      after: 2300,
      actors: {
        aria: { x: 31, bottom: 13, via: [{ x: 61, bottom: 13 }], fieldWork: "weed", carry: false },
        leon: { x: 58, bottom: 15, left: false },
      },
      extras: [{ ...porter(59, 32), wiping: true }],
    },
    {
      after: 4900,
      extras: [{ ...porter(72, 36), inspect: true }],
      items: lanternItems({ lamp: "clean", pan: "leon", cloth: "ledge" }),
    },
    {
      after: 5800,
      extras: [{ ...porter(72, 36), carry: true }],
      items: lanternItems({ lamp: "clean", pan: "leon", cloth: "ledge", oil: "worker" }),
    },
    {
      after: 6500,
      extras: [{ ...porter(66.5, 18.5), carry: true }],
      actors: {
        aria: { fieldWork: undefined, inspect: true },
        leon: { carry: false, push: "extend" },
      },
      items: lanternItems({ lamp: "clean", pan: "leon", cloth: "ledge", oil: "worker", cut: true }),
    },
    {
      after: 8000,
      items: lanternItems({
        lamp: "clean",
        pan: "leon",
        cloth: "ledge",
        oil: "pouring",
        cut: true,
      }),
    },
    {
      after: 9000,
      actors: { leon: { carry: true, push: undefined } },
      items: lanternItems({ lamp: "clean", pan: "leon", cloth: "ledge", oil: "worker", cut: true }),
    },
    {
      after: 9700,
      extras: [{ ...porter(72, 36), carry: true }],
      actors: { leon: { x: 57, bottom: 30, left: true, reachOver: "stone-lantern" } },
    },
    { after: 10800, actors: { leon: { carry: false, pose: "offer" } } },
    {
      after: 11100,
      items: lanternItems({ lamp: "clean", cloth: "ledge", cut: true }),
      extras: [{ ...porter(72, 36), inspect: true }],
    },
    {
      after: 11900,
      items: lanternItems({ lamp: "returned", cloth: "ledge", cut: true }),
      extras: [porter(72, 36)],
    },
    {
      after: 12600,
      items: finishedLanternItems(),
      actors: { leon: { x: 58, bottom: 15, reachOver: undefined } },
    },
  ],
};

export const lanternWork = scene(
  "village-house",
  [
    actor("aria", 28),
    actor("leon", 44, { bottom: 31, left: false, pose: "offer", reachOver: "stone-lantern" }),
    actor("mira", 85, { bottom: 24 }),
    actor("finn", 91, { bottom: 6 }),
  ],
  [
    {
      at: 0,
      items: lanternItems(),
      extras: [porter()],
      sequence: [
        { after: 650, items: lanternItems({ lamp: "open" }) },
        { after: 1500, items: lanternItems({ lamp: "open", pan: "leon" }) },
      ],
    },
    {
      at: 2,
      actors: {
        leon: {
          x: 67,
          bottom: 15,
          via: [{ x: 44, bottom: 20 }],
          left: true,
          reachOver: undefined,
          carry: true,
        },
        aria: { pose: "offer" },
      },
      items: lanternItems({ lamp: "open", pan: "leon", cloth: "aria" }),
      sequence: [
        {
          after: 1300,
          actors: {
            aria: { x: 43, bottom: 31, carry: true, fieldWork: "wipe", reachOver: "stone-lantern" },
          },
        },
        { after: 2500, actors: { aria: { carry: false } } },
        { after: 3600, items: cleaning() },
      ],
    },
    handover,
    {
      at: 8,
      actors: {
        aria: {
          x: 38,
          bottom: 14,
          inspect: false,
          fieldWork: undefined,
          pose: "greet",
          via: undefined,
        },
        leon: { via: undefined },
      },
    },
    { at: 9, extras: [{ ...porter(74, 36), pose: "explain", speaking: true }] },
    ...lanternAddressBeats,
  ],
);
