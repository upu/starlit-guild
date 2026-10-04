"use client";
import { useEffect, useState } from "react";
import { teaStudy } from "@/lib/home-tea-study";
export function useTeaPlayer() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [still, setStill] = useState(false);
  const [guides, setGuides] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      setStill(media.matches);
      if (media.matches) setPlaying(false);
    };
    change();
    media.addEventListener("change", change);
    const hide = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      media.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  useEffect(() => {
    if (!playing || still) return;
    let last = performance.now(),
      frame: number;
    const tick = (now: number) => {
      const elapsed = Math.min(now - last, 100) * (slow ? 0.5 : 1);
      last = now;
      setTime((t) => (t + elapsed) % teaStudy.duration);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [playing, slow, still]);
  const select = (next: number) => {
    setPlaying(false);
    setTime((next + teaStudy.duration) % teaStudy.duration);
  };
  const reduce = (value: boolean) => {
    setStill(value);
    setPlaying(false);
  };
  return { time, playing, setPlaying, slow, setSlow, still, reduce, guides, setGuides, select };
}
