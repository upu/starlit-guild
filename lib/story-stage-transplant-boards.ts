import { ground, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageItem } from "./story-stage-cues.ts";

export function spareBoards(state: "cart" | "hand" | "ground"): StageItem[] {
  return [0, 1].map((index) => {
    const base = { ...ground("lap-board", 0, 0, 13), id: `spare-board-${String(index)}` };
    if (state === "cart")
      return { ...base, carrier: "transplant-cart", x: 6 + index, bottom: 6 + index * 1.5 };
    if (state === "hand")
      return index === 0
        ? { ...base, actor: "finn", wrist: true }
        : { ...base, carrier: "spare-board-0", x: 1, bottom: 1.5 };
    return { ...base, x: 85 + index, bottom: 65 + index * 0.7, pitch: 55 };
  });
}

// Keep each physical board until it is explicitly moved; dialogue item lists
// otherwise replace the whole scene and would make the cargo vanish.
export function withTransplantBoards(beats: LaterBeat[]): LaterBeat[] {
  return beats.map((beat) => {
    if (beat.at < 16) return beat;
    const include = (items: StageItem[]) => {
      const boards: StageItem[] = [
        ...spareBoards(beat.at > 33 ? "ground" : "cart"),
        { ...ground("lap-board", -4, 9, 13), id: "wheel-board", carrier: "transplant-cart" },
      ];
      return [...items, ...boards.filter((board) => !items.some((p) => p.id === board.id))];
    };
    return {
      ...beat,
      items: beat.items && include(beat.items),
      sequence: beat.sequence?.map((step) => ({
        ...step,
        items: step.items && include(step.items),
      })),
    };
  });
}
