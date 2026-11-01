import { useCallback, useState } from "react";
import { mossBedsBanterCue } from "@/lib/chapter-four-banter";
import { licoRecordsBanterCue, merrillSingingLine } from "@/lib/chapter-four-battle-banter";
import type { TravellerId } from "@/lib/road-view";
import type { StoryLine } from "@/lib/stories";
import type { PhoneFrameModel } from "./phone-game-types";
import type { Squad } from "@/lib/game";

const members = ["aria", "leon", "mira", "finn", "lico"];
export function useGardenDialogue(model: PhoneFrameModel, retained?: Squad | null) {
  const [line, setLine] = useState<{ key: string; value?: StoryLine; patient?: TravellerId }>();
  const run = model.run ?? retained?.run;
  const key =
    run && ["brekka-moss-beds", "lico-records", "merrill-seedlings"].includes(run.quest)
      ? `${model.squad.id}:${run.quest}:${String(run.started)}`
      : "";
  const smokeTarget =
    run?.quest === "lico-records"
      ? (run.events.find(
          (event) =>
            event.kind === "move" &&
            event.text === "リコのしびれ煙で一時的に麻痺" &&
            members.includes(event.target ?? ""),
        )?.target as TravellerId | undefined)
      : undefined;
  const onLine = useCallback(
    (value: StoryLine | undefined) => {
      setLine((previous) => ({
        key,
        value,
        patient: (previous?.key === key ? previous.patient : undefined) ?? smokeTarget,
      }));
    },
    [key, smokeTarget],
  );
  const visible = line?.key === key ? line.value : undefined;
  return {
    key,
    onLine,
    moss: visible ? mossBedsBanterCue(visible) : ("water" as const),
    records: {
      cue: licoRecordsBanterCue(visible),
      patient: (line?.key === key ? line.patient : undefined) ?? smokeTarget,
    },
    merrillSinging: merrillSingingLine(visible),
  };
}
