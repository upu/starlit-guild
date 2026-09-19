"use client";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { initialPrologueState, settle, type Rewards } from "@/lib/game";
import { parseBundle, type Profile, type SaveBundle } from "@/lib/save-format";
import { journeyNotice } from "@/lib/journey";
import { sound, soundEvents } from "@/lib/sound";
import { parseBackupReadResponse, parseBackupWriteResponse } from "@/lib/backup-api";
import { errorMessage } from "@/lib/external-input";
import {
  chapterTwoPresets,
  chapterTwoPresetState,
  type ChapterTwoPreset,
} from "@/lib/chapter-two-presets";

export const SAVE_KEY = "starlit-guild-v4";
export const LEASE_KEY = SAVE_KEY + "-tab";
export const FIVE_MINUTES = 300000;
export type CloudCopy = { bundle: SaveBundle; at: number };
type BackupRead = ReturnType<typeof parseBackupReadResponse>;

export function newProfile(test = false, preset?: ChapterTwoPreset): Profile {
  return {
    id: crypto.randomUUID(),
    name: preset
      ? chapterTwoPresets.find((p) => p.id === preset)?.name || "第2章テスト"
      : test
        ? "テスト用の冒険"
        : "新しい冒険",
    test,
    state: preset ? chapterTwoPresetState(preset, Date.now()) : initialPrologueState(Date.now()),
  };
}
export function freshBundle(): SaveBundle {
  const profile = newProfile();
  return {
    format: 4,
    deviceId: crypto.randomUUID(),
    active: profile.id,
    profiles: [profile],
    serial: 0,
    sound: true,
    cloudAt: 0,
    legacyImported: false,
  };
}
function readableCloudCopies(data: BackupRead) {
  const copies: CloudCopy[] = [];
  for (const copy of data.backups) {
    try {
      copies.push({ bundle: parseBundle(copy.bundle), at: copy.at });
    } catch {
      /* An incompatible backup stays on the server. */
    }
  }
  return copies;
}
export function celebrate(
  before: Parameters<typeof journeyNotice>[0],
  after: Parameters<typeof journeyNotice>[1],
) {
  if (document.visibilityState !== "visible") return;
  const notice = journeyNotice(before, after);
  if (notice)
    toast.success(notice.title, {
      description: notice.description,
      duration: 4500,
      id: "journey-moment",
    });
}
export function useLocalGameState() {
  const [bundle, setBundle] = useState<SaveBundle | null>(null),
    [clock, setClock] = useState(0),
    [error, setError] = useState(""),
    [cloudError, setCloudError] = useState(""),
    [cloudBusy, setCloudBusy] = useState(false),
    [copies, setCopies] = useState<CloudCopy[]>([]),
    [otherTab, setOtherTab] = useState(false),
    [saved, setSaved] = useState(0),
    [report, setReport] = useState<Rewards | null>(null);
  const currentRef = useRef<SaveBundle | null>(null),
    tabIdRef = useRef(""),
    ownerRef = useRef(false),
    busyRef = useRef(false),
    lastAttemptRef = useRef(0),
    mountedRef = useRef(false);
  return {
    bundle,
    setBundle,
    clock,
    setClock,
    error,
    setError,
    cloudError,
    setCloudError,
    cloudBusy,
    setCloudBusy,
    copies,
    setCopies,
    otherTab,
    setOtherTab,
    saved,
    setSaved,
    report,
    setReport,
    currentRef,
    tabIdRef,
    ownerRef,
    busyRef,
    lastAttemptRef,
    mountedRef,
  };
}
export type LocalGameState = ReturnType<typeof useLocalGameState>;

export function useLocalPersistence(state: LocalGameState) {
  const { currentRef, ownerRef, setBundle, setSaved, setError } = state;
  const publish = useCallback(
    (bundle: SaveBundle) => {
      currentRef.current = bundle;
      setBundle({ ...bundle });
    },
    [currentRef, setBundle],
  );
  const persist = useCallback(() => {
    const bundle = currentRef.current;
    if (!bundle || !ownerRef.current) return;
    try {
      bundle.serial++;
      localStorage.setItem(SAVE_KEY, JSON.stringify(bundle));
      setSaved(Date.now());
      setError("");
    } catch {
      setError(
        "端末に保存できません。空き容量を確認し、セーブ画面からファイルを保管してください。",
      );
    }
  }, [currentRef, ownerRef, setError, setSaved]);
  return { publish, persist };
}
export type LocalPersistence = ReturnType<typeof useLocalPersistence>;

export function useLocalAdvance(state: LocalGameState, publish: LocalPersistence["publish"]) {
  const { currentRef, ownerRef, setClock, setError, setReport } = state;
  return useCallback(
    (now: number) => {
      const bundle = currentRef.current;
      if (!bundle || !ownerRef.current) return;
      const profile = bundle.profiles.find((item) => item.id === bundle.active);
      if (!profile) {
        setError("選択中の記録を読み込めません。セーブ画面から別の記録を選んでください。");
        return;
      }
      const before = profile.state,
        previous = before.updatedAt,
        result = settle(before, now),
        rewards = result.rewards;
      profile.state = result.state;
      if (!rewards.offline) celebrate(before, profile.state);
      if (
        rewards.offline &&
        (rewards.count || rewards.gold || rewards.herbs || rewards.ore || rewards.xp)
      )
        setReport(rewards);
      if (document.visibilityState === "visible") {
        const recent = profile.state.squads
          .flatMap((squad) => squad.run?.events || [])
          .filter(
            (event) =>
              event.at > previous &&
              now - event.at < 350 &&
              !["assist", "move", "rest"].includes(event.kind),
          );
        soundEvents(recent);
        if (rewards.count && !rewards.offline) sound("clear");
      }
      setClock(now);
      publish(bundle);
    },
    [currentRef, ownerRef, publish, setClock, setError, setReport],
  );
}
export type LocalAdvance = ReturnType<typeof useLocalAdvance>;

type BackupContext = Pick<
  LocalGameState,
  | "currentRef"
  | "ownerRef"
  | "busyRef"
  | "lastAttemptRef"
  | "mountedRef"
  | "setCloudBusy"
  | "setCloudError"
> &
  LocalPersistence;
async function performBackup(context: BackupContext) {
  if (!context.currentRef.current || !context.ownerRef.current || context.busyRef.current) return;
  context.persist();
  context.busyRef.current = true;
  context.setCloudBusy(true);
  context.lastAttemptRef.current = Date.now();
  try {
    const response = await fetch("/api/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(context.currentRef.current),
      signal: AbortSignal.timeout(15000),
    });
    const raw: unknown = await response.json(),
      data = parseBackupWriteResponse(raw);
    if (!response.ok) throw Error(data.error || "バックアップを作れませんでした。");
    if (data.at === undefined) throw Error("バックアップの応答を読み取れませんでした。");
    if (context.mountedRef.current) {
      context.currentRef.current.cloudAt = data.at;
      context.publish(context.currentRef.current);
      context.persist();
      context.setCloudError("");
    }
  } catch (error) {
    if (context.mountedRef.current)
      context.setCloudError(errorMessage(error, "バックアップを作れませんでした。"));
  } finally {
    context.busyRef.current = false;
    if (context.mountedRef.current) context.setCloudBusy(false);
  }
}
export function useBackup(state: LocalGameState, persistence: LocalPersistence) {
  const { currentRef, ownerRef, busyRef, lastAttemptRef, mountedRef, setCloudBusy, setCloudError } =
      state,
    { persist, publish } = persistence;
  return useCallback(
    () =>
      performBackup({
        currentRef,
        ownerRef,
        busyRef,
        lastAttemptRef,
        mountedRef,
        setCloudBusy,
        setCloudError,
        persist,
        publish,
      }),
    [
      busyRef,
      currentRef,
      lastAttemptRef,
      mountedRef,
      ownerRef,
      persist,
      publish,
      setCloudBusy,
      setCloudError,
    ],
  );
}

export function useRefreshCopies(state: LocalGameState) {
  const { mountedRef, setCopies, setCloudError } = state;
  return useCallback(async () => {
    try {
      const response = await fetch("/api/backup", {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw Error("クラウドに接続できません。端末の記録でそのまま遊べます。");
      const raw: unknown = await response.json(),
        data = parseBackupReadResponse(raw);
      if (!mountedRef.current) return;
      setCopies(readableCloudCopies(data));
      setCloudError("");
    } catch (error) {
      if (mountedRef.current)
        setCloudError(
          errorMessage(error, "クラウドに接続できません。端末の記録でそのまま遊べます。"),
        );
    }
  }, [mountedRef, setCloudError, setCopies]);
}
