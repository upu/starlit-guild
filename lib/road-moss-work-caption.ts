import type { RoadLook } from "./road-look.ts";
import type { RoadBattle } from "./road-view.ts";
import type { WaterwayActions } from "./road-waterway-contacts.ts";
import type { RoadMossHatches } from "./road-moss-hatches.ts";
import type { RoadMossBasketShuttle } from "./road-moss-basket-shuttle.ts";
import { mossRemovalAssets as assets } from "./road-moss-removal-layout.ts";

export type MossCaptionState = {
  node: number;
  phase: "collect" | "lift" | "carry" | "give" | "shuttle" | "receive" | "return" | "settle";
  filled: boolean;
  hatches: RoadMossHatches;
  shuttle: RoadMossBasketShuttle;
};

const scraping = (scene: WaterwayActions) =>
  scene.poses.aria?.asset === assets.cycle && scene.poses.aria.frame > 0;

function shuttleCaption(state: MossCaptionState) {
  if (state.hatches.inspecting) return "灯りで点検口の奥を確かめる";
  if (state.hatches.returningLantern) return "灯りを元の場所に戻す";
  if (state.hatches.approachingInspection) return "管理人が点検口へ向かう";
  if (state.shuttle.finished) return "点検口の蓋を戻す";
  return state.shuttle.departing ? "苔の籠を荷車へ運ぶ" : "空の籠を受け取る";
}

function caption(state: MossCaptionState, scene: WaterwayActions) {
  if (scraping(scene)) return "点検口の苔を剥がして籠に集める";
  if (["lift", "carry", "give"].includes(state.phase)) return "苔の籠を作業者へ渡す";
  if (state.phase === "shuttle") return shuttleCaption(state);
  if (["receive", "return", "settle"].includes(state.phase)) return "空の籠を点検口へ運ぶ";
  if (!state.hatches.ready()) return "管理人が点検口を準備する";
  return state.filled ? "集めた苔を運び出す準備" : "点検口の苔を籠に集める";
}

/** Captions follow the rendered action without changing the saved work node. */
export function applyMossWorkCaption(
  look: RoadLook,
  battle: RoadBattle,
  scene: WaterwayActions,
  state: MossCaptionState,
) {
  if (battle.enemies.some((enemy) => enemy.hp > 0) || state.node < 3 || !look.work) return;
  look.work = { ...look.work, label: battle.mossVisualComplete ? "" : caption(state, scene) };
}
