"use client";
import { useEffect, useRef, useState } from "react";
import type { HomeFrame, HomeBridge, createHomeRoom } from "./phaser/home-room-game";
export function useHomeRoom(
  frame: HomeFrame,
  callbacks: Pick<HomeBridge, "select" | "place" | "use">,
) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ frame, callbacks });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("仲間たちが、思い思いに過ごしています。");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    latest.current = { frame, callbacks };
  }, [frame, callbacks]);
  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    let disposed = false,
      room: ReturnType<typeof createHomeRoom> | undefined;
    void Promise.all([import("phaser"), import("./phaser/home-room-game")])
      .then(([{ default: Phaser }, { createHomeRoom }]) => {
        if (disposed) return;
        room = createHomeRoom(
          parent,
          {
            read: () => latest.current.frame,
            status: (value) => {
              if (!disposed) setStatus(value);
            },
            message: (value) => {
              if (!disposed) setMessage(value);
            },
            select: (id) => {
              latest.current.callbacks.select(id);
            },
            place: (item) => {
              latest.current.callbacks.place(item);
            },
            use: (id) => {
              latest.current.callbacks.use(id);
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
      room?.destroy();
    };
  }, [attempt]);
  const retry = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };
  return { host, status, message, retry };
}
