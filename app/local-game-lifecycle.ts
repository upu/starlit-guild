"use client";
import { localId } from "@/lib/local-id";
import { useEffect } from "react";
import { parseBundle } from "@/lib/save-format";
import { setSound } from "@/lib/sound";
import { isRecord, parseJson } from "@/lib/external-input";
import {
  FIVE_MINUTES,
  LEASE_KEY,
  SAVE_KEY,
  freshBundle,
  type LocalAdvance,
  type LocalGameState,
  type LocalPersistence,
} from "./local-game-state";

type LifecycleContext = Pick<
  LocalGameState,
  | "currentRef"
  | "tabIdRef"
  | "ownerRef"
  | "lastAttemptRef"
  | "mountedRef"
  | "setOtherTab"
  | "setError"
> &
  LocalPersistence &
  LocalAdvance & {
    backup: () => Promise<void>;
    refreshCopies: () => Promise<void>;
  };
type Lease = { id: string; until: number } | null;

function readLease(): Lease {
  try {
    const value = parseJson(localStorage.getItem(LEASE_KEY) || "null");
    return isRecord(value) &&
      typeof value.id === "string" &&
      typeof value.until === "number" &&
      Number.isFinite(value.until)
      ? { id: value.id, until: value.until }
      : null;
  } catch {
    return null;
  }
}
function acquireLease(context: LifecycleContext) {
  const lease = readLease(),
    allowed = !lease || lease.id === context.tabIdRef.current || lease.until < Date.now();
  if (
    allowed &&
    (!context.ownerRef.current || lease?.id !== context.tabIdRef.current) &&
    context.currentRef.current
  ) {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const latest = parseBundle(parseJson(raw));
      if (latest.serial >= context.currentRef.current.serial) context.publish(latest);
    }
  }
  context.ownerRef.current = allowed;
  if (context.ownerRef.current)
    localStorage.setItem(
      LEASE_KEY,
      JSON.stringify({ id: context.tabIdRef.current, until: Date.now() + 6000 }),
    );
  context.setOtherTab(!context.ownerRef.current);
}
function loadLocalGame(context: LifecycleContext) {
  try {
    const raw = localStorage.getItem(SAVE_KEY),
      bundle = raw ? parseBundle(parseJson(raw)) : freshBundle();
    context.publish(bundle);
    setSound(bundle.sound);
    acquireLease(context);
    context.resume(Date.now());
    context.persist();
  } catch {
    context.setError(
      "端末の記録を読み込めませんでした。保存ファイルから復元してください。元の記録は上書きしていません。",
    );
  }
}
function acquireSafely(context: LifecycleContext) {
  try {
    acquireLease(context);
  } catch {
    context.ownerRef.current = false;
    context.setOtherTab(true);
  }
}
function visibleHandler(context: LifecycleContext) {
  return () => {
    if (document.visibilityState === "visible") {
      acquireSafely(context);
      context.resume(Date.now());
      if (Date.now() - context.lastAttemptRef.current >= FIVE_MINUTES) void context.backup();
    } else context.advance(Date.now());
    context.persist();
  };
}
function storageHandler(context: LifecycleContext) {
  return (event: StorageEvent) => {
    if (event.key === LEASE_KEY) {
      const lease = readLease();
      if (lease && lease.id !== context.tabIdRef.current) {
        context.ownerRef.current = false;
        context.setOtherTab(true);
      }
    }
    if (event.key === SAVE_KEY && event.newValue && !context.ownerRef.current) {
      try {
        context.publish(parseBundle(parseJson(event.newValue)));
      } catch {
        /* Keep the last readable record. */
      }
    }
  };
}
function closingHandler(context: LifecycleContext) {
  return () => {
    if (readLease()?.id !== context.tabIdRef.current) context.ownerRef.current = false;
    context.advance(Date.now());
    context.persist();
  };
}
function startTimers(context: LifecycleContext) {
  const init = setTimeout(() => {
      loadLocalGame(context);
      void context.refreshCopies();
    }, 0),
    tick = setInterval(() => {
      if (document.visibilityState === "visible") context.advance(Date.now());
    }, 200),
    disk = setInterval(() => {
      if (document.visibilityState === "visible") context.persist();
    }, 1000),
    heartbeat = setInterval(() => {
      if (document.visibilityState === "visible") acquireSafely(context);
    }, 2000),
    cloud = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - context.lastAttemptRef.current >= FIVE_MINUTES
      )
        void context.backup();
    }, 10000);
  return { init, tick, disk, heartbeat, cloud };
}
function startLifecycle(context: LifecycleContext) {
  context.mountedRef.current = true;
  context.tabIdRef.current = localId();
  context.lastAttemptRef.current = Date.now();
  const timers = startTimers(context),
    visible = visibleHandler(context),
    changed = storageHandler(context),
    closing = closingHandler(context);
  document.addEventListener("visibilitychange", visible);
  window.addEventListener("pagehide", closing);
  window.addEventListener("storage", changed);
  return () => {
    closing();
    context.mountedRef.current = false;
    clearTimeout(timers.init);
    clearInterval(timers.tick);
    clearInterval(timers.disk);
    clearInterval(timers.heartbeat);
    clearInterval(timers.cloud);
    document.removeEventListener("visibilitychange", visible);
    window.removeEventListener("pagehide", closing);
    window.removeEventListener("storage", changed);
    try {
      if (readLease()?.id === context.tabIdRef.current) localStorage.removeItem(LEASE_KEY);
    } catch {}
  };
}

export function useLocalGameLifecycle(context: LifecycleContext) {
  const {
    currentRef,
    tabIdRef,
    ownerRef,
    lastAttemptRef,
    mountedRef,
    setOtherTab,
    setError,
    publish,
    persist,
    advance,
    resume,
    backup,
    refreshCopies,
  } = context;
  useEffect(
    () =>
      startLifecycle({
        currentRef,
        tabIdRef,
        ownerRef,
        lastAttemptRef,
        mountedRef,
        setOtherTab,
        setError,
        publish,
        persist,
        advance,
        resume,
        backup,
        refreshCopies,
      }),
    [
      advance,
      resume,
      backup,
      currentRef,
      lastAttemptRef,
      mountedRef,
      ownerRef,
      persist,
      publish,
      refreshCopies,
      setError,
      setOtherTab,
      tabIdRef,
    ],
  );
}
