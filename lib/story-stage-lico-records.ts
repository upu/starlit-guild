import { scene, type LaterStage } from "./story-stage-later-shared.ts";
import { registryBeats, registryCast } from "./story-stage-records-registry.ts";
import { recordsFieldBeats } from "./story-stage-records-field.ts";
import { fieldFurniture, recordsFieldCast } from "./story-stage-records-field-items.ts";
import { recordsReturnBeats } from "./story-stage-records-return.ts";

export const licoRecordsStages: Record<string, LaterStage> = {
  "lico-records-departure": scene(
    "registry",
    registryCast(),
    [...registryBeats, ...recordsFieldBeats],
    { cell: 24 },
  ),
  "lico-records-return": scene(
    "moss-beds",
    recordsFieldCast().map((a) =>
      a.id === "lico"
        ? { ...a, recordStudy: "hug" }
        : a.id === "leon"
          ? { ...a, x: 61.1875, bottom: 6.9375 }
          : a.id === "aria"
            ? { ...a, carry: true }
            : a,
    ),
    recordsReturnBeats,
    { cell: 24, furniture: fieldFurniture() },
  ),
};
