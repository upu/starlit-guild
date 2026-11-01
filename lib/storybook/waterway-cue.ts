import type { StageItem, StoryStageCue } from "../story-stage-cues.ts";
import { nightStudyCue } from "./night-cue.ts";
import { waterwayNotesCue } from "./waterway-notes-cue.ts";

const marker: StageItem = {
  id: "waterway-marker",
  art: "stone",
  x: 61.3,
  bottom: 14,
  width: 3,
  travelMs: 400,
};
const markerInHand: StageItem = {
  ...marker,
  x: 0,
  bottom: 0,
  actor: "leon",
  wrist: true,
  wristAnchor: "bottom",
};

/** Inspect the drain from its dry bank, then return to the route notes. */
export function waterwayStudyCue(cue: StoryStageCue, line: number): StoryStageCue {
  const held = nightStudyCue(cue);
  const registered = {
    ...held,
    actors: held.actors.map((actor) =>
      actor.id === "leon" && line < 3 ? { ...actor, routeNotes: "read" as const } : actor,
    ),
    items: [...(held.items ?? []), ...(line >= 4 ? [marker] : [])],
    extras: held.extras?.map((extra) => ({ ...extra, x: 53, bottom: 44 })),
  };
  if (line === 3) return waterwayCallCue(registered);
  if (line === 18) return waterwayNotesCue(registered);
  if (line < 7 || line >= 18) return registered;
  return {
    ...registered,
    actors: registered.actors.map((actor) => ({
      ...actor,
      x: actor.id === "aria" ? 83 : 68,
      bottom: actor.id === "aria" ? 50 : 47,
      left: false,
      via: line === 7 && actor.id === "aria" ? [{ x: 69, bottom: 24 }] : undefined,
    })),
  };
}

function waterwayCallCue(registered: StoryStageCue): StoryStageCue {
  const actors = (routeNotes?: "read" | "fold" | "pocket", action?: "lower" | "mark" | "call") =>
    registered.actors.map((actor) => {
      if (actor.id !== "leon") return actor;
      return {
        ...actor,
        routeNotes,
        ...(action === "lower" ? { seatTransition: "lower" as const } : {}),
        ...(action === "mark"
          ? {
              inspect: true,
              wristPoints: { ...actor.wristPoints, 13: [87, 110] as [number, number] },
            }
          : {}),
        ...(action === "call" ? { pose: "offer" as const, left: true } : {}),
      };
    });
  // The keeper waits outside the camera, then walks along the dry path.
  const waiting = registered.extras?.map((extra) =>
    extra.id === "keeper" ? { ...extra, x: -1, bottom: 26 } : extra,
  );
  const arriving = registered.extras?.map((extra) =>
    extra.id === "keeper" ? { ...extra, via: [{ x: 43, bottom: 26 }] } : extra,
  );
  const state = { items: registered.items ?? [], extras: waiting };
  const withMarker = { ...state, items: [...state.items, marker] };
  return {
    ...registered,
    actors: actors("read"),
    extras: waiting,
    finishBeforeAdvance: true,
    sequence: [
      { ...state, after: 450, actors: actors("fold") },
      { ...state, after: 900, actors: actors("pocket") },
      { ...state, after: 1400, actors: actors(undefined, "lower") },
      {
        ...state,
        items: [...state.items, markerInHand],
        after: 1650,
        actors: actors(undefined, "mark"),
      },
      { ...withMarker, after: 2300, actors: actors(undefined, "mark") },
      { ...withMarker, after: 2950, actors: actors(undefined, "lower") },
      { ...withMarker, after: 3200, actors: actors(undefined, "call") },
      { ...withMarker, extras: arriving, after: 4050, actors: actors() },
    ],
  };
}

/** The removed logs are painted on the upper-left bank of the cleared view. */
export function clearedWaterwayCue(cue: StoryStageCue): StoryStageCue {
  const placeTools = (items: StoryStageCue["items"]) =>
    items?.map((item) => (item.art === "tools" ? { ...item, x: 28, bottom: 72, width: 8 } : item));
  const faceWorkers = (extras: StoryStageCue["extras"]) =>
    extras?.map((extra) => (extra.id === "worker" ? { ...extra, left: true } : extra));
  return {
    ...cue,
    items: placeTools(cue.items),
    extras: faceWorkers(cue.extras),
    sequence: cue.sequence?.map((beat) => ({
      ...beat,
      items: placeTools(beat.items) ?? [],
      extras: faceWorkers(beat.extras),
    })),
  };
}
