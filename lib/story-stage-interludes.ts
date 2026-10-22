import { walnutLunch } from "./story-stage-picnic.ts";
import { walnutTasting } from "./story-stage-walnut-tasting.ts";
import type { LaterStage } from "./story-stage-later-shared.ts";
export const interludeStages: Record<string, LaterStage> = {
  "interlude-promised-walnuts": walnutTasting,
  "interlude-walnut-lunch": walnutLunch,
};
