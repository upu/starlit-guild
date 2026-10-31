import type { LaterStage } from "./story-stage-later-shared.ts";
import { licoRecordsStages } from "./story-stage-lico-records.ts";
import { mossBedsDeparture, mossBedsReturn } from "./story-stage-moss-beds.ts";

export const licoStages: Record<string, LaterStage> = {
  "brekka-moss-beds-departure": mossBedsDeparture,
  "brekka-moss-beds-return": mossBedsReturn,
  ...licoRecordsStages,
};
