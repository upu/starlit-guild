"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  act,
  initialPrologueState,
  settle,
  testState,
  type Action,
  type Rewards,
  type State,
} from "@/lib/game";
import { parseBundle, type SaveBundle, type Profile } from "@/lib/save-format";
import { journeyNotice } from "@/lib/journey";
import { setSound, sound, soundEvents, unlockSound } from "@/lib/sound";
import { parseBackupReadResponse, parseBackupWriteResponse } from "@/lib/backup-api";
import { errorMessage, isRecord, parseJson } from "@/lib/external-input";
import {
  chapterTwoPresets,
  chapterTwoPresetState,
  type ChapterTwoPreset,
} from "@/lib/chapter-two-presets";
export const SAVE_KEY = "starlit-guild-v4";
const LEASE = SAVE_KEY + "-tab",
  FIVE_MINUTES = 300000;
type CloudCopy = { bundle: SaveBundle; at: number };
type BackupRead = ReturnType<typeof parseBackupReadResponse>;
function newProfile(test = false, preset?: ChapterTwoPreset): Profile {
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
function celebrate(
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
function savedActionToast(action: Action) {
  if (action.type === "party") toast.success("編成を保存しました。", { id: "party-saved" });
  else if (action.type === "nameSquad")
    toast.success(
      action.name?.trim() ? "隊の名前を保存しました。" : "メンバー名の表示に戻しました。",
      { id: "party-name-saved" },
    );
}
function fresh(): SaveBundle {
  const p = newProfile();
  return {
    format: 4,
    deviceId: crypto.randomUUID(),
    active: p.id,
    profiles: [p],
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
export function useLocalGame(testToolsEnabled = false) {
  const [bundle, setBundle] = useState<SaveBundle | null>(null),
    [clock, setClock] = useState(0),
    [error, setError] = useState(""),
    [cloudError, setCloudError] = useState(""),
    [cloudBusy, setCloudBusy] = useState(false),
    [copies, setCopies] = useState<CloudCopy[]>([]),
    [otherTab, setOtherTab] = useState(false),
    [saved, setSaved] = useState(0),
    [report, setReport] = useState<Rewards | null>(null);
  const current = useRef<SaveBundle | null>(null),
    tabId = useRef(""),
    owner = useRef(false),
    busy = useRef(false),
    lastAttempt = useRef(0),
    mounted = useRef(false);
  const publish = useCallback((b: SaveBundle) => {
    current.current = b;
    setBundle({ ...b });
  }, []);
  const persist = useCallback(() => {
    const b = current.current;
    if (!b || !owner.current) return;
    try {
      b.serial++;
      localStorage.setItem(SAVE_KEY, JSON.stringify(b));
      setSaved(Date.now());
      setError("");
    } catch {
      setError(
        "端末に保存できません。空き容量を確認し、セーブ画面からファイルを保管してください。",
      );
    }
  }, []);
  const advance = useCallback(
    (now: number) => {
      const b = current.current;
      if (!b || !owner.current) return;
      const p = b.profiles.find((p) => p.id === b.active);
      if (!p) {
        setError("選択中の記録を読み込めません。セーブ画面から別の記録を選んでください。");
        return;
      }
      const before = p.state,
        previous = before.updatedAt;
      const result = settle(before, now);
      p.state = result.state;
      if (!result.rewards.offline) celebrate(before, p.state);
      if (
        result.rewards.offline &&
        (result.rewards.count ||
          result.rewards.gold ||
          result.rewards.wood ||
          result.rewards.herbs ||
          result.rewards.ore ||
          result.rewards.xp)
      )
        setReport(result.rewards);
      if (document.visibilityState === "visible") {
        const recent = p.state.squads
          .flatMap((s) => s.run?.events || [])
          .filter(
            (e) =>
              e.at > previous && now - e.at < 350 && !["assist", "move", "rest"].includes(e.kind),
          );
        soundEvents(recent);
        if (result.rewards.count && !result.rewards.offline) sound("clear");
      }
      setClock(now);
      publish(b);
    },
    [publish],
  );
  const backup = useCallback(async () => {
    if (!current.current || !owner.current || busy.current) return;
    persist();
    busy.current = true;
    setCloudBusy(true);
    lastAttempt.current = Date.now();
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current.current),
        signal: AbortSignal.timeout(15000),
      });
      const raw: unknown = await res.json(),
        data = parseBackupWriteResponse(raw);
      if (!res.ok) throw Error(data.error || "バックアップを作れませんでした。");
      if (data.at === undefined) throw Error("バックアップの応答を読み取れませんでした。");
      if (mounted.current) {
        current.current.cloudAt = data.at;
        publish(current.current);
        persist();
        setCloudError("");
      }
    } catch (error) {
      if (mounted.current) setCloudError(errorMessage(error, "バックアップを作れませんでした。"));
    } finally {
      busy.current = false;
      if (mounted.current) setCloudBusy(false);
    }
  }, [persist, publish]);
  const refreshCopies = useCallback(async () => {
    try {
      const res = await fetch("/api/backup", {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw Error("クラウドに接続できません。端末の記録でそのまま遊べます。");
      const raw: unknown = await res.json(),
        data = parseBackupReadResponse(raw);
      if (!mounted.current) return;
      setCopies(readableCloudCopies(data));
      setCloudError("");
    } catch (error) {
      if (mounted.current)
        setCloudError(
          errorMessage(error, "クラウドに接続できません。端末の記録でそのまま遊べます。"),
        );
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    tabId.current = crypto.randomUUID();
    lastAttempt.current = Date.now();
    const lease = () => {
      try {
        const value = parseJson(localStorage.getItem(LEASE) || "null");
        return isRecord(value) &&
          typeof value.id === "string" &&
          typeof value.until === "number" &&
          Number.isFinite(value.until)
          ? { id: value.id, until: value.until }
          : null;
      } catch {
        return null;
      }
    };
    const acquire = () => {
      const l = lease(),
        allowed = !l || l.id === tabId.current || l.until < Date.now();
      if (allowed && (!owner.current || l?.id !== tabId.current) && current.current) {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) {
          const latest = parseBundle(parseJson(raw));
          if (latest.serial >= current.current.serial) publish(latest);
        }
      }
      owner.current = allowed;
      if (owner.current)
        localStorage.setItem(
          LEASE,
          JSON.stringify({ id: tabId.current, until: Date.now() + 6000 }),
        );
      setOtherTab(!owner.current);
    };
    const load = () => {
      try {
        // Only v4 is read: a browser holding just a v3 key starts a new story record.
        const raw = localStorage.getItem(SAVE_KEY);
        const b = raw ? parseBundle(parseJson(raw)) : fresh();
        publish(b);
        setSound(b.sound);
        acquire();
        advance(Date.now());
        persist();
      } catch {
        setError(
          "端末の記録を読み込めませんでした。保存ファイルから復元してください。元の記録は上書きしていません。",
        );
      }
    };
    const init = setTimeout(() => {
      load();
      void refreshCopies();
    }, 0);
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") advance(Date.now());
    }, 200);
    const disk = setInterval(() => {
      if (document.visibilityState === "visible") persist();
    }, 1000);
    const heartbeat = setInterval(() => {
      try {
        if (document.visibilityState === "visible") acquire();
      } catch {
        owner.current = false;
        setOtherTab(true);
      }
    }, 2000);
    const cloud = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastAttempt.current >= FIVE_MINUTES
      )
        void backup();
    }, 10000);
    const visible = () => {
      if (document.visibilityState === "visible") {
        try {
          acquire();
          advance(Date.now());
          if (Date.now() - lastAttempt.current >= FIVE_MINUTES) void backup();
        } catch {
          owner.current = false;
          setOtherTab(true);
        }
      } else advance(Date.now());
      persist();
    };
    const changed = (e: StorageEvent) => {
      if (e.key === LEASE) {
        const l = lease();
        if (l && l.id !== tabId.current) {
          owner.current = false;
          setOtherTab(true);
        }
      }
      if (e.key === SAVE_KEY && e.newValue && !owner.current) {
        try {
          publish(parseBundle(parseJson(e.newValue)));
        } catch {
          /* Keep the last readable record. */
        }
      }
    };
    const closing = () => {
      const l = lease();
      if (l?.id !== tabId.current) owner.current = false;
      advance(Date.now());
      persist();
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("pagehide", closing);
    window.addEventListener("storage", changed);
    return () => {
      closing();
      mounted.current = false;
      clearTimeout(init);
      clearInterval(tick);
      clearInterval(disk);
      clearInterval(heartbeat);
      clearInterval(cloud);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("pagehide", closing);
      window.removeEventListener("storage", changed);
      try {
        if (lease()?.id === tabId.current) localStorage.removeItem(LEASE);
      } catch {}
    };
  }, [advance, backup, persist, publish, refreshCopies]);
  const dispatch = useCallback(
    (a: Action, onSuccess?: (state: State) => void) => {
      const b = current.current;
      if (!b || !owner.current) return false;
      unlockSound();
      try {
        advance(Date.now());
        const p = b.profiles.find((p) => p.id === b.active);
        if (!p) throw Error("選択中の記録を読み込めません。");
        const before = p.state;
        p.state = act(before, a, Date.now());
        publish(b);
        persist();
        celebrate(before, p.state);
        const known = new Set(before.squads.flatMap((s) => s.run?.events.map((e) => e.id) || []));
        const added = p.state.squads
          .flatMap((s) => s.run?.events || [])
          .filter((e) => !known.has(e.id) && e.kind !== "assist");
        if (added.length) soundEvents(added);
        if (a.type === "assist") sound(a.mode === "heal" ? "heal" : "assist", true);
        else if (["start", "build", "prepareRecruitment", "gear"].includes(a.type))
          sound("clear", true);
        savedActionToast(a);
        onSuccess?.(p.state);
        return true;
      } catch (e) {
        toast.error((e as Error).message);
        return false;
      }
    },
    [advance, persist, publish],
  );
  const switchProfile = useCallback(
    (id: string) => {
      const b = current.current;
      if (!b || !owner.current || !b.profiles.some((p) => p.id === id)) return;
      advance(Date.now());
      b.active = id;
      setReport(null);
      advance(Date.now());
      persist();
    },
    [advance, persist],
  );
  const createProfile = useCallback(
    (test = false, preset?: ChapterTwoPreset) => {
      const b = current.current;
      if (!b || !owner.current || ((test || preset) && !testToolsEnabled)) return;
      if (b.profiles.length >= 12) {
        toast.error("記録は12個までです。不要な記録を削除してから作成してください。");
        return;
      }
      advance(Date.now());
      const p = newProfile(test || !!preset, preset);
      p.name += ` ${String(b.profiles.filter((p) => p.test === test).length + 1)}`;
      b.profiles.push(p);
      b.active = p.id;
      publish(b);
      setReport(null);
      persist();
      toast.success(
        test ? "テスト用の冒険を作りました。" : "以前の記録を残して、最初から始めます。",
      );
    },
    [advance, persist, publish, testToolsEnabled],
  );
  const deleteProfile = useCallback(
    (id: string) => {
      const b = current.current;
      if (!b || !owner.current) return false;
      const index = b.profiles.findIndex((p) => p.id === id);
      if (index < 0) return false;
      if (b.profiles.length <= 1) {
        toast.error("最後の記録は削除できません。");
        return false;
      }
      advance(Date.now());
      const [deleted] = b.profiles.splice(index, 1);
      if (b.active === id) b.active = b.profiles[Math.min(index, b.profiles.length - 1)].id;
      publish(b);
      setReport(null);
      persist();
      toast.success(`「${deleted.name}」を削除しました。`);
      return true;
    },
    [advance, persist, publish],
  );
  const adjust = useCallback(
    (clears: number, lv: number, gold: number) => {
      const b = current.current,
        p = b?.profiles.find((p) => p.id === b.active);
      if (!testToolsEnabled || !b || !p?.test || !owner.current) return;
      p.state = testState(Date.now(), clears, lv, gold);
      publish(b);
      persist();
      setReport(null);
      toast.success("テスト用の進行度を変更しました。");
    },
    [persist, publish, testToolsEnabled],
  );
  const restoreCopy = useCallback(
    (profile: Profile) => {
      const b = current.current;
      if (!b || !owner.current) return;
      if (b.profiles.length >= 12)
        throw Error("記録は12個までです。不要な記録を削除してから読み込んでください。");
      const p = structuredClone(profile);
      p.id = crypto.randomUUID();
      p.name = (p.name + "（復元）").slice(0, 50);
      b.profiles.push(p);
      b.active = p.id;
      publish(b);
      advance(Date.now());
      persist();
      toast.success("元の記録を残し、別の記録として復元しました。");
    },
    [advance, persist, publish],
  );
  const importFile = useCallback(
    async (file: File) => {
      if (file.size > 524288) throw Error("セーブファイルが大きすぎます。");
      const b = parseBundle(parseJson(await file.text()));
      const p = b.profiles.find((p) => p.id === b.active);
      if (!p) throw Error("選択中の記録を読み込めません。");
      if (!current.current) {
        const recovered = fresh();
        recovered.profiles = [{ ...p, id: crypto.randomUUID() }];
        recovered.active = recovered.profiles[0].id;
        localStorage.setItem(SAVE_KEY + "-unreadable", localStorage.getItem(SAVE_KEY) || "");
        owner.current = true;
        publish(recovered);
        persist();
      } else restoreCopy(p);
    },
    [persist, publish, restoreCopy],
  );
  const download = useCallback(() => {
    advance(Date.now());
    persist();
    const b = current.current;
    if (!b) return;
    const blob = new Blob(
        [JSON.stringify({ ...b, profiles: b.profiles.filter((p) => p.id === b.active) }, null, 2)],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `starlit-guild-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }, [advance, persist]);
  const toggleSound = useCallback(
    (value: boolean) => {
      const b = current.current;
      if (!b || !owner.current) return;
      b.sound = value;
      setSound(value);
      if (value) {
        unlockSound();
        sound("gather", true);
      }
      publish(b);
      persist();
    },
    [persist, publish],
  );
  const takeOver = useCallback(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) publish(parseBundle(parseJson(raw)));
      localStorage.setItem(LEASE, JSON.stringify({ id: tabId.current, until: Date.now() + 6000 }));
      owner.current = true;
      setOtherTab(false);
      advance(Date.now());
      persist();
    } catch {
      setError("端末の記録を確認してください。");
    }
  }, [advance, persist, publish]);
  const profile = bundle?.profiles.find((p) => p.id === bundle.active);
  return {
    testToolsEnabled,
    s: profile?.state || initialPrologueState(0),
    profile,
    bundle,
    clock,
    ready: !!bundle,
    otherTab,
    takeOver,
    error,
    cloudError,
    cloudBusy,
    copies,
    refreshCopies,
    backup,
    saved,
    report,
    setReport,
    dispatch,
    switchProfile,
    createProfile,
    deleteProfile,
    adjust,
    restoreCopy,
    importFile,
    download,
    toggleSound,
  };
}
