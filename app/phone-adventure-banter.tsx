import { consumableNotice } from "@/lib/consumable-effects";
import { journeyBanter } from "@/lib/stories";
import {
  chapterFourBattleBanter,
  licoRecordsBanterMinimum,
  licoRecordsBanterContext,
  licoRecordsEncounterStopped,
  licoRecordsRetainedBanter,
  licoRecordsPatientBanter,
  licoRecordsLineAvailable,
  merrillBanterContext,
} from "@/lib/chapter-four-battle-banter";
import { pumpetyBattleBanter } from "@/lib/pumpety-battle-banter";
import { nightBridgeBanterContext } from "@/lib/chapter-three-banter";
import { Banter } from "./story-scenes";
import { useCallback } from "react";
import type { PhoneFrameModel } from "./phone-game-types";
import type { useRestorationHandoff } from "./use-restoration-handoff";
import type { StoryLine } from "@/lib/stories";
import { seedlingHandoffNotice } from "./phone-restoration-mode";
import { townActivitySquad, type TownActivity } from "@/lib/road-town-activity";

export function AdventureBanter({
  model: m,
  restoration,
  visualLoading = false,
  onCurrentLine,
  recordsPatient,
  townActivity,
}: {
  model: PhoneFrameModel;
  restoration: ReturnType<typeof useRestorationHandoff>;
  visualLoading?: boolean;
  onCurrentLine?: (line: StoryLine | undefined) => void;
  recordsPatient?: string;
  townActivity?: TownActivity | null;
}) {
  const notice = consumableNotice(m.state, m.clock);
  const { active, line: handoffLine, waiting, quest } = restoration;
  const recordsActive = isRecordsActive(restoration),
    recordsWaiting = waiting && recordsActive;
  const canShowLine = useRecordsLineFilter(m, restoration, recordsActive, recordsPatient);
  const reportLine = useCallback(
    (line: StoryLine | undefined) => {
      if (active) handoffLine(line);
      onCurrentLine?.(line);
    },
    [active, handoffLine, onCurrentLine],
  );
  // The return scene is still pending; a camp exchange would describe another place.
  if (returnScenePending(m, waiting)) return null;
  const transition = transitionNotice(restoration, !!m.run);
  if (transition)
    return (
      <div className="phone-banter">
        <p>{transition}</p>
      </div>
    );
  const lines = adventureLines(m, restoration, recordsWaiting, recordsPatient, townActivity);
  const { context, preserveInterrupted } = battleContexts(m, restoration);
  if (!lines.length && !recordsWaiting)
    return (
      <div className="phone-banter">
        <p role={notice ? "status" : undefined}>{notice || m.quote}</p>
      </div>
    );
  return (
    <Banter
      key={banterIdentity(m, restoration)}
      lines={lines}
      context={context}
      preserveInterrupted={preserveInterrupted}
      notice={notice}
      retain={retainsBanter(m, (active && quest === "berne-restoration") || recordsWaiting)}
      paused={banterPaused(m, visualLoading, restoration.waiting)}
      concealed={visualLoading}
      onCurrentLine={reportLine}
      onComplete={recordsWaiting ? restoration.finishRecordsDialogue : undefined}
      minimumDuration={recordsActive ? licoRecordsBanterMinimum : undefined}
      canShowLine={canShowLine}
    />
  );
}
function returnScenePending(model: PhoneFrameModel, waiting: boolean) {
  return !!model.ending && !model.run && !waiting;
}
function transitionNotice(restoration: ReturnType<typeof useRestorationHandoff>, running: boolean) {
  const seedlings = seedlingHandoffNotice(
    restoration.quest,
    restoration.active,
    restoration.waiting,
    running,
  );
  if (seedlings) return seedlings;
  if (!restoration.waiting || restoration.quest !== "lico-records" || !restoration.recordsClosing)
    return undefined;
  return Object.values(restoration.squad?.run?.health ?? {}).some((health) => health.hp <= 0)
    ? "煙が晴れ、みんなは少し休んでから荷物を拾い直す。"
    : undefined;
}
function useRecordsLineFilter(
  model: PhoneFrameModel,
  restoration: ReturnType<typeof useRestorationHandoff>,
  active: boolean,
  patient?: string,
) {
  const run = model.run?.quest === "lico-records" ? model.run : (restoration.squad?.run ?? null);
  return useCallback(
    (line: StoryLine, history: StoryLine[]) =>
      !active || licoRecordsLineAvailable(line, run, history, patient, model.clock),
    [active, run, patient, model.clock],
  );
}
function battleContexts(
  model: PhoneFrameModel,
  restoration: ReturnType<typeof useRestorationHandoff>,
) {
  const run = model.run ?? restoration.squad?.run ?? null;
  const merrill = merrillBanterContext(run);
  return {
    context: merrill ?? licoRecordsBanterContext(run) ?? nightBridgeBanterContext(run) ?? undefined,
    preserveInterrupted: !!merrill && merrill !== "merrill-stopped",
  };
}
function isRecordsActive(restoration: ReturnType<typeof useRestorationHandoff>) {
  return restoration.active && restoration.quest === "lico-records";
}
function adventureLines(
  model: PhoneFrameModel,
  restoration: ReturnType<typeof useRestorationHandoff>,
  recordsWaiting: boolean,
  patient?: string,
  townActivity?: TownActivity | null,
) {
  if (recordsWaiting) {
    return licoRecordsRetainedBanter(restoration.squad?.run ?? null, patient);
  }
  if (licoRecordsEncounterStopped(model.run)) return [];
  const townSquad = restoration.waiting && restoration.squad ? restoration.squad : model.squad;
  const visualTown = townActivitySquad(townSquad, townActivity);
  if (visualTown) return journeyBanter(model.state, visualTown, model.clock);
  const lines =
    restoration.waiting && restoration.squad
      ? journeyBanter(model.state, restoration.squad, model.clock)
      : model.banter;
  return model.run?.quest === "lico-records" ? licoRecordsPatientBanter(lines, patient) : lines;
}
function banterPaused(model: PhoneFrameModel, visualLoading: boolean, waiting: boolean) {
  return visualLoading || !!model.sheet || (!!model.ending && !waiting) || !model.ready;
}
function retainsBanter(model: PhoneFrameModel, restoration: boolean) {
  return (
    restoration ||
    (!!model.run && !!(chapterFourBattleBanter(model.run) || pumpetyBattleBanter(model.run)))
  );
}
function banterIdentity(
  model: PhoneFrameModel,
  restoration: ReturnType<typeof useRestorationHandoff>,
) {
  return (
    (model.game.profile?.id || "") +
    ":" +
    model.squad.id +
    ":" +
    (restoration.squad?.run?.quest || model.run?.quest || "idle")
  );
}
