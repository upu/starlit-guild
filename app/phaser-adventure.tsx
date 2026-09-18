"use client";
import { useEffect, useRef, useState } from "react";
import type { Action } from "@/lib/game";
import type { AdventureInput } from "@/lib/adventure-presentation";
import { rendererSession, type RendererStatus } from "./phaser/renderer-session";

type Props = {
  input: AdventureInput;
  onAction: (action: Action) => void;
};

const loadAdventureGame: Parameters<typeof rendererSession>[2] = async () => {
  const [{ default: Phaser }, { createAdventureGame }] = await Promise.all([
    import("phaser"),
    import("./phaser/adventure-game"),
  ]);
  return (parent, bridge) => createAdventureGame(parent, bridge, Phaser);
};

function usePhaserSession({ input, onAction }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ input, onAction, receivedAt: 0 });
  const session = useRef<ReturnType<typeof rendererSession> | null>(null);
  const [status, setStatus] = useState<RendererStatus>("loading"),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    latest.current = { input, onAction, receivedAt: performance.now() };
    session.current?.setPaused(input.paused || !input.ready || document.hidden);
  }, [input, onAction]);
  useEffect(() => {
    if (!host.current) return;
    const active = rendererSession(
      host.current,
      {
        read: () => {
          const { input, receivedAt } = latest.current;
          return { ...input, now: input.now + Math.max(0, performance.now() - receivedAt) };
        },
        act: (action) => {
          latest.current.onAction(action);
        },
        status: setStatus,
      },
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

export function PhaserAdventure({ input, onAction }: Props) {
  const { host, status, restart } = usePhaserSession({ input, onAction });
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
