"use client";
import { useEffect } from "react";

export function gameViewportHeight(
  innerHeight: number,
  visualHeight: number | undefined,
  keyboard: boolean,
) {
  return keyboard ? (visualHeight ?? innerHeight) : undefined;
}

// Let CSS dynamic viewport units size the normal frame. Installed WebKit apps
// can report an innerHeight that is shorter by the safe area; only override the
// frame while the software keyboard is actually open.
export function useGameViewport() {
  useEffect(() => {
    const root = document.documentElement,
      viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      if (viewport && Math.abs(viewport.scale - 1) > 0.01) return; // Preserve pinch zoom.
      const editable = document.activeElement?.matches('input,textarea,[contenteditable="true"]');
      const keyboard = !!editable && !!viewport && viewport.height < window.innerHeight - 100;
      const height = gameViewportHeight(window.innerHeight, viewport?.height, keyboard);
      if (height === undefined) {
        root.style.removeProperty("--game-height");
        root.style.removeProperty("--game-top");
      } else {
        root.style.setProperty("--game-height", `${String(Math.round(height))}px`);
        root.style.setProperty("--game-top", `${String(viewport?.offsetTop || 0)}px`);
      }
      root.classList.toggle("game-keyboard-open", keyboard);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("pageshow", schedule);
    document.addEventListener("visibilitychange", schedule);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      document.removeEventListener("visibilitychange", schedule);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      root.style.removeProperty("--game-height");
      root.style.removeProperty("--game-top");
      root.classList.remove("game-keyboard-open");
    };
  }, []);
}
