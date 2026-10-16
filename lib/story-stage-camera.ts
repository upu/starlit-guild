import { RPG_CAMERA_SCALE } from "./rpg-camera.ts";
import type { StageActor, StageItem, StoryStageCue } from "./story-stage-cues.ts";

// Pulling the camera back exposes more of the ground plane. Extend entrances and
// exits beyond that larger frame, including their props, rather than fading in mid-road.
export function stageCameraCue(cue: StoryStageCue): StoryStageCue {
  const margin = Math.ceil(50 / (cue.cameraScale ?? RPG_CAMERA_SCALE) - 30);
  const outside = (x: number) => (x < 0 ? x - margin : x > 100 ? x + margin : x);
  const actor = (value: StageActor): StageActor => ({ ...value, x: outside(value.x) });
  const item = (value: StageItem): StageItem =>
    value.actor || value.extra ? value : { ...value, x: outside(value.x) };
  return {
    ...cue,
    actors: cue.actors.map(actor),
    initial: Object.fromEntries(
      cue.actors.map(({ id }) => [id, outside(cue.initial?.[id] ?? (id === "aria" ? -10 : 56))]),
    ),
    cartX: cue.cartX === undefined ? undefined : outside(cue.cartX),
    extras: cue.extras?.map((extra) => ({ ...extra, x: outside(extra.x) })),
    items: cue.items?.map(item),
    sequence: cue.sequence?.map((moment) => ({
      ...moment,
      actors: moment.actors.map(actor),
      items: moment.items.map(item),
    })),
  };
}
