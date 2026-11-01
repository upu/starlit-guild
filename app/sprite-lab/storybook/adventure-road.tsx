"use client";
import { useState } from "react";
import type { Action, State } from "@/lib/game";
import type { LindeProgress, RendererStatus } from "../../phaser/renderer-session";
import { PhaserAdventure } from "../../phaser-adventure";
import { nightBridgeAssets } from "@/lib/road-night-bridge";
import { restorationAssets } from "@/lib/road-berne-restoration";
import { lindeDeliveryAssets } from "@/lib/road-linde-delivery";
import { lanternRoadAssets } from "@/lib/road-lantern-layout";
import { mossTrailAssets } from "@/lib/road-moss-trail";
import { mossBedsAssets } from "@/lib/road-moss-beds";
type Props = {
  state: State | null;
  replay: number;
  quest: string;
  fullParty: boolean;
  painted: boolean;
  paused: boolean;
  onAction: (action: Action) => void;
  onStatusChange: (status: RendererStatus) => void;
  onVisualComplete?: (quest: string) => void;
  onLindeProgress?: (progress: LindeProgress) => void;
  restorationDialogue?: "pending" | "guide" | "root" | "plan" | "other";
  nightWheel?: boolean;
  mossTrailNote?: boolean;
  gameComplete?: boolean;
};
function studyBackground(painted: boolean, quest: string) {
  if (!painted) return {};
  const bank: Record<string, string> = {
    "keystone-night-road": nightBridgeAssets.bank,
    "berne-restoration": restorationAssets.bank,
    "linde-requests": lindeDeliveryAssets.bank,
    "lantern-detour": lanternRoadAssets.bank,
    "brekka-arrival": "/storybook-study/brekka-homes-v1.png",
    "starlit-guild-founding": "/storybook-study/founding-return-path-v1.png",
    "glowing-moss-trail": mossTrailAssets.bank,
    "glowing-moss-trail-next-day": mossTrailAssets.bank,
    "brekka-moss-beds": mossBedsAssets.bank,
  };
  return bank[quest] ? { backgroundOverride: bank[quest] } : {};
}
export function StudyRoad({
  state,
  replay,
  quest,
  fullParty,
  painted,
  paused,
  onAction,
  onStatusChange,
  onVisualComplete,
  onLindeProgress,
  restorationDialogue,
  nightWheel,
  mossTrailNote,
  gameComplete,
}: Props) {
  const [pushFrame, setPushFrame] = useState<number | null>(null);
  return (
    <div className="storybook-adventure">
      {quest === "keystone-night-road" && pushFrame !== null && (
        <output className="night-push-frame">押し姿勢 {pushFrame}</output>
      )}
      {state && (
        <PhaserAdventure
          key={replay}
          input={{
            squad: state.squads[0],
            startQuest: quest,
            now: state.updatedAt,
            ready: true,
            paused,
            townFinalizing:
              quest === "town-deliveries" && painted && !!gameComplete && !!state.squads[0].run,
            mossFinalizing:
              quest === "tower-moss-removal" && painted && !!gameComplete && !!state.squads[0].run,
            questComplete: [
              "brekka-arrival",
              "glowing-moss-trail",
              "glowing-moss-trail-next-day",
              "starlit-guild-founding",
            ].includes(quest)
              ? !!gameComplete
              : !!state.done[quest],
            restorationDialogue,
            nightWheel,
            mossTrailNote,
            ...studyBackground(painted, quest),
            storybookHeroes: studyPaintedChoice(painted, fullParty, quest),
          }}
          onAction={onAction}
          onStatusChange={onStatusChange}
          onVisualComplete={onVisualComplete}
          onLindeProgress={onLindeProgress}
          onNightPushFrame={quest === "keystone-night-road" ? setPushFrame : undefined}
        />
      )}
    </div>
  );
}
function studyPaintedChoice(painted: boolean, fullParty: boolean, quest: string) {
  if (!painted) return false;
  if (
    [
      "spinning-signpost",
      "begging-golem",
      "sweet-blockade",
      "hilltop-picnic",
      "medicine-packing",
      "tower-restoration",
      "tower-moss-removal",
      "keystone-night-road",
      "berne-restoration",
      "linde-requests",
      "lantern-detour",
      "brekka-arrival",
      "starlit-guild-founding",
      "glowing-moss-trail",
      "glowing-moss-trail-next-day",
      "brekka-moss-beds",
    ].includes(quest)
  )
    return true;
  return fullParty ||
    [
      "medicine-road-home",
      "tower-road",
      "moss-night-road",
      "village-trade",
      "evening-trade-road",
    ].includes(quest)
    ? true
    : undefined;
}
