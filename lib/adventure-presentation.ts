import {
  allQuests,
  heroes,
  heroSkills,
  travelMs,
  encounter,
  targetName,
  type Squad,
  type Action,
  type GameEvent,
} from "./game.ts";
import { originalArt } from "./original-characters.ts";
import { questScenery } from "./scenery.ts";
import { heroSheets } from "./hero-animation.ts";
import { isPrologueQuest, RESTORATION_QUEST } from "./prologue.ts";
import { chapterTwoEnemyAsset, chapterTwoGolem } from "./chapter-two.ts";
import type { Enemy } from "./combat.ts";
import { puppetLook, puppetCue } from "./puppet-battles.ts";
import { LICO_RECORDS_QUEST, MERRILL_SEEDLINGS_QUEST } from "./chapter-four.ts";

export type AdventureInput = {
  squad: Squad;
  startQuest: string;
  now: number;
  ready: boolean;
  paused: boolean;
  restorationComplete?: boolean;
};
export type Point = { x: number; y: number };
export type AdventureIntent = "help" | "heal" | `heal:${string}`;
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
// Mira's map figure follows her character reference; dialogue portraits stay independent.
export const spriteAsset = (index: number) =>
  index === 0
    ? "/characters/aria-mini-v2.webp"
    : index === 2
      ? "/characters/mira-mini-v3.webp"
      : index === 4
        ? "/animations/road/lico-standing-v1.webp"
        : originalArt(index) || "/sprites.png";
export const spriteFrame = (index: number) =>
  spriteAsset(index) === "/sprites.png" ? String(index) : undefined;
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
function memberTarget(role: string, index: number) {
  const front = ["melee", "tank", "rogue"].includes(role);
  return {
    x: Math.min(0.57, 0.2 + index * 0.09 + (front ? 0.18 : 0)),
    y: 0.61 + (index % 2) * 0.09,
  };
}
function memberPosition(
  squad: Squad,
  run: ActiveRun | null,
  target: Point,
  id: string,
  index: number,
  now: number,
) {
  const progress = run ? clamp((now - run.phaseAt) / travelMs(id)) : 1;
  const x = run
    ? target.x - 0.17 * (1 - progress)
    : squad.members.length === 1
      ? 0.5
      : 0.3 + (index * 0.4) / Math.max(1, squad.members.length - 1);
  const y = run ? target.y + 0.08 * (1 - progress) : 0.65 + (index % 2) * 0.03;
  return { x, y };
}
function memberVitals(run: ActiveRun | null, id: string) {
  if (!run) return { hp: 0, maxHp: 1, health: 1, down: false };
  const health = run.health[id];
  return {
    hp: health.hp,
    maxHp: health.maxHp,
    health: clamp(health.hp / health.maxHp),
    down: health.hp <= 0,
  };
}
function adventureMember(
  input: AdventureInput,
  run: ActiveRun | null,
  events: GameEvent[],
  now: number,
  id: string,
  index: number,
) {
  const hero = heroes.find((h) => h.id === id),
    skill = heroSkills[id];
  if (!hero) throw Error(`仲間「${id}」の冒険表示を読み込めません。`);
  const actor = run?.actors.find((a) => a.hero === id),
    lastHit = events
      .filter((e) => e.hero === id && ["hit", "gather", "skill", "heal"].includes(e.kind))
      .at(-1);
  const age = lastHit ? now - lastHit.at : Infinity,
    attack = age < 650 ? Math.sin((age / 650) * Math.PI) : 0,
    target = memberTarget(skill.style, index);
  const position = memberPosition(input.squad, run, target, id, index, now),
    vitals = memberVitals(run, id);
  return {
    id,
    name: hero.name,
    sprite: hero.sprite,
    role: skill.style,
    x: position.x,
    y: position.y,
    walking: !!run && run.phase !== "rest" && !vitals.down && now < (actor?.arrivesAt || 0),
    attack: vitals.down ? 0 : attack,
    hit: lastHit,
    ...vitals,
  };
}
function frameCutin(run: ActiveRun | null, now: number) {
  return run?.scene && now >= run.scene.at && now - run.scene.at < 2600 ? run.scene : null;
}
function targetAsset(
  quest: (typeof allQuests)[number],
  run: ActiveRun,
  kind: ReturnType<typeof encounter> | null,
  sprite: number,
) {
  const encounterNode = run.road?.ambushNode ?? run.node;
  if (kind === "battle" && quest.id === LICO_RECORDS_QUEST && encounterNode === 14)
    return "/animations/road/lico-standing-v1.webp";
  if (kind === "battle" && quest.id === MERRILL_SEEDLINGS_QUEST && encounterNode === 8)
    return "/animations/road/merrill-standing-v1.webp";
  const enemyArt = kind === "battle" ? chapterTwoEnemyAsset(quest.id, run.node) : null;
  if (enemyArt) return enemyArt;
  if (kind === "escort")
    return (
      quest.escortAsset || (isPrologueQuest(quest.id) ? "/items/chest.png" : spriteAsset(sprite))
    );
  return spriteAsset(sprite);
}
function frameTarget(
  quest: (typeof allQuests)[number],
  run: ActiveRun | null,
  kind: ReturnType<typeof encounter> | null,
) {
  if (!run) return null;
  const targetSprite = kind === "gather" ? 11 : kind === "escort" ? 7 : quest.enemy;
  return {
    id: "legacy-target",
    x: 0.8,
    y: 0.61,
    scale: chapterTwoGolem(quest.id, run.node) ? 1.6 : 1.08,
    down: false,
    hp: run.target,
    maxHp: run.targetMax,
    sprite: targetSprite,
    asset: targetAsset(quest, run, kind, targetSprite),
    name: targetName(quest, run.node, run.nodes),
    value: clamp(run.target / run.targetMax),
    battle: kind === "battle",
    kind,
    cue: "",
    commanding: false,
  };
}
function puppetTarget(
  base: NonNullable<ReturnType<typeof frameTarget>>,
  enemy: Enemy,
  index: number,
  count: number,
  run: ActiveRun | null,
  now: number,
) {
  const look = puppetLook(enemy.role || "puppet");
  const positions =
    count === 2
      ? [
          { x: 0.7, y: 0.77 },
          { x: 0.84, y: 0.48 },
        ]
      : [
          { x: 0.67, y: 0.66 },
          { x: 0.78, y: 0.43 },
          { x: 0.87, y: 0.76 },
        ];
  const position = count === 1 ? { x: 0.8, y: 0.66 } : positions[index];
  return {
    ...base,
    ...look,
    ...position,
    id: enemy.id,
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    down: enemy.hp <= 0,
    value: clamp(enemy.hp / enemy.maxHp),
    cue: run?.phase === "rest" ? "" : puppetCue(enemy, now),
    commanding: enemy.role === "puppeteer",
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
  const positions =
    enemies.length === 2
      ? [
          { x: 0.77, y: 0.49 },
          { x: 0.82, y: 0.76 },
        ]
      : [
          { x: 0.73, y: 0.43 },
          { x: 0.86, y: 0.63 },
          { x: 0.72, y: 0.83 },
          { x: 0.9, y: 0.36 },
          { x: 0.92, y: 0.9 },
        ];
  return enemies.map((enemy, index) => {
    if (enemy.role) return puppetTarget(base, enemy, index, enemies.length, run, now);
    const multiple = enemies.length > 1,
      name = multiple
        ? (quest.enemy === 9 ? "霧狼" : "スライム") + " " + String.fromCharCode(65 + index)
        : base.name;
    return {
      ...base,
      ...(multiple ? positions[index] : {}),
      id: enemy.id,
      ...confrontationTarget(enemy, base.asset, name),
      scale: multiple ? 0.65 : base.scale,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      down: enemy.hp <= 0,
      value: clamp(enemy.hp / enemy.maxHp),
    };
  });
}
function confrontationTarget(enemy: Enemy, asset: string, name: string) {
  if (!enemy.trick) return { name, asset };
  return {
    name: { mushroom: "コロタケ", merrill: "メリル", lico: "リコの仕掛け" }[enemy.trick],
    asset: enemy.trick === "mushroom" ? "/animations/road/mushroom-v1.webp" : asset,
  };
}

// Presentation is a read-only projection. Only lib/game advances time or awards loot.
export function adventureFrame(input: AdventureInput, now = input.now) {
  const { squad } = input,
    run = squad.run;
  const quest = allQuests.find((q) => q.id === (run?.quest || input.startQuest)) || allQuests[0];
  const kind = run ? encounter(quest, run.node, run.nodes) : null;
  const key = run
    ? `${squad.id}:${String(run.started)}:${quest.id}:${String(run.round)}:${String(run.node)}`
    : `${squad.id}:idle:${quest.id}`;
  const events = recentEvents(run, now),
    members = squad.members.map((id, index) => adventureMember(input, run, events, now, id, index));
  const cutin = frameCutin(run, now),
    targets = frameTargets(quest, run, kind, now),
    target = targets.find((target) => !target.down) ?? targets.at(0) ?? null;
  const drained =
    quest.id === RESTORATION_QUEST && (run ? run.node >= 9 : input.restorationComplete);
  return {
    key,
    quest,
    background: drained ? "/scenery/tower-drainage-open-background.webp" : questScenery(quest),
    phase: run?.phase || "idle",
    members,
    target,
    targets,
    events,
    cutin,
    ward: run?.ward || 0,
  };
}
export type AdventureFrame = ReturnType<typeof adventureFrame>;
export function memberHealthLabel(
  member: Pick<AdventureFrame["members"][number], "name" | "down">,
) {
  return member.down ? `${member.name} · 戦闘不能` : member.name;
}

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

export function adventureAssets(frame: AdventureFrame) {
  const assets = new Set([
    "/sprites.png",
    frame.background,
    "/items/chest.png",
    "/items/herb.png",
    "/items/spirit.png",
  ]);
  for (const m of frame.members) {
    assets.add(spriteAsset(m.sprite));
    const sheet = heroSheets[m.id];
    if (sheet?.ready) assets.add(sheet.asset);
  }
  for (const target of frame.targets) assets.add(target.asset);
  return [...assets];
}

export function spriteSize(width: number, height: number, idle = false) {
  return Math.min(
    idle ? 174 : 142,
    Math.max(idle ? 110 : 82, width * (idle ? 0.24 : 0.2)),
    height * 0.35,
  );
}
export function adventureHit(
  frame: AdventureFrame,
  point: Point,
  width: number,
  height: number,
): AdventureIntent {
  const size = spriteSize(width, height, frame.phase === "idle");
  // Match canvas visual bounds. Companions win over the scenery.
  const contains = (x: number, y: number, w: number, h: number) =>
    Math.abs(point.x - x * width) < w / 2 &&
    point.y > y * height - h * 0.9 &&
    point.y < y * height + h * 0.22;
  for (const member of [...frame.members].reverse())
    if (contains(member.x, member.y, size * 0.8, size)) return `heal:${member.id}`;
  return "help";
}

export function eventColor(event: GameEvent) {
  if (event.kind === "heal") return 0x9ff0c2;
  if (event.kind === "hurt") return 0xf1a18c;
  if (event.kind === "combo") return 0xffdf83;
  const role = event.hero ? heroSkills[event.hero].style : "";
  return role === "mage"
    ? 0xc4b1ff
    : role === "ranged"
      ? 0xc9f9ac
      : role === "bard"
        ? 0xf1b6db
        : 0xffe9b3;
}
