"use client";
import { useEffect, useRef, useState } from "react";
import type { Action } from "@/lib/game";
import type { AdventureInput } from "@/lib/adventure-presentation";
import {
  rendererSession,
  type AdventureBridge,
  type RendererStatus,
  type LindeProgress,
  type TownActivity,
} from "./phaser/renderer-session";
import { storybookAdventureInput } from "@/lib/storybook/adventure";

type Props = {
  input: AdventureInput;
  onAction: (action: Action) => void;
  onStatusChange?: (status: RendererStatus) => void;
  onVisualComplete?: (quest: string) => void;
  onNightPushFrame?: (frame: number | null) => void;
  onLindeProgress?: (progress: LindeProgress) => void;
  onTownActivity?: (activity: TownActivity) => void;
};

const loadAdventureGame: Parameters<typeof rendererSession>[2] = async () => {
  const [{ default: Phaser }, { createAdventureGame }] = await Promise.all([
    import("phaser"),
    import("./phaser/adventure-game"),
  ]);
  return (parent, bridge) => createAdventureGame(parent, bridge, Phaser);
};

type Latest = Pick<
  Props,
  | "input"
  | "onAction"
  | "onVisualComplete"
  | "onNightPushFrame"
  | "onLindeProgress"
  | "onTownActivity"
> & {
  receivedAt: number;
};
function sessionBridge(
  latest: { current: Latest },
  status: AdventureBridge["status"],
): AdventureBridge {
  return {
    read: () => {
      const { input, receivedAt } = latest.current;
      const elapsed = input.paused ? 0 : Math.max(0, performance.now() - receivedAt);
      return { ...input, now: input.now + elapsed };
    },
    act: (action) => {
      latest.current.onAction(action);
    },
    status,
    visualComplete: (quest) => {
      latest.current.onVisualComplete?.(quest);
    },
    nightPushFrame: (frame) => {
      latest.current.onNightPushFrame?.(frame);
    },
    lindeProgress: (progress) => latest.current.onLindeProgress?.(progress),
    townActivity: (activity) => latest.current.onTownActivity?.(activity),
  };
}

function usePhaserSession(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ ...props, receivedAt: 0 });
  const session = useRef<ReturnType<typeof rendererSession> | null>(null);
  const [status, setStatus] = useState<RendererStatus>("loading"),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    latest.current = { ...props, receivedAt: performance.now() };
    session.current?.setPaused(props.input.paused || !props.input.ready || document.hidden);
  }, [props]);
  useEffect(() => {
    if (!host.current) return;
    const active = rendererSession(
      host.current,
      sessionBridge(latest, setStatus),
      loadAdventureGame,
    );
    session.current = active;
    const resize = () => {
      if (host.current) active.resize(host.current.clientWidth, host.current.clientHeight);
    };
    const visibility = () => {
      active.setPaused(
        document.hidden || latest.current.input.paused || !latest.current.input.ready,
      );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host.current);
    resize();
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      active.destroy();
      session.current = null;
    };
  }, [retry]);
  return {
    host,
    status,
    restart: () => {
      setStatus("loading");
      setRetry((value) => value + 1);
    },
  };
}

export function PhaserAdventure({
  input,
  onAction,
  onStatusChange,
  onVisualComplete,
  onNightPushFrame,
  onLindeProgress,
  onTownActivity,
}: Props) {
  const { host, status, restart } = usePhaserSession({
    input: storybookAdventureInput(input),
    onAction,
    onVisualComplete,
    onNightPushFrame,
    onLindeProgress,
    onTownActivity,
  });
  useEffect(() => {
    onStatusChange?.(status);
  }, [onStatusChange, status]);
  return (
    <>
      <div
        ref={host}
        className="phaser-canvas"
        data-renderer="phaser"
        data-status={status}
        aria-hidden="true"
      />
      {status !== "ready" && (
        <div className="phaser-loading" role="status">
          <span>
            {status === "error" ? "冒険の景色を読み込めませんでした。" : "冒険の景色を支度中…"}
          </span>
          {status === "error" && <button onClick={restart}>もう一度読み込む</button>}
        </div>
      )}
    </>
  );
}
