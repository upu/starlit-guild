import type { StageItem, StoryStageCue } from "../story-stage-cues.ts";

export function signpostStudyCue(
  cue: StoryStageCue,
  line: number,
  departure: boolean,
): StoryStageCue {
  if (!departure) return signpostReturn(cue, line);
  const inspecting = line < 4;
  const carrier = cue.items?.find((item) => item.art === "puppet");
  const updated: StoryStageCue = {
    ...cue,
    actors: cue.actors.map((actor) => {
      if (line < 4 && actor.id === "leon") return { ...actor, x: 55 };
      return inspecting && actor.id === "aria"
        ? { ...actor, x: 41, bottom: 24, left: false }
        : actor;
    }),
    items: cue.items?.map((item) => {
      if (item.art !== "signpost") return item;
      return carrier
        ? {
            ...item,
            art: "signpost-portable",
            width: 10,
            carrier: carrier.id,
            x: 1.8,
            bottom: 2,
            behindOwner: true,
          }
        : { ...item, width: 10 };
    }),
  };
  return line === 4 ? puppetBow(updated) : updated;
}

const parcelImage = "/storybook-study/lunch-cake-parcel-v1.webp";
const emptyImage = "/storybook-study/empty-delivery-wrap-v1.webp";
function snackParcels(line: number): StageItem[] {
  return [
    {
      id: "snack-wrap",
      art: "cloth",
      image: line < 5 ? parcelImage : emptyImage,
      x: 34,
      bottom: 12,
      width: 5.6,
    },
    {
      id: "back-wrap",
      art: "cloth",
      image: line < 9 ? parcelImage : emptyImage,
      x: 43,
      bottom: 8,
      width: 5.6,
    },
  ];
}

/** Inspect the opened parcels beside the party, rather than walking through Leon to the sign. */
function signpostReturn(cue: StoryStageCue, line: number): StoryStageCue {
  const actors = cue.actors.map((actor) => {
    if (line === 0 && actor.id === "leon") return { ...actor, x: 50, bottom: 24, left: false };
    return line >= 5 && line < 8 && actor.id === "aria"
      ? { ...actor, x: 30, bottom: 14, left: false }
      : actor;
  });
  const items = [
    ...(cue.items ?? [])
      .filter((i) => !["bread", "cloth"].includes(i.art))
      .map((i) => (i.art === "signpost" ? { ...i, width: 10 } : i)),
    ...snackParcels(line),
  ];
  const result = { ...cue, actors, items };
  return line === 9 ? escapingPuppet(result) : result;
}

/** The culprit briefly becomes visible with the stolen parcel, then clears the trees. */
function escapingPuppet(cue: StoryStageCue): StoryStageCue {
  const props = cue.items ?? [];
  const puppet: StageItem = { id: "escaping-puppet", art: "puppet", x: 65, bottom: 32, width: 9 };
  const candy: StageItem = {
    id: "stolen-candy",
    art: "cake-parcel",
    image: parcelImage,
    carrier: puppet.id,
    x: -1.9,
    bottom: 5.6,
    width: 3.2,
  };
  return {
    ...cue,
    items: [...props, puppet, candy],
    finishBeforeAdvance: true,
    sequence: [
      {
        after: 300,
        actors: cue.actors,
        items: [...props, { ...puppet, x: 86, bottom: 52, travelMs: 600 }, candy],
        extras: cue.extras,
      },
      {
        after: 1100,
        actors: cue.actors,
        items: [...props, { ...puppet, x: 132, bottom: 58, travelMs: 950 }, candy],
        extras: cue.extras,
      },
      { after: 2250, actors: cue.actors, items: props, extras: cue.extras },
    ],
  };
}

function puppetBow(cue: StoryStageCue): StoryStageCue {
  const bowed = (cue.items ?? []).map((item): StageItem => {
    if (item.art === "puppet") return { ...item, figure: "bow" };
    return item.art === "signpost-portable" ? { ...item, tilt: -12 } : item;
  });
  return {
    ...cue,
    finishBeforeAdvance: true,
    sequence: [
      { after: 650, actors: cue.actors, items: bowed, extras: cue.extras },
      { after: 1500, actors: cue.actors, items: cue.items ?? [], extras: cue.extras },
    ],
  };
}
