import { transplantDeparture } from "./story-stage-transplant.ts";
import { returnBasketHandoff } from "./story-stage-return-basket.ts";
import {
  scene,
  quintet,
  actor,
  held,
  ground,
  table,
  onTable,
  npc,
  type LaterStage,
} from "./story-stage-later-shared.ts";
import { seedlingExchange } from "./story-stage-seedling-exchange.ts";
import { loadingBaskets } from "./story-stage-seedling-items.ts";
import { bedBag, bedNotebook } from "./story-stage-moss-bed-items.ts";
import {
  fallenMushrooms,
  merrillPot,
  seedlingCollection,
} from "./story-stage-seedling-collection.ts";
const visitor = (
  pose: "idle" | "explain" | "point" | "wave" = "idle",
  x = 80,
  name = "緑髪の少女",
) => ({ ...npc("merrill", name, x, pose), bottom: 29, left: true });
const departingVisitor = () => ({
  ...visitor("idle", 75, "メリル"),
  bottom: -65,
  via: [{ x: 75, bottom: -15 }],
  carry: true,
});

const loadingCast = () => [
  actor("aria", 27, { bottom: 21, left: false }),
  actor("leon", 45, { bottom: 4, left: false }),
  actor("mira", 19, { bottom: -3, left: false }),
  actor("finn", 41, { bottom: -15, left: false }),
  actor("lico", 63, { bottom: 18, left: false }),
];
const returnCloth = (owner: "aria" | "lico") =>
  held("cloth", owner, {
    id: "dry-cloth",
    width: 3,
    wrist: true,
    x: 0,
    bottom: 0,
    embeddedFrames: owner === "lico" ? [84, 85] : undefined,
  });
const transplantedMoss = () => ({
  ...ground("moss", 18, 60, 5),
  id: "transplanted-moss",
  glow: "dim" as const,
});
const usedCloth = () => ({ ...ground("cloth", 24, 57, 3), id: "dry-cloth" });
const returnBasket = (carried = false) =>
  carried
    ? held("basket", "finn", { id: "return-basket", width: 6, wrist: true })
    : { ...ground("basket", 57.625, 35 + 3.5625 - (6 / 1.3) * 0.75, 6), id: "return-basket" };
export const seedlingStages: Record<string, LaterStage> = {
  "merrill-seedlings-departure": scene(
    "moss-beds",
    loadingCast().map((a) =>
      a.id === "aria" ? { ...a, x: 34.4375, bottom: 26.5, pose: "offer" as const } : a,
    ),
    [
      {
        at: 0,
        finishBeforeAdvance: true,
        actors: {
          lico: { mossStudy: "write" },
          aria: { pose: "offer", reachOver: "covered-seedlings" },
        },
        items: loadingBaskets().map((p) =>
          p.id === "damp-cloth"
            ? { ...p, actor: "aria" as const, x: 0, bottom: 0, wrist: true, support: undefined }
            : p,
        ),
        sequence: [
          { after: 900, items: loadingBaskets() },
          {
            after: 1700,
            actors: { aria: { x: 27, bottom: 21, pose: "idle", reachOver: undefined } },
          },
        ],
      },
      { at: 1, actors: { aria: { reaction: "surprise" } } },
      {
        at: 2,
        extras: [{ ...visitor("idle", 80), bottom: 29, left: true, seedlingAction: "taste" }],
      },
      { at: 3, extras: [visitor("explain")] },
      {
        at: 10,
        actors: { lico: { mossStudy: undefined, reaction: "surprise", pose: "surprise" } },
      },
      {
        at: 11,
        extras: [{ ...visitor("idle", 80), bottom: 29, left: true, seedlingAction: "taste" }],
      },
      { at: 12, actors: { lico: { pose: "offer", x: 63 } } },
    ],
    { cell: 24 },
  ),
  "merrill-seedlings-return": scene(
    "moss-beds",
    loadingCast(),
    [
      {
        at: 0,
        items: [...loadingBaskets(), ...fallenMushrooms()],
        extras: [{ ...visitor(), seedlingAction: "taste" }],
      },
      { at: 1, extras: [visitor("explain")] },
      { at: 8, actors: { aria: { reaction: "surprise" } } },
      ...seedlingExchange(() => [...loadingBaskets(), ...fallenMushrooms()]),
      seedlingCollection(loadingBaskets),
      { at: 37, actors: { aria: { reaction: "surprise" } } },
      {
        at: 40,
        finishBeforeAdvance: true,
        extras: [departingVisitor()],
        items: [...loadingBaskets(), merrillPot(true)],
      },
    ],
    {
      cell: 24,
      exitExtras: [departingVisitor()],
    },
  ),
  "moss-transplant-departure": transplantDeparture,
  "moss-transplant-return": scene(
    "new-moss-beds",
    quintet().map((a) =>
      a.id === "aria"
        ? { ...a, x: 8, bottom: 59.109375 }
        : a.id === "lico"
          ? { ...a, x: 19, bottom: 60 }
          : a.id === "finn"
            ? { ...a, x: 60, bottom: 35 }
            : a,
    ),
    [
      {
        at: 0,
        night: true,
        finishBeforeAdvance: true,
        actors: {
          aria: { x: 13.359375, bottom: 59.109375, carry: true, left: false },
          lico: { mossStudy: "reach", left: true },
        },
        items: [transplantedMoss(), returnCloth("aria"), returnBasket()],
        sequence: [
          { after: 1800, items: [transplantedMoss(), returnCloth("lico"), returnBasket()] },
          { after: 2600, actors: { aria: { x: 34, bottom: 48, carry: false, left: true } } },
        ],
      },
      {
        at: 3,
        finishBeforeAdvance: true,
        actors: { lico: { carry: false, inspect: false, mossStudy: "wipe" } },
        sequence: [
          {
            after: 1800,
            actors: { lico: { carry: false, inspect: true, mossStudy: "spread" } },
            items: [transplantedMoss(), usedCloth(), returnBasket()],
          },
          {
            after: 3600,
            actors: { lico: { x: 25, bottom: 64, inspect: false, mossStudy: "write" } },
            items: [transplantedMoss(), bedNotebook(), usedCloth(), returnBasket()],
          },
        ],
      },
      {
        at: 6,
        finishBeforeAdvance: true,
        actors: { finn: { carry: false, inspect: true, left: true } },
        sequence: [
          {
            after: 900,
            items: [transplantedMoss(), bedNotebook(), returnBasket(true), usedCloth()],
          },
          { after: 1700, actors: { finn: { inspect: false, carry: true } } },
        ],
      },
      returnBasketHandoff,
      {
        at: 10,
        extras: [npc("keeper", undefined, 27, "explain", true), npc("worker", undefined, 74)],
      },
      {
        at: 15,
        background: "patient-room",
        night: false,
        cast: [actor("mira", 53)],
        items: [table(64), onTable("teacup", 64, 3), ground("doctor-satchel", 43, 14, 6.4)],
        extras: [npc("keeper", "患者", 75, "explain", true), npc("doctor", "町の医者", 28)],
      },
      {
        at: 18,
        extras: [npc("keeper", "患者", 75), npc("doctor", "町の医者", 28, "explain", true)],
      },
      {
        at: 22,
        background: "village-house",
        finishBeforeAdvance: true,
        actors: { mira: { mossCare: "hold", left: true } },
        items: [bedBag()],
        extras: [{ ...npc("doctor", "町の医者", 28), doctorBag: "nod" }],
        sequence: [
          { after: 800, extras: [{ ...npc("doctor", "町の医者", 28), doctorBag: "grasp" }] },
          { after: 1500, extras: [{ ...npc("doctor", "町の医者", 28), doctorBag: "lift" }] },
          { after: 2200, extras: [{ ...npc("doctor", "町の医者", 28), doctorBag: "hold" }] },
        ],
      },
      {
        at: 23,
        actors: { mira: { mossCare: "hold" } },
        extras: [{ ...npc("doctor", "町の医者", 28, "explain", true), doctorBag: "hold" }],
      },
    ],
  ),
};
