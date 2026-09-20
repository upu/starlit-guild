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
import { roadPresentation } from "@/lib/scrolling-presentation";
import type { RoadStageId } from "@/lib/scrolling-stages";

function snapshot(state: RoadBattle) {
  return {
    ...state,
    heroes: state.heroes.map((hero) => ({ ...hero })),
    loadout: { ...state.loadout },
  };
}

export function useRoadBattle() {
  const state = useRef(createRoadBattle());
  const clock = useRef({ at: 0, active: false, frozen: 0 });
  const [view, setView] = useState(createRoadBattle);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const refresh = useCallback(() => {
    setView(snapshot(state.current));
  }, []);
  const read = useCallback(
    () =>
      roadPresentation(
        state.current,
        clock.current.active
          ? Math.max(0, performance.now() - clock.current.at)
          : clock.current.frozen,
      ),
    [],
  );
  const assist = useCallback(() => {
    if (!paused && status === "ready") {
      assistRoadBattle(state.current);
      refresh();
    }
  }, [paused, status, refresh]);
  useEffect(() => {
    if (paused || status !== "ready") return;
    let last = performance.now() - clock.current.frozen,
      paintedAt = last;
    clock.current = { at: last, active: true, frozen: 0 };
    const timer = setInterval(() => {
      const now = performance.now();
      advanceRoadBattle(state.current, now - last);
      last = now;
      clock.current.at = now;
      if (now - paintedAt >= 200) {
        refresh();
        paintedAt = now;
      }
    }, 50);
    return () => {
      clock.current.frozen = Math.max(0, performance.now() - clock.current.at);
      clock.current.active = false;
      clearInterval(timer);
    };
  }, [paused, status, refresh]);
  const equip = (loadout: Loadout) => {
    state.current.loadout = { ...loadout };
    refresh();
  };
  const selectStage = (stage: RoadStageId) => {
    state.current = createRoadBattle(state.current.loadout, stage);
    clock.current.frozen = 0;
    refresh();
  };
  const restart = () => {
    selectStage(state.current.stage);
  };
  return { view, paused, setPaused, status, setStatus, read, assist, equip, restart, selectStage };
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
