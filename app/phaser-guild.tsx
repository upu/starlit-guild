"use client";
import { useEffect, useRef, useState } from "react";
import type { GuildFrame } from "./phaser/guild-painter";
import type { createGuildGame } from "./phaser/guild-game";
function useGuildCanvas(input: GuildFrame) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(input);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading"),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    latest.current = input;
  }, [input]);
  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    let disposed = false,
      game: ReturnType<typeof createGuildGame> | undefined;
    const observer = new ResizeObserver(() => {
      game?.resize(parent.clientWidth, parent.clientHeight);
    });
    observer.observe(parent);
    void Promise.all([import("phaser"), import("./phaser/guild-game")])
      .then(([{ default: Phaser }, { createGuildGame }]) => {
        if (!disposed)
          game = createGuildGame(
            parent,
            {
              read: () => latest.current,
              status: (value) => {
                if (!disposed) setStatus(value);
              },
            },
            Phaser,
          );
      })
      .catch(() => {
        if (!disposed) setStatus("error");
      });
    return () => {
      disposed = true;
      observer.disconnect();
      game?.destroy();
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
export function PhaserGuild(input: GuildFrame) {
  const { host, status, restart } = useGuildCanvas(input);
  return (
    <>
      <div
        ref={host}
        className="guild-canvas"
        data-renderer="phaser"
        data-status={status}
        aria-hidden="true"
      />
      {status !== "ready" && (
        <div className="guild-loading" role="status">
          {status === "error" ? <button onClick={restart}>景色を読み直す</button> : "景色を支度中…"}
        </div>
      )}
    </>
  );
}
