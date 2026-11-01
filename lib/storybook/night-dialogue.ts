import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { nightStudyCue } from "./night-cue.ts";

/** The jar changes hands only after the two registered palms meet. */
export function nightDialogueCue(cue: StoryStageCue, id: string, line: number): StoryStageCue {
  const arranged =
    id === "moss-night-road-return"
      ? returnInteraction(cue, line)
      : line === 15
        ? shoulderWrap(cue)
        : cue;
  return {
    ...nightStudyCue(arranged),
    sequence: arranged.sequence?.map((step) => {
      const painted = nightStudyCue({ ...arranged, ...step, sequence: undefined });
      return {
        ...step,
        actors: painted.actors,
        items: painted.items ?? [],
        extras: step.extras ?? cue.extras,
      };
    }),
  };
}

function closeActors(cue: StoryStageCue): StageActor[] {
  // Aria's shawl palm (86,76) meets Leon's free lantern palm (87,69).
  const pixel = (cue.cell ?? 24) / 128;
  return cue.actors.map((actor) =>
    actor.id === "aria"
      ? { ...actor, x: 57 - 45 * pixel, bottom: 14 + 7 * pixel * 1.5, left: false, carry: true }
      : { ...actor, x: 57, bottom: 14, left: true },
  );
}

function returnInteraction(cue: StoryStageCue, line: number): StoryStageCue {
  if (line < 3 || line > 18) return cue;
  const actors = closeActors(cue);
  if (line !== 18)
    return {
      ...cue,
      actors: actors.map((actor) =>
        actor.id === "aria" && line === 12 ? { ...actor, left: true } : actor,
      ),
    };
  const items = (owner: "aria" | "leon") =>
    (cue.items ?? []).map((item): StageItem =>
      item.art === "moss-jar" ? { ...item, actor: owner, travelMs: 250 } : item,
    );
  return {
    ...cue,
    actors,
    items: items("leon"),
    finishBeforeAdvance: true,
    sequence: [{ after: 900, actors, items: items("aria"), extras: cue.extras }],
  };
}

function shoulderWrap(cue: StoryStageCue): StoryStageCue {
  const actors = (wrapped: boolean) =>
    cue.actors.map((actor): StageActor =>
      actor.id === "aria"
        ? { ...actor, shawl: wrapped }
        : { ...actor, x: 45, bottom: 20, left: true, pose: "offer" },
    );
  const cloth: StageItem = {
    id: "shoulder-cloth",
    art: "packing-cloth",
    actor: "leon",
    x: 0,
    bottom: 0,
    width: 5,
    wrist: true,
    wristAnchor: "bottom",
  };
  return {
    ...cue,
    actors: actors(false),
    finishBeforeAdvance: true,
    items: [...(cue.items ?? []), cloth],
    sequence: [{ after: 1400, actors: actors(true), items: cue.items ?? [], extras: cue.extras }],
  };
}
