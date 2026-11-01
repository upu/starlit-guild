import type { StageActor, StageItem } from "../story-stage-cues.ts";

export function circuitActor(a: StageActor, after: number): StageActor {
  if (a.id === "leon") return leonAtPaper(a, after);
  if (a.id === "lico" && after >= 8500 && after < 10600) return { ...a, left: false };
  if (a.id === "finn" && after >= 6900 && after < 8000)
    return { ...a, left: false, pose: "offer", wristPoints: { ...a.wristPoints, 25: [98, 81] } };
  return a;
}
function leonAtPaper(a: StageActor, after: number): StageActor {
  let target = a;
  if (after >= 4200 && after < 7800)
    target = { ...a, x: 43.59375, bottom: -1.11328125, left: false };
  if (after >= 7800 && after < 11400)
    target = { ...a, x: 90.8515625, bottom: 12.88671875, left: true };
  if (after >= 11400 && after < 15100) target = returnToDesk(a, after);
  if (after >= 15100)
    target = {
      ...target,
      lane: undefined,
      via: [
        { x: 26, bottom: 21.77403846153846 },
        { x: 26, bottom: 14 },
      ],
    };
  if (!target.carry) return target;
  // Register the painted waist hold rather than the old atlas's higher hand.
  return {
    ...target,
    x: target.x + ((target.left ? 1 : -1) * 2 * 19) / 128,
    bottom: (target.bottom ?? 14) + ((4 * 19) / 128) * 1.5,
    wristPoints: { ...target.wristPoints, 14: [82, 76], 15: [82, 76], 16: [82, 76] },
  };
}
function returnToDesk(a: StageActor, after: number): StageActor {
  const target: StageActor = {
    ...a,
    x: 31.92578125,
    bottom: 20.88341346153846,
    left: false,
    reachOver: "table",
    reachApproach: 6,
    lane: undefined,
    via:
      after < 14400
        ? [
            { x: 91, bottom: -18 },
            { x: 18, bottom: -18 },
            { x: 18, bottom: 20.88341346153846 },
          ]
        : undefined,
  };
  return after >= 14400 ? { ...target, x: 31.62890625, bottom: 21.77403846153846 } : target;
}
export function circuitItem(i: StageItem, after: number): StageItem {
  if (i.id !== "ledger") return i;
  if (!i.actor) return i.support === "table" ? { ...i, x: after >= 14900 ? 50 : 37 } : i;
  const edge: Partial<Record<StageActor["id"], number>> = {
    aria: 2.69921875,
    leon: 2.69921875,
    mira: 1.66015625,
    finn: 1.66015625,
    lico: 2.76953125,
  };
  const lift: Partial<Record<StageActor["id"], number>> = { leon: -0.890625, lico: 0.4453125 };
  return {
    ...i,
    wristOffset: { x: edge[i.actor] ?? 0, bottom: lift[i.actor] ?? 0 },
    grip: paperTurned(i.actor, after) ? "offering" : "receiving",
  };
}
function paperTurned(owner: StageActor["id"], after: number) {
  return (owner === "finn" && after >= 6900) || (owner === "lico" && after >= 8500);
}
