import { PhaserAdventure } from "./phaser-adventure";
import { restorationVisualInput } from "@/lib/restoration-visual-input";
import type { AdventureInput } from "@/lib/adventure-presentation";
import type { Action } from "@/lib/game";
import type { useRestorationHandoff } from "./use-restoration-handoff";
import type { LindeProgress, RendererStatus, TownActivity } from "./phaser/renderer-session";

export function RestorationMapRenderer({
  input,
  onAction,
  restoration,
  onLindeProgress,
  onTownActivity,
  onStatusChange,
}: {
  input: AdventureInput;
  onAction: (action: Action) => void;
  restoration?: ReturnType<typeof useRestorationHandoff>;
  onLindeProgress?: (progress: LindeProgress) => void;
  onTownActivity?: (activity: TownActivity) => void;
  onStatusChange?: (status: RendererStatus) => void;
}) {
  const visual = restorationVisualInput(input, restoration);
  return (
    <PhaserAdventure
      input={visual}
      onAction={restoration?.waiting ? () => {} : onAction}
      onLindeProgress={onLindeProgress}
      onTownActivity={onTownActivity}
      onVisualComplete={restoration?.active ? restoration.finish : undefined}
      onStatusChange={(status) => {
        onStatusChange?.(status);
        if (status === "error" && restoration?.active) restoration.finish();
      }}
    />
  );
}
