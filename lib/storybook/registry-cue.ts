import type {
  StageActor,
  StageExtra,
  StageItem,
  StageMoment,
  StoryStageCue,
} from "../story-stage-cues.ts";

/** The hut uses separate seats and documents so hands can reach over the same tabletop. */
export function registryStudyCue(cue: StoryStageCue): StoryStageCue {
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    actors: s.actors.map((a) => registryActor(a, s.items ?? [])),
    extras: s.extras?.map(registryExtra),
    items: [...(s.items ?? []).map(registryItem), ...chairs()],
  });
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance: !!cue.sequence?.length || cue.actors.some((a) => !!a.via?.length),
    sequence: registrySequence(cue.sequence?.map((s) => ({ ...s, ...adjust(s) }))),
  };
}
function registryActor(a: StageActor, items: StageItem[]): StageActor {
  if (a.id === "finn") return finnRegistryActor(a, items);
  const floors: Partial<Record<StageActor["id"], [number, number]>> = {
    aria: [22, 20],
    leon: [39, 17],
    mira: [59, 10],
  };
  const floor = floors[a.id];
  return floor ? { ...a, x: floor[0], bottom: floor[1] } : a;
}
function finnRegistryActor(a: StageActor, items: StageItem[]): StageActor {
  const holding = items.some((i) => i.actor === "finn"),
    placing = a.x === 74.5,
    returning = a.x === 74.625;
  return {
    ...a,
    ...(placing ? { bottom: 38.7 } : returning ? { x: 77.25, bottom: 36.1875 } : {}),
    carry: holding,
    reachOver: holding && (placing || returning) ? "table" : undefined,
    pose: holding ? registryFinnPose(placing, returning) : a.pose,
    holdingWalk: holding,
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      ...a.wristPoints,
      0: [80, 90],
      3: [80, 90],
      4: [84, 74],
      5: [80, 90],
      14: [80, 74],
      15: [98, 70],
      16: [98.5, 92],
      8: [80, 74],
      9: [80, 74],
      22: [80, 74],
      23: [80, 74],
    },
  };
}
function registryExtra(e: StageExtra): StageExtra {
  if (e.id !== "keeper" && e.id !== "merchant") return e;
  return {
    ...e,
    ...(e.id === "merchant" ? { x: 64.5, bottom: 39, name: "商人" } : { bottom: 44 }),
    wristPoints: { ...e.wristPoints, 16: [98, 80], 17: [83, 91], 18: [83, 91], 19: [83, 91] },
    ...(e.deskWork ? { handOver: { item: "table", rect: registryArm(e) } } : {}),
  };
}

function registryFinnPose(placing: boolean, returning: boolean): StageActor["pose"] {
  if (placing) return "tease";
  return returning ? "think" : "idle";
}
function registryItem(i: StageItem): StageItem {
  if (i.actor === "finn")
    return {
      ...i,
      width: 4.2,
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: "bottom",
      support: "table",
    };
  if (i.extra === "merchant")
    return { ...i, width: 4.2, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom" };
  if (i.id === "records") return { ...i, bottom: 51, pitch: 40 };
  if (i.id === "orders") return { ...i, width: 4.2, x: 68.03125, bottom: 48.825, pitch: 55 };
  if (i.id === "order-copy")
    return { ...i, x: i.x === 49 ? 54 : i.x, bottom: i.x === 49 ? 50.5 : 51.5, pitch: 55 };
  return i;
}
function chairs(): StageItem[] {
  return [
    { id: "registry-keeper-chair", art: "chair", x: 40, bottom: 46, width: 8.5 },
    { id: "registry-merchant-chair", art: "chair", x: 65.5, bottom: 41, width: 8.5, left: true },
  ];
}

function registryArm(e: StageExtra): [number, number, number, number] {
  if (e.deskWork === "reach") return [e.left ? 24 : 62, 62, 42, 22];
  return e.deskWork === "write" ? [70, 55, 26, 37] : [40, 60, 48, 24];
}

function registrySequence(sequence?: StageMoment[]): StageMoment[] | undefined {
  if (!sequence?.some((s) => s.after === 7000)) return sequence;
  const table = sequence.find((s) => s.after === 2200),
    pickup = sequence.find((s) => s.after === 2800);
  if (!table || !pickup) return sequence;
  return sequence.flatMap((s) => {
    if (s.after === 2800)
      return [
        { ...s, items: table.items },
        { ...s, after: 3500 },
      ];
    if (s.after === 4100)
      return [
        {
          ...s,
          items: pickup.items,
          actors: s.actors.map((a) =>
            a.id === "finn" ? (pickup.actors.find((p) => p.id === "finn") ?? a) : a,
          ),
        },
        { ...s, after: 4400 },
      ];
    return [s];
  });
}
