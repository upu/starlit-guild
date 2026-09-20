"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  advanceRoadBattle,
  assistRoadBattle,
  createRoadBattle,
  type Loadout,
  type RoadBattle,
} from "@/lib/scrolling-battle";
import type { RoadBridge } from "./road-renderer";

function snapshot(state: RoadBattle) {
  return {
    ...state,
    heroes: state.heroes.map((hero) => ({ ...hero })),
    loadout: { ...state.loadout },
  };
}

export function useRoadBattle() {
  const state = useRef(createRoadBattle());
  const [view, setView] = useState(createRoadBattle);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const refresh = useCallback(() => {
    setView(snapshot(state.current));
  }, []);
  const read = useCallback(() => state.current, []);
  const assist = useCallback(() => {
    if (!paused && status === "ready") {
      assistRoadBattle(state.current);
      refresh();
    }
  }, [paused, status, refresh]);
  useEffect(() => {
    if (paused || status !== "ready") return;
    let last = performance.now(),
      paintedAt = last;
    const timer = setInterval(() => {
      const now = performance.now();
      advanceRoadBattle(state.current, now - last);
      last = now;
      if (now - paintedAt >= 200) {
        refresh();
        paintedAt = now;
      }
    }, 50);
    return () => {
      clearInterval(timer);
    };
  }, [paused, status, refresh]);
  const equip = (loadout: Loadout) => {
    state.current.loadout = { ...loadout };
    refresh();
  };
  const restart = () => {
    state.current = createRoadBattle(state.current.loadout);
    refresh();
  };
  return { view, paused, setPaused, status, setStatus, read, assist, equip, restart };
}

export function useRoadCanvas(bridge: RoadBridge, retry: number) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(bridge);
  useEffect(() => {
    latest.current = bridge;
  }, [bridge]);
  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    let disposed = false;
    let destroy: (() => void) | undefined;
    void Promise.all([import("phaser"), import("./road-renderer")])
      .then(([{ default: engine }, module]) => {
        if (disposed) return;
        destroy = module.createRoadRenderer(
          parent,
          {
            read: () => latest.current.read(),
            assist: () => {
              latest.current.assist();
            },
            status: (value) => {
              if (!disposed) latest.current.status(value);
            },
          },
          engine,
        );
      })
      .catch((error: unknown) => {
        console.error("Road preview renderer failed", error);
        if (!disposed) latest.current.status("error");
      });
    return () => {
      disposed = true;
      destroy?.();
    };
  }, [retry]);
  return host;
}
