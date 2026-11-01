import type { StageExtra, StageItem } from "./story-stage-cues.ts";
import { actor, ground, held, npc, scene, type LaterBeat } from "./story-stage-later-shared.ts";

const keeper = (patch: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("keeper", "管理人", 65),
  bottom: 20,
  restoration: "trace",
  ...patch,
});
const mason = (patch: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("worker", "石工", 69),
  bottom: 43,
  ...patch,
});
const fence = (x = 22): StageExtra => ({
  ...npc("fence-carrier", "柵を運ぶ人", x),
  bottom: -16,
  carry: true,
});
const cartWorker = (patch: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("stone-carrier", "荷車を押す人", 125),
  bottom: -7,
  carry: true,
  ...patch,
});
type State = {
  copy?: "leon" | "keeper" | "table";
  clean?: boolean;
  rag?: boolean;
  plans?: boolean;
  roots?: boolean;
  cart?: "approach" | "detour";
};

function restorationRecords(state: State): StageItem[] {
  const items: StageItem[] = [];
  if (state.copy === "leon")
    items.push(held("paper", "leon", { id: "replacement-record", x: -4, bottom: 26, width: 4.5 }));
  if (state.copy === "keeper")
    items.push({
      ...ground("paper", 0, 0, 4.5),
      id: "replacement-record",
      extra: "keeper",
      wrist: true,
    });
  if (state.copy === "table")
    items.push({
      ...ground("paper", 79, 27.4, 4.5),
      id: "replacement-record",
      support: "record-desk",
    });
  return items;
}

function restorationItems(state: State): StageItem[] {
  const items: StageItem[] = [
    { ...ground("tower-stone-bottom", 59.3, 20, 6.2), id: "recovered-stone" },
    ground("tools", 70, 43, 5),
    { ...ground("table", 84, 12, 18), id: "record-desk" },
    { ...ground("paper", 79.5, 27, 4.5), id: "removal-record", support: "record-desk" },
    { ...ground("work-fence", -3.5, -12, 10), id: "carried-fence", extra: "fence-carrier" },
    {
      ...ground(
        "empty-cart",
        -13.5,
        state.cart === "detour" ? -64 : state.cart === "approach" ? -16 : -6,
        26,
      ),
      id: "passing-cart",
      extra: "stone-carrier",
    },
    ground("medicine-closed", 19, 42, 8),
  ];
  if (!state.roots) items.push({ ...ground("joint-roots", 43, 26, 5), id: "joint-roots" });
  else items.push({ ...ground("joint-roots", 35, 19, 5), id: "joint-roots" });
  items.push(...restorationRecords(state));
  if (state.plans)
    items.push(held("map", "leon", { id: "groove-plan", x: -3.5, bottom: 26, width: 6 }));
  if (state.clean)
    items.push({
      ...ground("light-cloth", state.rag ? 58.5 : 60, 22.5, 2.4),
      id: "cleaning-cloth",
      support: "recovered-stone",
    });
  return items;
}

type Items = (patch?: State) => StageItem[];
const extras = (
  k: Partial<StageExtra> = {},
  m: Partial<StageExtra> = {},
  fx = 22,
  c: Partial<StageExtra> = {},
) => [keeper(k), mason(m), fence(fx), cartWorker(c)];

function recordHandoff(items: Items): LaterBeat[] {
  return [
    {
      at: 7,
      actors: { leon: { x: 73, bottom: 20, left: true, pose: "offer" } },
      extras: extras({ restoration: "receive", left: true }),
      sequence: [
        { after: 800, items: items({ copy: "leon" }) },
        {
          after: 1500,
          items: items({ copy: "keeper" }),
          extras: extras({ restoration: "read", left: true }),
        },
      ],
    },
    {
      at: 8,
      actors: { leon: { x: 67, bottom: 5, via: [{ x: 73, bottom: 5 }] } },
      extras: extras({ restoration: "read", left: true }),
      sequence: [
        {
          after: 1300,
          extras: extras({
            x: 74,
            bottom: 26,
            restoration: "read",
            left: true,
            via: [{ x: 69, bottom: 30 }],
          }),
        },
        {
          after: 2400,
          items: items({ copy: "table" }),
          extras: extras({ x: 74, bottom: 26, restoration: "receive", left: true }),
        },
      ],
    },
    {
      at: 9,
      extras: extras({ x: 74, bottom: 26, restoration: "receive", left: true, speaking: true }),
    },
  ];
}

function prepareStone(items: Items): LaterBeat[] {
  return [
    {
      at: 10,
      actors: {
        leon: {
          x: 55,
          bottom: 9,
          left: false,
          pose: "offer",
          via: [
            { x: 70, bottom: 2 },
            { x: 55, bottom: 2 },
          ],
        },
      },
      extras: extras(
        { x: 74, bottom: 26, restoration: "receive", left: true },
        { x: 65, bottom: 19 },
      ),
      sequence: [
        {
          after: 1100,
          extras: extras(
            { x: 74, bottom: 26, restoration: "receive", left: true },
            { x: 65, bottom: 19, inspect: true },
          ),
          items: items({ clean: true, plans: true }),
        },
        { after: 1500, items: items({ rag: true }) },
        { after: 1900, items: items({ rag: false }) },
        { after: 2300, items: items({ clean: false }) },
      ],
    },
    {
      at: 11,
      actors: { aria: { x: 40, bottom: 23.5, left: false, via: [{ x: 34, bottom: 18 }] } },
      sequence: [
        { after: 750, actors: { aria: { inspect: true } } },
        { after: 1600, items: items({ roots: true }) },
      ],
    },
    { at: 12, actors: { mira: { pose: "offer" } } },
    { at: 13, actors: { finn: { handAction: "palm" } } },
  ];
}

function divertCart(items: Items): LaterBeat[] {
  return [
    {
      at: 15,
      actors: {
        finn: {
          x: 66,
          bottom: -4,
          left: false,
          handAction: undefined,
          pose: "greet",
          via: [{ x: 12, bottom: -4 }],
        },
      },
      extras: extras(
        { x: 74, bottom: 26, restoration: "receive", left: true },
        { x: 65, bottom: 19, inspect: true },
        -35,
      ),
      sequence: [
        {
          after: 2500,
          extras: extras(
            { x: 74, bottom: 26, restoration: "receive", left: true },
            { x: 65, bottom: 19, inspect: true },
            -35,
            { x: 96, bottom: -17 },
          ),
          items: items({ cart: "approach" }),
        },
        {
          after: 8000,
          extras: extras(
            { x: 74, bottom: 26, restoration: "receive", left: true },
            { x: 65, bottom: 19, inspect: true },
            -35,
            { x: 85, bottom: -65, via: [{ x: 94, bottom: -35 }] },
          ),
          items: items({ cart: "detour" }),
        },
      ],
    },
  ];
}

function restorationBeats(): LaterBeat[] {
  let state: State = {};
  const items = (patch: State = {}) => restorationItems((state = { ...state, ...patch }));

  return [
    {
      at: 0,
      items: items(),
      extras: extras({}, {}, 110),
      sequence: [{ after: 400, extras: extras() }],
    },
    { at: 1, extras: extras({ speaking: true }) },
    { at: 5, extras: extras({ restoration: "touch" }) },
    { at: 6, extras: extras({ restoration: "touch", speaking: true }) },
    ...recordHandoff(items),
    ...prepareStone(items),
    ...divertCart(items),
  ];
}

export const restorationDeparture = scene(
  "berne-foundation-open",
  [
    actor("aria", 25, { bottom: 13, left: false }),
    actor("leon", 82, { bottom: 43, left: true }),
    actor("mira", 22, { bottom: 43, left: false }),
    actor("finn", 12, { bottom: 8, left: false, dressed: true, handAction: "guard" }),
  ],
  restorationBeats(),
);
