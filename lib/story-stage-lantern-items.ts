import type { StageItem } from "./story-stage-cues.ts";
import { ground } from "./story-stage-later-shared.ts";

type WorkState = {
  lamp?: "closed" | "open" | "clean" | "returned" | "lit";
  pan?: "inside" | "leon";
  cloth?: "bag" | "aria" | "worker" | "ledge";
  oil?: "ground" | "worker" | "pouring";
  cut?: boolean;
};
export function lanternItems({
  lamp = "closed",
  pan = "inside",
  cloth = "bag",
  oil = "ground",
  cut = false,
}: WorkState = {}): StageItem[] {
  const art: StageItem["art"] = {
    closed: "stone-lantern-closed-sooty",
    open: "stone-lantern-sooty",
    clean: "stone-lantern-empty",
    returned: "stone-lantern-unlit",
    lit: "stone-lantern-closed-lit",
  }[lamp] as StageItem["art"];
  return [
    { ...ground(art, 51, 32, 17), id: "stone-lantern" },
    { ...ground("tool-rucksack", 23, 12, 8), id: "tool-bag" },
    { ...ground(cut ? "roadside-stubble" : "roadside-grass", 37, 14, 16), id: "roadside-grass" },
    {
      ...ground("oil-dish", 0.5, 11.5, 3),
      id: "oil-pan",
      ...(pan === "leon"
        ? { actor: "leon" as const, wrist: true }
        : { carrier: "stone-lantern", stored: !["open", "clean"].includes(lamp) }),
    },
    {
      ...ground("cloth", 0, 5, 3.3),
      id: "wiping-cloth",
      ...clothAttachment(cloth),
    },
    {
      ...ground("lamp-oil", 69, 39, 3.4),
      id: "lamp-oil",
      ...(oil === "ground"
        ? {}
        : { extra: "worker" as const, wrist: true, tilt: oil === "pouring" ? -55 : 0 }),
    },
  ];
}
function clothAttachment(cloth: WorkState["cloth"]): Partial<StageItem> {
  if (cloth === "bag") return { carrier: "tool-bag", stored: true };
  if (cloth === "ledge") return { x: 54.5, bottom: 39, support: "stone-lantern" };
  return {
    ...(cloth === "aria" ? { actor: "aria" as const } : { extra: "worker" as const }),
    wrist: true,
    support: "stone-lantern",
  };
}
export const finishedLanternItems = () => lanternItems({ lamp: "lit", cloth: "ledge", cut: true });
