"use client";
import { useEffect, useRef } from "react";

export function useStoryScroll(page: number, compact: boolean, viewHistory: boolean) {
  const dialogue = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = dialogue.current;
    if (element) element.scrollTo({ top: compact && !viewHistory ? 0 : element.scrollHeight });
  }, [page, compact, viewHistory]);
  return dialogue;
}
