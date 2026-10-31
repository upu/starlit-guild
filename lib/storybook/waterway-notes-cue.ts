import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";

/** Return to dry ground, put the inspection lamp down, then reopen the map. */
export function waterwayNotesCue(cue: StoryStageCue): StoryStageCue {
  const phase = (mode: "walk" | "lamp" | "unfold" | "write"): StageActor[] =>
    cue.actors.map((actor) => {
      const leon = actor.id === "leon";
      return {
        ...actor,
        x: leon ? 57 : 43,
        bottom: 18,
        left: false,
        inspect: (mode === "lamp" && leon) || (mode === "write" && !leon),
        lanternHold: mode === "walk" && leon,
        routeNotes: leon && (mode === "unfold" || mode === "write") ? mode : undefined,
        // Pass on the open foreground, clear of Leon's feet and the stone bank.
        via:
          mode === "walk" && !leon
            ? [
                { x: 69, bottom: -3 },
                { x: 43, bottom: -3 },
              ]
            : undefined,
        wristPoints: leon ? { ...actor.wristPoints, 13: [82, 94] } : actor.wristPoints,
      };
    });
  const items = (cue.items ?? []).filter((item) => item.id !== "notes" && item.art !== "lantern");
  const lantern: StageItem = {
    id: "leon-lamp",
    art: "lantern",
    x: 61.3,
    bottom: 18,
    width: 4,
    travelMs: 400,
  };
  const state = { extras: cue.extras };
  const withLamp = [...items, lantern];
  return {
    ...cue,
    actors: phase("walk"),
    items,
    finishBeforeAdvance: true,
    sequence: [
      {
        ...state,
        after: 2900,
        actors: phase("lamp"),
        items: [
          ...items,
          { ...lantern, actor: "leon", x: 0, bottom: 0, wrist: true, wristAnchor: "top" },
        ],
      },
      { ...state, after: 3500, actors: phase("lamp"), items: withLamp },
      { ...state, after: 4200, actors: phase("unfold"), items: withLamp },
      { ...state, after: 4600, actors: phase("write"), items: withLamp },
    ],
  };
}
