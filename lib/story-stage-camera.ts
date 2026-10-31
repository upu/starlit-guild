import { RPG_CAMERA_SCALE } from "./rpg-camera.ts";
import type { StageActor, StageItem, StoryStageCue } from "./story-stage-cues.ts";

// Pulling the camera back exposes more of the ground plane. Extend entrances and
// exits beyond that larger frame, including their props, rather than fading in mid-road.
export function stageCameraCue(cue: StoryStageCue): StoryStageCue {
  const cameraScale = cue.cameraScale ?? (cue.background === "hill-path" ? 0.46 : RPG_CAMERA_SCALE);
  const margin = Math.ceil(50 / cameraScale - 30);
  const outside = (x: number) => (x < 0 ? x - margin : x > 100 ? x + margin : x);
  const actorX = (value: StageActor, x: number) => (value.insideCamera ? x : outside(x));
  const actor = (value: StageActor): StageActor => ({ ...value, x: actorX(value, value.x) });
  const item = (value: StageItem): StageItem =>
    value.actor || value.extra || value.carrier ? value : { ...value, x: outside(value.x) };
  return {
    ...cue,
    cameraScale,
    actors: cue.actors.map(actor),
    initial: Object.fromEntries(
      cue.actors.map((value) => [
        value.id,
        actorX(value, cue.initial?.[value.id] ?? (value.id === "aria" ? -10 : 56)),
      ]),
    ),
    cartX: cue.cartX === undefined ? undefined : outside(cue.cartX),
    extras: cue.extras?.map((extra) => ({
      ...extra,
      x: extra.insideCamera ? extra.x : outside(extra.x),
    })),
    items: cue.items?.map(item),
    sequence: cue.sequence?.map((moment) => ({
      ...moment,
      actors: moment.actors.map(actor),
      items: moment.items.map(item),
      extras: moment.extras?.map((extra) => ({
        ...extra,
        x: extra.insideCamera ? extra.x : outside(extra.x),
      })),
    })),
  };
}
