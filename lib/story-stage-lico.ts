import {
  scene,
  trio,
  quartet,
  quintet,
  actor,
  held,
  ground,
  table,
  onTable,
  npc,
  type LaterStage,
} from "./story-stage-later-shared.ts";
const keeper = () => npc("keeper", undefined, 28);
// These sit inside the painted bed beside the left channel, not in the walking lane.
const plants = () => ground("colony", 7, 45, 12);
const plantLabel = () => ground("plant-label", 12, 44, 2.8);
const withLico = () => [actor("aria", 20), actor("leon", 41), actor("mira", 62), actor("lico", 82)];
export const licoStages: Record<string, LaterStage> = {
  "brekka-moss-beds-departure": scene(
    "moss-beds",
    trio(),
    [
      { at: 0, items: [plants()] },
      { at: 1, actors: { aria: { x: 23, bottom: 38, inspect: true, left: true } } },
      { at: 2, actors: { leon: { pose: "offer" } } },
      { at: 4, actors: { aria: { inspect: false, left: false } } },
    ],
    { furniture: [plantLabel()] },
  ),
  "brekka-moss-beds-return": scene(
    "moss-beds",
    withLico(),
    [
      { at: 0, actors: { lico: { visible: false, x: 110 } }, items: [plants()] },
      {
        at: 2,
        actors: {
          lico: { visible: true, x: 82, pose: "surprise", name: "小柄な女性" },
          aria: { reaction: "surprise" },
        },
      },
      { at: 5, actors: { leon: { x: 46 } } },
      { at: 7, items: [plants(), held("ledger", "lico")] },
      { at: 9, actors: { lico: { name: "リコ" } } },
      {
        at: 15,
        actors: { lico: { x: 34, lane: 0, pose: "offer" }, aria: { pose: "surprise" } },
        items: [plants(), held("ledger", "lico")],
      },
      { at: 17, actors: { aria: { reaction: "surprise" } } },
      { at: 22, actors: { lico: { x: 79, lane: 0 }, mira: { pose: "think" } } },
      { at: 32, items: [plants(), held("ledger", "lico"), ground("bread", 74, 13, 8)] },
      { at: 37, actors: { lico: { pose: "think" } } },
      {
        at: 42,
        actors: { lico: { inspect: true } },
        items: [plants(), ground("ledger", 77, 17, 9), ground("bread", 69, 13, 8)],
      },
      {
        at: 45,
        actors: {
          lico: { inspect: false, seated: true, pose: "think" },
          mira: { x: 65, pose: "offer" },
        },
        items: [plants(), ground("ledger", 84, 14, 7), ground("bread", 69, 13, 8)],
      },
      { at: 49, actors: { mira: { seated: true } } },
      {
        at: 50,
        items: [
          plants(),
          ground("ledger", 52, 16, 9),
          ground("medicine", 58, 12, 10),
          ground("bread", 69, 13, 8),
        ],
      },
    ],
    { initial: { lico: 110 }, furniture: [plantLabel()] },
  ),
  "lico-records-departure": scene(
    "registry",
    quartet(),
    [
      {
        at: 0,
        items: [table(), onTable("ledger")],
        extras: [keeper(), npc("merchant", "醸造所の商人", 74)],
      },
      {
        at: 1,
        extras: [
          { ...keeper(), pose: "explain", speaking: true },
          npc("merchant", "醸造所の商人", 74),
        ],
      },
      { at: 4, extras: [keeper(), npc("merchant", "醸造所の商人", 74, "explain", true)] },
      {
        at: 6,
        items: [table(), onTable("ledger", 45), { ...onTable("ledger", 57, 8), id: "orders" }],
      },
      { at: 14, actors: { aria: { reaction: "surprise" } } },
      {
        at: 20,
        extras: [
          { ...keeper(), pose: "point", speaking: true },
          npc("merchant", "醸造所の商人", 74),
        ],
      },
      { at: 31, items: [table(), onTable("ledger")] },
      {
        at: 32,
        background: "moss-beds",
        furniture: [plantLabel()],
        cast: quintet().map((a) => ({ ...a, seated: a.id === "lico" })),
        items: [plants(), ground("ledger", 77, 13, 8), ground("dish", 85, 13, 6)],
        extras: [keeper()],
      },
      { at: 37, actors: { lico: { pose: "think" } } },
      {
        at: 40,
        actors: { aria: { x: 23, carry: true }, lico: { seated: false } },
        items: [
          plants(),
          ground("ledger", 77, 13, 8),
          held("basket", "aria"),
          ground("dish", 85, 13, 6),
        ],
      },
      {
        at: 42,
        actors: { lico: { x: 78, bottom: 0, pose: "surprise" } },
        items: [
          plants(),
          ground("ledger", 86, -1, 8),
          held("basket", "aria"),
          ground("dish", 71, -1, 6),
        ],
      },
      { at: 46, actors: { aria: { x: 24 }, leon: { pose: "offer" } } },
    ],
    { cell: 19, initial: { lico: 83 } },
  ),
  "lico-records-return": scene(
    "moss-beds",
    quintet(),
    [
      {
        at: 0,
        items: [plants(), held("ledger", "leon"), ground("dish", 78, 16, 9)],
        extras: [keeper()],
      },
      {
        at: 4,
        items: [plants(), held("ledger", "lico"), ground("basket", 28), ground("dish", 78, 16, 9)],
      },
      {
        at: 8,
        actors: { lico: { seated: true } },
        items: [
          plants(),
          ground("ledger", 78, 13, 9),
          ground("basket", 28),
          ground("dish", 86, 13, 6),
        ],
      },
      { at: 12, extras: [{ ...keeper(), pose: "explain", speaking: true }] },
      { at: 17, actors: { lico: { pose: "think" } } },
      { at: 24, extras: [{ ...keeper(), pose: "point", speaking: true }] },
      {
        at: 27,
        actors: { aria: { carry: true } },
        items: [plants(), held("seedlings", "aria"), ground("ledger", 78, 13, 9)],
      },
      { at: 30, actors: { lico: { seated: true, pose: "think" } } },
    ],
    { furniture: [plantLabel()] },
  ),
};
