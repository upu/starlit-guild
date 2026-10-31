import type { State } from "@/lib/game";
import { journeyBanter } from "@/lib/stories";
import { Banter } from "../../story-scenes";
import type { StoryLine } from "@/lib/stories";
import { useCallback, useState } from "react";
import {
  nightBridgeBanterContext,
  nightBridgeWheelCue,
  restorationBanterCue,
} from "@/lib/chapter-three-banter";
import { mossTrailNoteCue } from "@/lib/chapter-four-banter";

export function useRestorationDialogue() {
  const [dialogue, setDialogue] = useState<ReturnType<typeof restorationBanterCue> | "pending">(
    "pending",
  );
  const [visualFinished, setVisualFinished] = useState(false);
  const [nightWheel, setNightWheel] = useState(false);
  const [mossTrailNote, setMossTrailNote] = useState(false);
  const onVisualComplete = useCallback((id: string) => {
    if (
      [
        "berne-restoration",
        "lantern-detour",
        "brekka-arrival",
        "glowing-moss-trail",
        "glowing-moss-trail-next-day",
        "starlit-guild-founding",
        "town-deliveries",
        "tower-moss-removal",
      ].includes(id)
    )
      setVisualFinished(true);
  }, []);
  const onCurrentLine = useCallback((line: StoryLine | undefined) => {
    setDialogue(restorationBanterCue(line));
    setMossTrailNote(mossTrailNoteCue(line));
    if (nightBridgeWheelCue(line)) setNightWheel(true);
  }, []);
  const resetDialogue = () => {
    setDialogue("pending");
    setVisualFinished(false);
    setNightWheel(false);
    setMossTrailNote(false);
  };
  return {
    dialogue,
    nightWheel,
    mossTrailNote,
    onCurrentLine,
    resetDialogue,
    visualFinished,
    onVisualComplete,
  };
}

export function StudyBanter({
  quest,
  state,
  replay,
  paused,
  onCurrentLine,
}: {
  quest: string;
  state: State | null;
  replay: number;
  paused: boolean;
  onCurrentLine: (line: StoryLine | undefined) => void;
}) {
  if (!(
    [
      "berne-restoration",
      "keystone-night-road",
      "glowing-moss-trail",
      "glowing-moss-trail-next-day",
    ].includes(quest) && state?.squads[0].run
  ))
    return null;
  const restoration = quest === "berne-restoration";
  return (
    <Banter
      key={`${quest}:${String(replay)}`}
      lines={journeyBanter(state, state.squads[0], state.updatedAt)}
      context={nightBridgeBanterContext(state.squads[0].run) ?? undefined}
      paused={paused}
      retain={restoration}
      onCurrentLine={onCurrentLine}
    />
  );
}
