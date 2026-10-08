import {
  allQuests,
  heroes,
  encounter,
  targetName,
  type Squad,
  type Action,
  type GameEvent,
} from "./game.ts";
import { questScenery } from "./scenery.ts";
import { RESTORATION_QUEST } from "./prologue.ts";
import type { Enemy } from "./combat.ts";
import { puppetName, puppetCue } from "./puppet-battles.ts";
import { MIST_WOLF_SPRITE } from "./quest-sprites.ts";

export type AdventureInput = {
  squad: Squad;
  startQuest: string;
  now: number;
  ready: boolean;
  paused: boolean;
  restorationComplete?: boolean;
};
export type AdventureIntent = "help" | "heal" | `heal:${string}`;
type ActiveRun = NonNullable<Squad["run"]>;
function recentEvents(run: ActiveRun | null, now: number) {
  return run
    ? run.events
        .filter(
          (e) =>
            e.id.startsWith(`${String(run.round)}-${String(run.node)}-`) &&
            now >= e.at &&
            now - e.at < 1000,
        )
        .slice(-8)
    : [];
}
function memberVitals(run: ActiveRun | null, id: string) {
  if (!run) return { hp: 0, maxHp: 1, down: false };
  const health = run.health[id];
  return { hp: health.hp, maxHp: health.maxHp, down: health.hp <= 0 };
}
function adventureMember(run: ActiveRun | null, events: GameEvent[], id: string) {
  const hero = heroes.find((h) => h.id === id);
  if (!hero) throw Error(`仲間「${id}」の冒険表示を読み込めません。`);
  const lastHit = events
    .filter((e) => e.hero === id && ["hit", "gather", "skill", "heal"].includes(e.kind))
    .at(-1);
  return { id, name: hero.name, hit: lastHit, ...memberVitals(run, id) };
}
function frameTarget(
  quest: (typeof allQuests)[number],
  run: ActiveRun | null,
  kind: ReturnType<typeof encounter> | null,
) {
  if (!run) return null;
  return {
    id: "legacy-target",
    down: false,
    hp: run.target,
    maxHp: run.targetMax,
    name: targetName(quest, run.node, run.nodes),
    battle: kind === "battle",
    kind,
    cue: "",
  };
}
function puppetTarget(
  base: NonNullable<ReturnType<typeof frameTarget>>,
  enemy: Enemy,
  run: ActiveRun | null,
  now: number,
) {
  return {
    ...base,
    id: enemy.id,
    name: puppetName(enemy.role || "puppet"),
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    down: enemy.hp <= 0,
    cue: run?.phase === "rest" ? "" : puppetCue(enemy, now),
  };
}
function frameTargets(
  quest: (typeof allQuests)[number],
  run: ActiveRun | null,
  kind: ReturnType<typeof encounter> | null,
  now: number,
): NonNullable<ReturnType<typeof frameTarget>>[] {
  const base = frameTarget(quest, run, kind);
  if (!base) return [];
  if (run?.road?.ambushNode !== undefined) {
    const enemies = frameTargets(
      quest,
      { ...run, node: run.road.ambushNode, road: undefined },
      "battle",
      now,
    );
    return [{ ...base, down: run.target <= 0 }, ...enemies];
  }
  const enemies = run?.enemies;
  if (!enemies?.length) return [base];
  return enemies.map((enemy, index) => {
    if (enemy.role) return puppetTarget(base, enemy, run, now);
    const name =
      enemies.length > 1
        ? (quest.enemy === MIST_WOLF_SPRITE ? "霧狼" : "スライム") +
          " " +
          String.fromCharCode(65 + index)
        : base.name;
    return {
      ...base,
      id: enemy.id,
      name: confrontationName(enemy, name),
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      down: enemy.hp <= 0,
    };
  });
}
function confrontationName(enemy: Enemy, name: string) {
  return enemy.trick
    ? { mushroom: "コロタケ", merrill: "メリル", lico: "リコの仕掛け" }[enemy.trick]
    : name;
}

// Presentation is a read-only projection. Only lib/game advances time or awards loot.
export function adventureFrame(input: AdventureInput, now = input.now) {
  const { squad } = input,
    run = squad.run;
  const quest = allQuests.find((q) => q.id === (run?.quest || input.startQuest)) || allQuests[0];
  const kind = run ? encounter(quest, run.node, run.nodes) : null;
  const events = recentEvents(run, now),
    members = squad.members.map((id) => adventureMember(run, events, id));
  const targets = frameTargets(quest, run, kind, now),
    target = targets.find((target) => !target.down) ?? targets.at(0) ?? null;
  const drained =
    quest.id === RESTORATION_QUEST && (run ? run.node >= 9 : input.restorationComplete);
  return {
    quest,
    background: drained ? "/scenery/tower-drainage-open-background.webp" : questScenery(quest),
    phase: run?.phase || "idle",
    members,
    target,
    targets,
  };
}
export type AdventureFrame = ReturnType<typeof adventureFrame>;
export function adventureAction(input: AdventureInput, intent: AdventureIntent): Action | null {
  const run = input.squad.run;
  if (!input.ready || input.paused || !run) return null;
  const healing = intent === "heal" || intent.startsWith("heal:") || run.phase === "rest";
  if (!healing) return { type: "assist", squad: input.squad.id, mode: "strike" };
  const requested = intent.startsWith("heal:") ? intent.slice(5) : undefined,
    target =
      requested ||
      [...input.squad.members]
        .sort(
          (a, b) => run.health[a].hp / run.health[a].maxHp - run.health[b].hp / run.health[b].maxHp,
        )
        .find((id) => run.health[id].hp < run.health[id].maxHp);
  if (
    !target ||
    !input.squad.members.includes(target) ||
    run.health[target].hp >= run.health[target].maxHp
  )
    return null;
  return { type: "assist", squad: input.squad.id, mode: "heal", id: target };
}
