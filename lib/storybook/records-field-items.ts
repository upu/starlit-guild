import type { StageActor, StageItem } from "../story-stage-cues.ts";

export function recordsFieldItems(
  items: StageItem[],
  actors: StageActor[],
  returning: boolean,
  line: number,
) {
  const lico = actors.find((a) => a.id === "lico");
  const leavingBook = !returning && (lico?.mossStudy === "reach" || lico?.x === 54);
  return items.map((i) => fieldItem(i, items, leavingBook, returning, line));
}
function fieldItem(
  i: StageItem,
  items: StageItem[],
  leavingBook: boolean,
  returning: boolean,
  line: number,
): StageItem {
  if (i.id === "lico-book" && leavingBook)
    return {
      ...i,
      art: "closed-ledger",
      actor: undefined,
      x: 72.5,
      bottom: 16,
      width: 3.2,
      wrist: false,
      embeddedFrames: undefined,
      support: "lico-stool",
    };
  if (i.id === "lap-board") {
    if (returning && line >= 27)
      return { ...i, actor: undefined, wrist: false, x: 79, bottom: 4.5, width: 9.2 };
    return i.actor ? attached(i, 9.2) : { ...i, x: 55, bottom: -1.55625, width: 9.2 };
  }
  if (["lico-book", "records", "order-copy"].includes(i.id))
    return recordItem(i, items, returning, line);
  return environmentItem(i);
}
function environmentItem(i: StageItem): StageItem {
  if (i.id === "lico-stool") return { ...i, seatFor: undefined };
  if (i.id === "reflector-cover") return coverItem(i);
  if (i.id === "smoke-source") return { ...i, x: 47, bottom: 47, width: 14 };
  if (i.id === "low-smoke") return { ...i, x: 48, bottom: 31, width: 48 };
  if (i.id === "medicine")
    return {
      ...i,
      wrist: true,
      wristAnchor: "top",
      x: 0,
      bottom: 0,
      wristOffset: { x: 0, bottom: 2 },
      embeddedFrames: undefined,
    };
  if (i.id === "basket") return basketItem(i);
  return i.id === "first-seedling" ? seedlingItem(i) : i;
}
function coverItem(i: StageItem): StageItem {
  return i.actor
    ? {
        ...i,
        width: 12,
        x: 0,
        bottom: 0,
        wrist: true,
        wristAnchor: "top",
        wristOffset: { x: 0, bottom: 9.28125 },
      }
    : { ...i, width: 12, bottom: 44 };
}
function seedlingItem(i: StageItem): StageItem {
  return {
    ...i,
    width: 1.9,
    ...(i.actor ? { wristOffset: { x: 0, bottom: -0.7 } } : {}),
    ...(i.carrier ? { bottom: 4.7 } : {}),
  };
}
function basketItem(i: StageItem): StageItem {
  return i.actor
    ? {
        ...i,
        width: 7.2,
        x: 0,
        bottom: 0,
        wrist: true,
        wristAnchor: "top",
        wristOffset: { x: 0, bottom: 3.54375 },
      }
    : { ...i, width: 7.2 };
}
function recordItem(i: StageItem, items: StageItem[], returning: boolean, line: number): StageItem {
  const lap =
    i.support === "lap-board" && items.some((p) => p.id === "lap-board" && p.actor === "lico");
  if (lap) return lapRecord(i, line);
  if (i.actor || i.extra) return heldRecord(i);
  return groundRecord(i, returning, line);
}
function lapRecord(i: StageItem, line: number): StageItem {
  return {
    ...i,
    actor: undefined,
    carrier: "lap-board",
    wrist: false,
    embeddedFrames: undefined,
    x: i.id === "lico-book" ? ownBookPosition(line) : i.id === "records" ? 2 : 0,
    bottom: i.id === "order-copy" ? 1.2 : 3,
    width: i.id === "order-copy" ? 2.8 : 3.4,
  };
}
function ownBookPosition(line: number) {
  return line >= 20 ? -2.6 : -2;
}
function heldRecord(i: StageItem): StageItem {
  const width = i.id === "records" ? 4.2 : i.id === "order-copy" ? 2.8 : 3.2;
  return {
    ...attached(i, width),
    wristOffset: {
      x: i.id === "lico-book" ? -3 : 0,
      bottom: -width * 0.75 * (1 - 1 / 1.3),
    },
    embeddedFrames: i.id === "lico-book" ? [68, 79] : undefined,
  };
}
function groundRecord(i: StageItem, returning: boolean, line: number): StageItem {
  return {
    ...i,
    width: i.id === "lico-book" ? 3.2 : 4.2,
    ...(returning && line < 4 && i.id === "records" ? { x: 62.6875, bottom: 5.4 } : {}),
    ...(i.support === "lico-stool" ? { x: 68.7 } : {}),
  };
}
function attached(i: StageItem, width: number): StageItem {
  return {
    ...i,
    width,
    wrist: true,
    wristAnchor: undefined,
    x: 0,
    bottom: 0,
    wristOffset: { x: 0, bottom: -width * 0.75 * (1 - 1 / 1.3) },
    embeddedFrames: undefined,
  };
}
