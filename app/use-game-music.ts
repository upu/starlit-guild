"use client";
import { useEffect, useRef, useState } from "react";
import {
  GameMusic,
  MUSIC_KEY,
  defaultMusic,
  parseMusic,
  type MusicScene,
  type MusicPreferences,
} from "@/lib/music";

export function useGameMusic(scene: MusicScene, ready: boolean) {
  const [preferences, setPreferences] = useState<MusicPreferences>(defaultMusic),
    [error, setError] = useState("");
  const engine = useRef<GameMusic | null>(null);
  const current = useRef({ scene, ready, preferences });
  useEffect(() => {
    const music = new GameMusic(setError);
    engine.current = music;
    const configure = () => {
      const c = current.current;
      music.configure(c.scene, c.ready && document.visibilityState === "visible", c.preferences);
    };
    const applyStored = () => {
      let p = defaultMusic;
      try {
        p = parseMusic(localStorage.getItem(MUSIC_KEY));
      } catch {
        /* Use defaults when preference storage is unavailable. */
      }
      current.current = { ...current.current, preferences: p };
      setPreferences(p);
      configure();
    };
    const gesture = (event: Event) => {
      if (event instanceof KeyboardEvent && !["Enter", " "].includes(event.key)) return;
      music.unlock();
    };
    const storage = (event: StorageEvent) => {
      if (event.key === MUSIC_KEY) applyStored();
    };
    const hidden = () => {
      music.configure(current.current.scene, false, current.current.preferences);
    };
    applyStored();
    window.addEventListener("pointerdown", gesture);
    window.addEventListener("keydown", gesture);
    window.addEventListener("storage", storage);
    window.addEventListener("pagehide", hidden);
    document.addEventListener("visibilitychange", configure);
    return () => {
      window.removeEventListener("pointerdown", gesture);
      window.removeEventListener("keydown", gesture);
      window.removeEventListener("storage", storage);
      window.removeEventListener("pagehide", hidden);
      document.removeEventListener("visibilitychange", configure);
      music.dispose();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    current.current = { scene, ready, preferences };
    engine.current?.configure(scene, ready && document.visibilityState === "visible", preferences);
  }, [scene, ready, preferences]);
  function update(p: MusicPreferences) {
    current.current = { scene, ready, preferences: p };
    setPreferences(p);
    try {
      localStorage.setItem(MUSIC_KEY, JSON.stringify(p));
    } catch {
      /* Playback works without preference storage. */
    }
    engine.current?.configure(scene, ready && document.visibilityState === "visible", p);
    engine.current?.unlock();
  }
  return {
    preferences,
    error,
    scene,
    setEnabled: (enabled: boolean) => {
      update({ ...preferences, enabled });
    },
    setVolume: (volume: number) => {
      update({ ...preferences, volume });
    },
  };
}
