import { actor, ground, held } from "./story-stage-later-shared.ts";
import { lowSeat } from "./story-stage-low-seats.ts";

export const bedRails = () => [
  { ...ground("work-fence", 65, 46, 12), id: "bed-rail-left" },
  { ...ground("work-fence", 85, 46, 12), id: "bed-rail-right" },
];
export const bedLabel = (shaded = false) => ({
  ...ground("plant-label", 10, 40, 2.8),
  id: "bed-label",
  shaded,
});
export const bedBread = () => ground("bread", 82, 29, 5.5);
export const bedNotebook = (owner: "lico" | "aria" = "lico", x = 4) =>
  held("closed-ledger", owner, {
    id: "ledger",
    width: 5,
    x,
    bottom: 22,
    embeddedFrames: owner === "lico" ? [68, 69, 70, 71, 72, 73, 74, 75] : undefined,
  });
export const bedBag = (owner: "mira" | "aria" = "mira") =>
  held("doctor-satchel", owner, {
    id: "medicine",
    width: 6.4,
    x: -5.5,
    bottom: 17,
    embeddedFrames: owner === "mira" ? [68, 69, 70, 71] : undefined,
    ...(owner === "aria" ? { wrist: true, wristAnchor: "top" as const } : {}),
  });
export const bedSeats = () => [
  { ...ground("step-stool", 70, 14, 7.2), id: "lico-stool", seatFor: "lico" as const },
  lowSeat(actor("mira", 92, { bottom: 12, left: true }), "step-stool", 24),
];
export const bedItems = (shaded = false) => [bedLabel(shaded), bedBread(), bedNotebook(), bedBag()];
