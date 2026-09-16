"use client";
import { useCallback, useSyncExternalStore } from "react";
import { journeyHintKey, type JourneyGoal } from "@/lib/journey";
import { parseJson } from "@/lib/external-input";

const changed = "starlit-hints-changed";
const fallback = new Map<string, string>();
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(changed, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(changed, notify);
  };
}
function read(key: string) {
  if (fallback.has(key)) return fallback.get(key) ?? "[]";
  try {
    return localStorage.getItem(key) || "[]";
  } catch {
    return "[]";
  }
}
export function parseHintEntries(raw: string): string[] {
  try {
    const value = parseJson(raw);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}
const serverSnapshot = () => "[]";

// Hint acknowledgements belong to this device and adventure, separate from game saves.
export function useJourneyHints(profileId: string | undefined, goal: JourneyGoal) {
  const key = profileId
    ? "starlit-journey-hints-v1:" + profileId
    : "starlit-journey-hints-v1:unassigned";
  const snapshot = useCallback(() => read(key), [key]);
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const hint = journeyHintKey(goal);
  function markRead() {
    if (!profileId) return;
    const seen = parseHintEntries(read(key));
    if (seen.includes(hint)) return;
    const value = JSON.stringify([...seen, hint]);
    try {
      localStorage.setItem(key, value);
      fallback.delete(key);
    } catch {
      fallback.set(key, value);
    }
    window.dispatchEvent(new Event(changed));
  }
  return { unread: !!profileId && !parseHintEntries(raw).includes(hint), markRead };
}
