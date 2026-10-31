import type { StageActor, StoryStageCue } from "@/lib/story-stage-cues";

const palms: Partial<Record<StageActor["id"], [number, number]>> = {
  leon: [80, 72],
  mira: [82, 81],
  lico: [81, 83],
};

function paperHands(actor: StageActor, after = 0): StageActor {
  if (actor.id === "finn" && after >= 5700 && after < 8000)
    return {
      ...actor,
      pose: "offer",
      left: after < 7200,
      wristPoints: { 29: [91, 81], 25: [98, 81] },
    };
  if (actor.id !== "aria") {
    const palm = palms[actor.id];
    if (actor.id === "mira")
      return {
        ...actor,
        carryWalkFrames: [8, 9, 22, 23],
        wristPoints: {
          14: palm,
          15: palm,
          8: [84, 77],
          9: [84, 77],
          22: [84, 77],
          23: [84, 77],
        },
      };
    if (actor.id === "leon")
      return {
        ...actor,
        wristPoints: {
          14: palms.leon,
          15: palms.leon,
          8: [87, 69],
          9: [87, 69],
          22: [87, 69],
          23: [87, 69],
        },
      };
    return palm
      ? {
          ...actor,
          nameAbove: actor.id === "lico" || actor.nameAbove,
          wristPoints: { 14: palm, 15: palm },
        }
      : actor;
  }
  return {
    ...actor,
    nameAbove: true,
    wristPoints: {
      8: [83, 73],
      9: [83, 73],
      22: [83, 73],
      23: [83, 73],
      14: [79, 76],
      15: [79, 76],
    },
  };
}

export function paintedPaperHands(cue: StoryStageCue): StoryStageCue {
  const sequence = [...(cue.sequence ?? [])];
  for (const after of [5700, 8000]) {
    const previous = sequence.filter((step) => step.after < after).at(-1);
    if (previous) sequence.push({ ...previous, after });
    sequence.sort((a, b) => a.after - b.after);
  }
  return {
    ...cue,
    actors: cue.actors.map((actor) => paperHands(actor)),
    sequence: sequence.map((step) => ({
      ...step,
      actors: step.actors.map((actor) => paperHands(actor, step.after)),
      items: step.items.map((item) =>
        item.id === "ledger" && item.support === "table"
          ? { ...item, x: 45 }
          : item.id === "ledger" && item.actor === "leon"
            ? { ...item, wristOffset: undefined }
            : item,
      ),
    })),
  };
}
