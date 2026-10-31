import type { StageExtra, StageItem } from "./story-stage-cues.ts";
import { actor, ground, npc, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import { chair } from "./story-stage-furniture.ts";

const guests = () => [
  actor("aria", 30, { bottom: 12, seated: true, chair: true }),
  actor("leon", 76, { bottom: 12, seated: true, chair: true }),
  actor("mira", 40, { bottom: 25, seated: true, chair: true }),
  actor("finn", 60, { bottom: 25, seated: true, chair: true }),
];
const owner = (service?: StageExtra["service"], x = 73, bottom = 21): StageExtra => ({
  ...npc("merchant", "店主", x),
  bottom,
  service,
});
const desk = (
  id: string,
  art: StageItem["art"],
  x: number,
  bottom: number,
  width: number,
): StageItem => ({
  ...ground(art, x, bottom, width),
  id,
  support: "table",
});
type Papers =
  "none" | "carried" | "placed" | "shown" | "gathered" | "first" | "second" | "evening" | "reading";
function papers(state: Papers): StageItem[] {
  if (state === "none") return [];
  const town = desk("town-request", "folded-paper", 67, 26, 4.5);
  if (state === "carried") return [{ ...town, extra: "merchant", wrist: true }];
  if (state === "placed") return [town];
  const finn = desk("finn-request", "folded-paper", 57, 35, 4.5);
  if (state === "shown") return [town, { ...finn, actor: "finn", wrist: true }];
  const gathered = [
    { ...town, x: 34, bottom: 24 },
    { ...finn, x: 40, bottom: 25 },
  ];
  if (state === "gathered") return gathered;
  const mira: StageItem = {
    ...ground("sealed-letter", 0, 0, 4.5),
    id: "mira-request",
    actor: "mira",
    wrist: true,
  };
  if (state === "first")
    return [
      { ...gathered[0], art: "paper", width: 7, actor: "aria", wrist: true },
      gathered[1],
      mira,
    ];
  if (state === "second")
    return [
      { ...gathered[0], art: "paper", width: 7, x: 38 },
      { ...gathered[1], art: "paper", width: 7, actor: "aria", wrist: true },
      mira,
    ];
  const evening = [
    desk("town-request", "paper", 34, 24, 7),
    desk("finn-request", "paper", 59, 29, 7),
    desk("mira-request", "paper", 43, 29, 7),
  ];
  return state === "reading"
    ? [...evening.slice(0, 2), { ...evening[2], actor: "mira", wrist: true }]
    : evening;
}
function props(
  state: Papers,
  plate: "table" | "held" | "cleared" = "table",
  evening = false,
): StageItem[] {
  return [
    { ...ground("dining-table", 50, 12, 48), id: "table" },
    ground("trade-parcels", 83, 8, 10),
    { ...ground("delivery-bag", 24, 25, 7), id: "visiting-bag" },
    ...(evening
      ? []
      : [
          desk("aria-lunch", "lunch-plate", 37, 28, 5.5),
          desk("leon-lunch", "lunch-plate", 65, 29, 5.5),
          desk("mira-lunch", "lunch-plate", 45, 31, 5.5),
        ]),
    ...(plate === "cleared"
      ? []
      : [
          {
            ...desk("cleared-plate", "dining-plate", 68, 28, 5.5),
            ...(plate === "held"
              ? { extra: "merchant" as const, wrist: true, wristAnchor: "bottom" as const }
              : {}),
          },
        ]),
    ...papers(state),
    ...(!["first", "second", "evening", "reading"].includes(state)
      ? [
          {
            ...ground("sealed-letter", 0, 5, 4.5),
            id: "mira-request",
            carrier: "visiting-bag",
            stored: true,
          },
        ]
      : []),
  ];
}
function dining(beats: LaterBeat[]) {
  const cast = guests();
  return scene("dining-room", cast, beats, { furniture: cast.map((a) => chair(a)) });
}
export const lindeDeparture = dining([
  { at: 0, items: props("none"), extras: [owner(undefined, 89, 44)] },
  {
    at: 6,
    items: props("carried"),
    extras: [{ ...owner("carry"), via: [{ x: 89, bottom: 21 }] }],
    sequence: [
      { after: 2000, extras: [owner("place")] },
      { after: 2600, items: props("placed") },
      { after: 3400, extras: [owner()] },
    ],
  },
  { at: 7, extras: [{ ...owner("talk"), speaking: true }] },
  { at: 10, actors: { finn: { pose: "offer" } }, items: props("shown") },
  {
    at: 11,
    actors: { finn: { pose: "offer" }, leon: { pose: "offer" }, aria: { pose: "offer" } },
    // They slide the requests across the tabletop to compare the addresses.
    sequence: [{ after: 800, items: props("gathered") }],
  },
  { at: 13, actors: { aria: { pose: "surprise", reaction: "surprise" } } },
  {
    at: 19,
    actors: { finn: { left: false, pose: "think" } },
    extras: [owner("place")],
    sequence: [
      { after: 650, items: props("gathered", "held") },
      { after: 1400, extras: [owner("carry")] },
      { after: 2100, extras: [owner("raise")] },
    ],
  },
  { at: 20, actors: { aria: { reaction: "surprise" } } },
  { at: 21, extras: [owner("carry")] },
  {
    at: 26,
    actors: {
      aria: { pose: "offer" },
      mira: { x: 29, left: true, seated: false, pose: "offer", nameAbove: true },
    },
    sequence: [
      { after: 900, items: openingPaper("first") },
      { after: 1600, items: props("first", "held") },
      { after: 2500, items: openingPaper("second") },
      { after: 3200, actors: { mira: { left: false } }, items: props("second", "held") },
    ],
  },
]);
function openingPaper(state: "first" | "second") {
  return props(state, "held").map((item) => (item.actor === "aria" ? { ...item, turn: 70 } : item));
}
export const lindeReturn = dining([
  { at: 0, items: props("evening", "cleared", true), extras: [owner(undefined, 89, 44)] },
  { at: 5, actors: { mira: { pose: "offer" } }, items: props("reading", "cleared", true) },
  { at: 7, actors: { aria: { reaction: "surprise" } } },
  { at: 14, actors: { mira: { pose: "offer" } }, items: props("evening", "cleared", true) },
  { at: 15, extras: [{ ...owner("talk", 81, 40), speaking: true }] },
  {
    at: 16,
    actors: {
      aria: { pose: "think" },
      leon: { pose: "think" },
      mira: { pose: "think" },
      finn: { pose: "think" },
    },
  },
]);
