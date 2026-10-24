import { actor, ground, held, npc } from "./story-stage-later-shared.ts";
import type { StageItem, StageExtra } from "./story-stage-cues.ts";
import { bedBag, bedLabel, bedRails, bedSeats } from "./story-stage-moss-bed-items.ts";

export const recordsFieldCast = () => [
  actor("aria", 28, { bottom: 38, left: true }),
  actor("leon", 50, { bottom: 25, left: false }),
  actor("mira", 28, { bottom: 8, left: false, mossCare: "hold" }),
  actor("finn", 47, { bottom: -5, left: false }),
  actor("lico", 70, { bottom: 12, left: true, seated: true, stool: true, recordStudy: "read" }),
];
export const fieldFurniture = () => [bedLabel(), ...bedRails(), ...bedSeats()];
export const fieldKeeper = (extra: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("keeper", "管理人", 79),
  bottom: 16,
  left: true,
  ...extra,
});
export const device = (active = false): StageItem => ({
  ...ground(active ? "reflector" : "reflector-covered", 43, 45, 12),
  id: "reflector",
  glow: active ? "bright" : undefined,
});
export const tray = (x = 80): StageItem => ({ ...ground("sample-dish", x, 15, 6), id: "samples" });
export const dryBoard = (): StageItem => ({ ...ground("lap-board", 62, 2, 10), id: "lap-board" });
export const notebook = (closed = false): StageItem =>
  held(closed ? "closed-ledger" : "ledger", "lico", {
    id: "lico-book",
    x: 0,
    bottom: 26.5,
    width: 6,
    embeddedFrames: closed ? [68, 69, 70, 71, 72, 73, 74, 75, 79] : undefined,
  });
export const fieldCopy = (): StageItem =>
  held("folded-paper", "finn", { id: "order-copy", x: 4, bottom: 23, width: 3.5 });
export const fieldRecord = (owner: "keeper" | "lico" | "leon" = "keeper"): StageItem =>
  owner === "keeper"
    ? { ...ground("record-board", -3, 29, 7), id: "records", extra: "keeper", embeddedFrames: [14] }
    : held("record-board", owner, {
        id: "records",
        x: owner === "leon" ? -4 : 4,
        bottom: 26,
        width: 7,
      });
export const kit = (active = false): StageItem[] => [
  bedBag(),
  device(active),
  tray(),
  dryBoard(),
  fieldCopy(),
];
export const basket = (carried = true): StageItem =>
  carried
    ? held("basket", "aria", { id: "basket", width: 8, x: 4, bottom: 19 })
    : { ...ground("basket", 24, 35, 8), id: "basket" };
export const smoke = (dissipating = false): StageItem[] => [
  { ...ground("low-smoke", 43, 40, 20), id: "smoke-source", dissipating },
  { ...ground("low-smoke", 47, 25, 55), id: "low-smoke", dissipating },
];
export const lap = (): StageItem[] => [
  held("lap-board", "lico", { id: "lap-board", x: 0, width: 10, bottom: 23.5 }),
  { ...notebook(), x: 2.6, width: 4.8, bottom: 26.5, support: "lap-board" },
  held("ledger", "lico", {
    id: "records",
    x: -2.6,
    width: 4.8,
    bottom: 26.5,
    support: "lap-board",
  }),
];
export const quietKit = (): StageItem[] => [
  bedBag(),
  { ...device(), art: "reflector-down" },
  { ...ground("reflector-cover-flat", 35, 41, 7), id: "reflector-cover" },
  tray(76),
];
