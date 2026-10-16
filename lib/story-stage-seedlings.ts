import { transplantDeparture } from "./story-stage-transplant.ts";
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
const visitor = (
  pose: "idle" | "explain" | "point" | "wave" = "idle",
  x = 73,
  name = "緑髪の少女",
) => npc("merrill", name, x, pose);
const seedlings = () => ground("seedlings", 50, 34, 16);
export const seedlingStages: Record<string, LaterStage> = {
  "merrill-seedlings-departure": scene("moss-beds", quintet(), [
    { at: 0, items: [seedlings(), held("ledger", "lico")] },
    { at: 1, actors: { aria: { reaction: "surprise" } } },
    { at: 2, extras: [visitor()] },
    { at: 3, extras: [visitor("explain")] },
    { at: 10, actors: { lico: { reaction: "surprise", pose: "surprise" } } },
    { at: 12, actors: { lico: { pose: "offer", x: 77 } } },
  ]),
  "merrill-seedlings-return": scene("moss-beds", quintet(), [
    { at: 0, items: [seedlings()], extras: [visitor()] },
    { at: 1, extras: [visitor("explain")] },
    { at: 8, actors: { aria: { reaction: "surprise" } } },
    { at: 10, items: [seedlings(), held("moss", "lico")] },
    { at: 17, extras: [visitor("explain")] },
    { at: 23, items: [seedlings(), held("ledger", "lico")] },
    {
      at: 29,
      items: [seedlings(), ground("moss", 76, 40, 7), ground("ledger", 70, 44, 7)],
      actors: { lico: { pose: "offer" } },
    },
    { at: 30, extras: [visitor("explain", 73, "メリル")] },
    {
      at: 34,
      items: [seedlings(), { ...ground("pot", 4, 44, 9), extra: "merrill" }],
      extras: [{ ...visitor("idle", 73, "メリル"), carry: true }],
    },
    { at: 37, actors: { aria: { reaction: "surprise" } } },
    {
      at: 40,
      extras: [{ ...visitor("idle", 112, "メリル"), carry: true }],
      items: [seedlings(), { ...ground("pot", 4, 44, 9), extra: "merrill" }],
    },
  ]),
  "moss-transplant-departure": transplantDeparture,
  "moss-transplant-return": scene("new-moss-beds", quintet(), [
    {
      at: 0,
      night: true,
      actors: { lico: { inspect: true } },
      items: [ground("seedlings", 76, 15, 14), held("cloth", "aria")],
    },
    { at: 3, items: [ground("seedlings", 76, 15, 14), held("ledger", "lico")] },
    {
      at: 6,
      actors: { finn: { carry: true } },
      items: [ground("seedlings", 76, 15, 14), held("ledger", "lico"), held("basket", "finn")],
    },
    {
      at: 9,
      background: "tower-foot",
      actors: {
        aria: { inspect: true },
        leon: { carry: true },
        lico: { inspect: false },
        finn: { visible: false },
      },
      items: [held("basket", "leon"), ground("tools", 31)],
      extras: [npc("keeper", undefined, 27), npc("worker", undefined, 74)],
    },
    {
      at: 10,
      extras: [npc("keeper", undefined, 27, "explain", true), npc("worker", undefined, 74)],
    },
    {
      at: 15,
      background: "patient-room",
      night: false,
      cast: [actor("mira", 53)],
      items: [table(64), onTable("tea", 64), ground("medicine", 43)],
      extras: [npc("keeper", "患者", 75, "explain", true), npc("doctor", "町の医者", 28)],
    },
    { at: 18, extras: [npc("keeper", "患者", 75), npc("doctor", "町の医者", 28, "explain", true)] },
    {
      at: 22,
      background: "village-house",
      items: [held("medicine", "mira")],
      extras: [npc("doctor", "町の医者", 28)],
    },
    { at: 23, extras: [npc("doctor", "町の医者", 28, "explain", true)] },
  ]),
};
