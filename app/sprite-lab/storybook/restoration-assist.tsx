import { useEffect, useState } from "react";
import type { Action, State } from "@/lib/game";

export function StudyAssistControl({
  quest,
  replay,
  state,
  ready,
  onAction,
}: {
  quest: string;
  replay: number;
  state: State | null;
  ready: boolean;
  onAction: (action: Action) => void;
}) {
  if (
    ![
      "berne-restoration",
      "keystone-night-road",
      "lantern-detour",
      "brekka-arrival",
      "starlit-guild-founding",
      "moss-transplant",
    ].includes(quest)
  )
    return null;
  return (
    <RestorationAssist key={replay} running={!!state?.squads[0].run && ready} onAction={onAction} />
  );
}

/** Accelerate only this isolated study; never touches the player's saved state. */
function RestorationAssist({
  running,
  onAction,
}: {
  running: boolean;
  onAction: (action: Action) => void;
}) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!active || !running) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) onAction({ type: "assist", mode: "strike" });
    }, 50);
    return () => {
      window.clearInterval(timer);
    };
  }, [active, running, onAction]);
  return (
    <button
      disabled={!running}
      onClick={() => {
        setActive(!active);
      }}
    >
      {active && running ? "連続手助けを止める" : "連続手助けで確認"}
    </button>
  );
}
