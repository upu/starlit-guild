import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { waterwayHatchClosing, waitingActors, spatula } from "./waterway-hatch-closing.ts";
import { enteringTower, frontKeeper, keeperReturns } from "./waterway-front-door.ts";

/** The rear work ends before the cut to the front entrance; the later still remains untouched. */
export function waterwayCompletionCue(cue: StoryStageCue, line: number): StoryStageCue {
  if (line === 0) return waterwayHatchClosing(cue);
  if (line > 5) return cue;
  const seats = (cue.items ?? [])
    .filter((i) => i.id.startsWith("seat-"))
    .map((i) => ({ ...i, width: 7.5, bottom: 16 }));
  const tools: StageItem = { id: "tools", art: "tools", x: 24, bottom: 28, width: 9 };
  const toolOnGround: StageItem = {
    id: "spatula",
    art: "spatula",
    x: 34.625,
    bottom: 19.34375,
    width: 2.5,
    tilt: 65,
  };
  const standing = waitingActors(cue.actors);
  const seated = cue.actors.map((a): StageActor => ({
    ...a,
    x: a.id === "aria" ? 40 : 47,
    bottom: 14,
    left: false,
    seated: true,
    perch: true,
    carry: false,
    inspect: false,
    nameOffset: a.id === "aria" ? -18 : 18,
    pose: (line === 3 && a.id === "aria") || (line === 4 && a.id === "leon") ? "offer" : "idle",
  }));
  const common = {
    ...cue,
    cut: line === 1,
    initial: { aria: 32, leon: 57 },
    initialBottom: { aria: 14, leon: 14 },
    extras:
      line === 1
        ? [{ ...frontKeeper, pose: "explain" as const, speaking: true }]
        : line === 2
          ? [frontKeeper]
          : [],
  };
  if (line === 1)
    return { ...common, actors: standing, items: [tools, ...seats, ...spatula(standing)] };
  if (line !== 2) {
    const resting = { ...common, actors: seated, items: [tools, ...seats, toolOnGround] };
    return line === 5 ? keeperReturns(resting) : resting;
  }
  return frontSeating(
    { ...common, actors: standing, items: [tools, ...seats, toolOnGround] },
    standing,
    seated,
    toolOnGround,
  );
}

function frontSeating(
  cue: StoryStageCue,
  standing: StageActor[],
  seated: StageActor[],
  toolOnGround: StageItem,
): StoryStageCue {
  const furniture = (cue.items ?? []).filter((i) => i.id !== "spatula");
  const heldTool = spatula(standing)[0];
  const low = standing.map((a): StageActor =>
    a.id === "aria" ? { ...a, carry: false, holdingWalk: false, inspect: true } : a,
  );
  const rested = standing.map((a): StageActor => ({ ...a, carry: false, holdingWalk: false }));
  const approaching = seated.map((a) => ({ ...a, seated: false }));
  const phase = (seatTransition: StageActor["seatTransition"]) =>
    approaching.map((a) => ({ ...a, seatTransition }));
  const state = (after: number, actors: StageActor[], tool: StageItem) => ({
    after,
    actors,
    items: [...furniture, tool],
    ...enteringTower(after),
  });
  return {
    ...cue,
    actors: standing,
    items: [...furniture, heldTool],
    finishBeforeAdvance: true,
    sequence: [
      state(350, low, heldTool),
      state(800, low, toolOnGround),
      state(1250, rested, toolOnGround),
      state(1450, approaching, toolOnGround),
      state(2200, phase("lower"), toolOnGround),
      state(2600, phase("settle"), toolOnGround),
      state(2900, seated, toolOnGround),
    ],
  };
}
