"use client";
import { localId } from "@/lib/local-id";
import { toast } from "sonner";
import { act, testState, type Action, type State } from "@/lib/game";
import { parseBundle, type Profile } from "@/lib/save-format";
import { setSound, sound, soundEvents, unlockSound } from "@/lib/sound";
import { parseJson } from "@/lib/external-input";
import type { TestPreset } from "@/lib/test-presets";
import {
  LEASE_KEY,
  SAVE_KEY,
  celebrate,
  freshBundle,
  newProfile,
  type LocalAdvance,
  type LocalGameState,
  type LocalPersistence,
} from "./local-game-state";

type GameContext = LocalGameState & LocalPersistence & LocalAdvance;

export function createGameDispatch(context: GameContext) {
  return (action: Action, onSuccess?: (state: State) => void) => {
    const bundle = context.currentRef.current;
    if (!bundle || !context.ownerRef.current) return false;
    unlockSound();
    try {
      context.advance(Date.now());
      const profile = bundle.profiles.find((item) => item.id === bundle.active);
      if (!profile) throw Error("選択中の記録を読み込めません。");
      const before = profile.state;
      profile.state = act(before, action, Date.now());
      context.publish(bundle);
      context.persist();
      celebrate(before, profile.state);
      const known = new Set(
        before.squads.flatMap((squad) => squad.run?.events.map((event) => event.id) || []),
      );
      const added = profile.state.squads
        .flatMap((squad) => squad.run?.events || [])
        .filter((event) => !known.has(event.id) && event.kind !== "assist");
      if (added.length) soundEvents(added);
      if (action.type === "assist") sound(action.mode === "heal" ? "heal" : "assist", true);
      else if (action.type === "start") sound("clear", true);
      onSuccess?.(profile.state);
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
    }
  };
}
export function createSwitchProfile(context: GameContext) {
  return (id: string) => {
    const bundle = context.currentRef.current;
    if (
      !bundle ||
      !context.ownerRef.current ||
      !bundle.profiles.some((profile) => profile.id === id)
    )
      return;
    context.advance(Date.now());
    bundle.active = id;
    context.resume(Date.now());
    context.persist();
  };
}
export function createProfileAction(context: GameContext, testToolsEnabled: boolean) {
  return (test = false, preset?: TestPreset) => {
    const bundle = context.currentRef.current;
    if (!bundle || !context.ownerRef.current || ((test || preset) && !testToolsEnabled)) return;
    if (bundle.profiles.length >= 12) {
      toast.error("記録は12個までです。不要な記録を削除してから作成してください。");
      return;
    }
    context.advance(Date.now());
    const profile = newProfile(test || !!preset, preset);
    profile.name += ` ${String(bundle.profiles.filter((item) => item.test === test).length + 1)}`;
    bundle.profiles.push(profile);
    bundle.active = profile.id;
    context.publish(bundle);
    context.persist();
    toast.success(test ? "テスト用の冒険を作りました。" : "以前の記録を残して、最初から始めます。");
  };
}
export function createDeleteProfile(context: GameContext) {
  return (id: string) => {
    const bundle = context.currentRef.current;
    if (!bundle || !context.ownerRef.current) return false;
    const index = bundle.profiles.findIndex((profile) => profile.id === id);
    if (index < 0) return false;
    if (bundle.profiles.length <= 1) {
      toast.error("最後の記録は削除できません。");
      return false;
    }
    context.advance(Date.now());
    const [deleted] = bundle.profiles.splice(index, 1);
    if (bundle.active === id)
      bundle.active = bundle.profiles[Math.min(index, bundle.profiles.length - 1)].id;
    context.publish(bundle);
    context.persist();
    toast.success(`「${deleted.name}」を削除しました。`);
    return true;
  };
}
export function createAdjust(context: GameContext, testToolsEnabled: boolean) {
  return (clears: number, level: number, gold: number) => {
    const bundle = context.currentRef.current,
      profile = bundle?.profiles.find((item) => item.id === bundle.active);
    if (!testToolsEnabled || !bundle || !profile?.test || !context.ownerRef.current) return;
    profile.state = testState(Date.now(), clears, level, gold);
    context.publish(bundle);
    context.persist();
    toast.success("テスト用の進行度を変更しました。");
  };
}
export function createRestoreCopy(context: GameContext) {
  return (source: Profile) => {
    const bundle = context.currentRef.current;
    if (!bundle || !context.ownerRef.current) return;
    if (bundle.profiles.length >= 12)
      throw Error("記録は12個までです。不要な記録を削除してから読み込んでください。");
    const profile = structuredClone(source);
    profile.id = localId();
    profile.name = (profile.name + "（復元）").slice(0, 50);
    bundle.profiles.push(profile);
    bundle.active = profile.id;
    context.publish(bundle);
    context.resume(Date.now());
    context.persist();
    toast.success("元の記録を残し、別の記録として復元しました。");
  };
}
export function createImportFile(context: GameContext, restoreCopy: (profile: Profile) => void) {
  return async (file: File) => {
    if (file.size > 524288) throw Error("セーブファイルが大きすぎます。");
    const bundle = parseBundle(parseJson(await file.text())),
      profile = bundle.profiles.find((item) => item.id === bundle.active);
    if (!profile) throw Error("選択中の記録を読み込めません。");
    if (!context.currentRef.current) {
      const recovered = freshBundle();
      recovered.profiles = [{ ...profile, id: localId() }];
      recovered.active = recovered.profiles[0].id;
      localStorage.setItem(SAVE_KEY + "-unreadable", localStorage.getItem(SAVE_KEY) || "");
      context.ownerRef.current = true;
      context.publish(recovered);
      context.persist();
    } else restoreCopy(profile);
  };
}
export function createDownload(context: GameContext) {
  return () => {
    context.advance(Date.now());
    context.persist();
    const bundle = context.currentRef.current;
    if (!bundle) return;
    const blob = new Blob(
        [
          JSON.stringify(
            { ...bundle, profiles: bundle.profiles.filter((p) => p.id === bundle.active) },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `starlit-guild-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };
}
export function createToggleSound(context: GameContext) {
  return (value: boolean) => {
    const bundle = context.currentRef.current;
    if (!bundle || !context.ownerRef.current) return;
    bundle.sound = value;
    setSound(value);
    if (value) {
      unlockSound();
      sound("gather", true);
    }
    context.publish(bundle);
    context.persist();
  };
}
export function createTakeOver(context: GameContext) {
  return () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) context.publish(parseBundle(parseJson(raw)));
      localStorage.setItem(
        LEASE_KEY,
        JSON.stringify({ id: context.tabIdRef.current, until: Date.now() + 6000 }),
      );
      context.ownerRef.current = true;
      context.setOtherTab(false);
      context.resume(Date.now());
      context.persist();
    } catch {
      context.setError("端末の記録を確認してください。");
    }
  };
}
