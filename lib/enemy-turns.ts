import {
  heroes,
  stats,
  type State,
  type Squad,
  type Run,
  type Quest,
  type GameEvent,
} from "./game.ts";
import { techniqueDamage } from "./techniques.ts";
import { syncEnemyTotals, type Enemy } from "./combat.ts";
import { roadEnemyReady, roadEnemyTargets } from "./chapter-road.ts";

type Emit = (
  r: Run,
  at: number,
  kind: GameEvent["kind"],
  text: string,
  amount?: number,
  hero?: string,
  target?: string,
  enemy?: string,
) => void;
export function enemyText(q: Quest, blocked: number) {
  if (blocked) return "障壁で攻撃を軽減";
  if (q.enemy === 12) return "メリルが踊りながらかじりつく！";
  if (q.enemy === 13) return "プティの人形が糸を引いて飛びかかる！";
  return "魔物の攻撃";
}
function strikeText(enemy: Enemy, q: Quest, blocked: number, followup: boolean) {
  if (!enemy.role) return enemyText(q, blocked);
  const text = {
    puppet: "小さな人形の素早い一撃",
    golem: "ゴーレムの重い一撃",
    sweeper: "ゴーレムのなぎ払い",
    puppeteer: "",
  }[enemy.role];
  return (followup ? "号令からの追撃！ " : "") + text + (blocked ? "（障壁で軽減）" : "");
}
function strike(
  s: State,
  sq: Squad,
  r: Run,
  q: Quest,
  enemy: Enemy,
  at: number,
  index: number,
  emit: Emit,
  followup = false,
) {
  if (r.road && !roadEnemyReady(r, enemy.id)) return;
  const living = r.road
      ? roadEnemyTargets(r, enemy.id)
      : sq.members.filter((id) => r.health[id].hp > 0),
    count = enemy.role === "sweeper" ? 2 : 1;
  const defense = (stats(s, sq)[1] * 0.05) / (r.enemies?.length || 1);
  const offset = r.road ? 0 : Math.floor((at - r.started) / enemy.period) + index;
  for (let i = 0; i < Math.min(count, living.length); i++) {
    const target = living[(offset + i) % living.length],
      cover = r.road && target === "leon" ? 0.7 : 1,
      hurt = Math.max(1, techniqueDamage(s, target, (enemy.attack - defense) * cover)),
      blocked = Math.min(r.ward, hurt),
      damage = Math.min(r.health[target].hp, hurt - blocked);
    r.ward -= blocked;
    r.health[target].hp -= damage;
    emit(
      r,
      at,
      "hurt",
      (heroes.find((hero) => hero.id === target)?.name || target) +
        "：" +
        strikeText(enemy, q, blocked, followup),
      damage,
      undefined,
      target,
      enemy.id,
    );
  }
}
export function groupEnemyTurns(s: State, sq: Squad, r: Run, q: Quest, at: number, emit: Emit) {
  const enemies = r.enemies || [];
  for (const [index, enemy] of enemies.entries()) {
    if (enemy.hp <= 0 || enemy.nextAt !== at) continue;
    if (enemy.role !== "puppeteer" && !roadEnemyReady(r, enemy.id)) {
      enemy.nextAt = at + 100;
      continue;
    }
    enemy.nextAt += enemy.period;
    if (enemy.role === "puppeteer") {
      emit(
        r,
        at,
        "move",
        "カボチャ頭の少女「もう一回なのよ！」",
        undefined,
        undefined,
        undefined,
        enemy.id,
      );
      enemies
        .filter((actor) => actor.hp > 0 && actor.role !== "puppeteer")
        .forEach((actor, i) => {
          strike(s, sq, r, q, actor, at, i, emit, true);
        });
    } else strike(s, sq, r, q, enemy, at, index, emit);
  }
  syncEnemyTotals(r);
  if (!enemies.some((enemy) => enemy.hp > 0)) r.enemyAt = at + 1450;
}
