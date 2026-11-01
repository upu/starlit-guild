"use client";
import { useCallback, useState } from "react";
import type { PhoneFrameModel } from "./phone-game-types";
import type { Squad } from "@/lib/game";
import type { StoryLine } from "@/lib/stories";
import { nightBridgeWheelCue, restorationBanterCue } from "@/lib/chapter-three-banter";
import { restorationHandoffState } from "@/lib/restoration-handoff";
import { mossTrailNoteCue } from "@/lib/chapter-four-banter";

type HandoffQuest =
  | "berne-restoration"
  | "keystone-night-road"
  | "linde-requests"
  | "lantern-detour"
  | "brekka-arrival"
  | "glowing-moss-trail"
  | "glowing-moss-trail-next-day"
  | "lico-records"
  | "merrill-seedlings"
  | "town-deliveries"
  | "tower-moss-removal"
  | "missing-keystone"
  | "forest-wetland"
  | "old-waterway"
  | "starlit-guild-founding";

function useMarkKey(key: string, setKey: (value: string) => void) {
  return useCallback(() => {
    if (key) setKey(key);
  }, [key, setKey]);
}

/** Render-only handoff: completion is already saved when this waits. */
export function useRestorationHandoff(
  model: PhoneFrameModel,
  enabled: boolean,
  quest: HandoffQuest = "berne-restoration",
) {
  const [snapshot, setSnapshot] = useState<Squad | null>(null);
  const [finished, setFinished] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<string | null>(null);
  const [wheel, setWheel] = useState<string | null>(null);
  const [recordsClosingKey, setRecordsClosingKey] = useState<string | null>(null);
  const [trailNote, setTrailNote] = useState<{ key: string; visible: boolean }>(),
    [dialogue, setDialogue] = useState<{
      key: string;
      cue: ReturnType<typeof restorationBanterCue>;
    }>();
  const { capture, key, waiting, completed, active, candidate, recordsSquad } =
    restorationHandoffState({
      ...model,
      enabled,
      quest,
      snapshot,
      finished,
      skipped,
    });
  if (capture) setSnapshot(model.squad);
  const finish = useMarkKey(key, setFinished);
  const finishRecordsDialogue = useMarkKey(key, setRecordsClosingKey);
  const skip = useCallback(() => {
    if (key) {
      setSkipped(key);
      setFinished(key);
    }
  }, [key]);
  const line = useCallback(
    (value: StoryLine | undefined) => {
      setDialogue({ key, cue: restorationBanterCue(value) });
      if (quest === "keystone-night-road" && nightBridgeWheelCue(value)) setWheel(key);
      if (quest === "glowing-moss-trail") setTrailNote({ key, visible: mossTrailNoteCue(value) });
    },
    [key, quest],
  );
  return {
    quest,
    active,
    waiting,
    completed,
    squad: active ? candidate : null,
    recordsSquad,
    dialogue: dialogue?.key === key ? dialogue.cue : ("pending" as const),
    finish,
    finishRecordsDialogue,
    // Keep the final seated view underneath the completion sheet until the
    // handoff ends; removing it as soon as `waiting` clears flashes the battle.
    recordsClosing: active && !!key && recordsClosingKey === key,
    skip,
    skipped: !!key && skipped === key,
    nightWheel: !!key && wheel === key,
    mossTrailNote: !!key && trailNote?.key === key && trailNote.visible,
    line,
  };
}
