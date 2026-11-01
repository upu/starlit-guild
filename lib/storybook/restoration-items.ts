import type { StageItem, StageExtra } from "../story-stage-cues.ts";
export function restorationItem(i: StageItem, extras: StageExtra[] = []): StageItem {
  const paper = restorationPaper(i);
  if (paper) return paper;
  if (i.art === "medicine-closed") return { ...i, width: 5.2 };
  if (i.art === "chair")
    return { ...i, width: 8.5, seatFor: undefined, x: i.x + (i.left ? 1.5 : -1.5) };
  if (i.id === "passing-cart")
    return {
      ...i,
      x: -14.3,
      bottom: (extras.find((e) => e.id === "stone-carrier")?.bottom ?? 8) + 9.5,
      wrist: false,
    };
  if (i.id === "carried-fence")
    return {
      ...i,
      x: -3.9,
      bottom: (extras.find((e) => e.id === "fence-carrier")?.bottom ?? -16) + 4.5,
      wrist: false,
    };
  return i;
}

function restorationPaper(i: StageItem): StageItem | undefined {
  if (i.id === "shipping-record") return { ...i, wrist: true, wristAnchor: "bottom", width: 3.5 };
  if (i.art === "paper" && i.support) return { ...i, pitch: 55 };
  if (i.id === "replacement-record" && (i.actor || i.extra))
    return { ...i, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" };
  if (i.id === "groove-plan")
    return { ...i, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom", width: 5 };
  return undefined;
}
