import { validRoadScene } from "./road-scenes.ts";
import { z } from "zod";
import { heroes, allQuests as quests, migrate, encounter, type State } from "./game.ts";
import { stories } from "./stories.ts";
import { isRecord } from "./external-input.ts";
import { equipmentById, validInventory } from "./equipment.ts";
import { techniqueById, validTechniques } from "./techniques.ts";
import { puppetRoles } from "./puppet-battles.ts";
import { confrontation } from "./chapter-four-battles.ts";
const techniqueId = z.string().refine((id) => !!techniqueById(id));
const techniquesSchema = z.object({
  learned: z.array(techniqueId).max(8),
  equipped: z.record(
    z.string(),
    z
      .object({
        active: techniqueId.nullable().optional(),
        passive: techniqueId.nullable().optional(),
      })
      .strict(),
  ),
});
const n = z.number().finite().min(0).max(1e15),
  count = n.int(),
  id = z.string().uuid();
const hero = z.string().refine((v) => heroes.some((h) => h.id === v));
const uniqueHeroes = z
  .array(hero)
  .min(1)
  .max(heroes.length)
  .refine((v) => new Set(v).size === v.length);
const enemyId = z.enum(["enemy-1", "enemy-2", "enemy-3"]);
const event = z.object({
  id: z.string().max(180),
  at: n,
  kind: z.enum([
    "hit",
    "gather",
    "hurt",
    "heal",
    "clear",
    "move",
    "rest",
    "assist",
    "skill",
    "combo",
  ]),
  text: z.string().max(300),
  amount: n.optional(),
  hero: hero.optional(),
  target: hero.optional(),
  enemy: enemyId.optional(),
});
const enemy = z.object({
  id: enemyId,
  hp: count,
  maxHp: count.min(1),
  resistance: n.max(300),
  attack: n,
  period: count.min(200).max(5000),
  nextAt: n,
  role: z.enum(puppetRoles).optional(),
  trick: z.enum(["lico", "merrill", "mushroom"]).optional(),
  actions: count.optional(),
  cue: z.enum(["summon", "song", "paralyze"]).optional(),
  cueAt: n.optional(),
});
const health = z.record(hero, z.object({ hp: n, maxHp: n.min(1) }));
const coordinate = z.number().finite().min(-10000).max(10000);
const position = z.object({
  x: coordinate,
  previousX: coordinate,
  recoil: coordinate,
  walking: z.boolean(),
  facing: z.union([z.literal(1), z.literal(-1)]),
});
const road = z.object({
  version: z.literal(1),
  at: n,
  previousAt: n,
  nextAt: n,
  camera: coordinate,
  previousCamera: coordinate,
  members: z.record(hero, position),
  opponents: z.record(enemyId, position),
  ambushNode: count.max(14).optional(),
  scene: z.object({ kind: z.enum(["withdraw", "enter", "escape"]), at: n }).optional(),
});
const run = z.object({
  road: road.optional(),
  serial: count,
  nodes: count.min(3).max(15),
  ward: n,
  comboAt: n,
  scene: z
    .object({
      title: z.string().max(100),
      lines: z.array(z.string().max(200)).max(8),
      at: n,
      kind: z.literal("combo"),
    })
    .nullable(),
  quest: z.string().refine((v) => quests.some((q) => q.id === v)),
  round: count.min(1),
  node: count.max(14),
  phase: z.enum(["move", "work", "rest"]),
  phaseAt: n,
  nextAt: n,
  started: n,
  health,
  target: n,
  targetMax: n.min(1),
  hits: count,
  energy: n,
  energyAt: n,
  events: z.array(event).max(12),
  enemyAt: n,
  enemies: z.array(enemy).max(3).optional(),
  actors: z
    .array(
      z.object({
        hero,
        actions: count,
        arrivesAt: n,
        nextAt: n,
        period: n.min(200).max(5000),
        paralyzedUntil: n.optional(),
        paralysisGuardUntil: n.optional(),
      }),
    )
    .min(1)
    .max(8),
});
const keyedNumbers = z.record(z.string().regex(/^[a-z][a-z0-9_-]{0,40}$/), n);
const storyQuest = z.string().refine((v) => quests.some((q) => q.id === v));
const storyIds = z
  .array(z.string().refine((v) => stories.some((st) => st.id === v)))
  .max(stories.length)
  .refine((v) => new Set(v).size === v.length);
const storyQuests = z
  .array(storyQuest)
  .max(quests.length)
  .refine((v) => new Set(v).size === v.length);
const storySchema = z
  .object({
    departed: storyQuests,
    completed: storyQuests,
    read: storyIds,
    mossTrailSplit: z.literal(true).optional(),
  })
  .refine((v) => v.completed.every((q) => v.departed.includes(q)));
const equipmentId = z.string().refine((id) => !!equipmentById(id));
const inventorySchema = z.object({
  items: z.record(equipmentId, count.max(9999)),
  equipped: z.record(
    hero,
    z.object({ weapon: equipmentId.optional(), armor: equipmentId.optional() }).strict(),
  ),
});
type ParsedState = z.infer<typeof stateBase>;
type ParsedSquad = ParsedState["squads"][number];
function validActors(squad: ParsedSquad) {
  const run = squad.run;
  if (!run) return true;
  if (run.actors.length !== squad.members.length) return false;
  if (new Set(run.actors.map((actor) => actor.hero)).size !== squad.members.length) return false;
  const healthIds = Object.keys(run.health);
  if (
    healthIds.length !== squad.members.length ||
    healthIds.some((id) => !squad.members.includes(id))
  )
    return false;
  if (Object.values(run.health).some((value) => value.hp > value.maxHp)) return false;
  return run.actors.every(
    (actor) =>
      squad.members.includes(actor.hero) && (run.phase === "rest" || actor.nextAt >= run.nextAt),
  );
}
function validTimeline(squad: ParsedSquad, updatedAt: number) {
  const run = squad.run;
  if (!run) return true;
  if (run.node >= run.nodes || run.nextAt < updatedAt) return false;
  if (run.phase !== "rest" && run.comboAt < run.nextAt) return false;
  if (run.phase !== "rest" && run.enemyAt < run.nextAt) return false;
  return validActors(squad) && validEnemies(run) && validRoad(squad);
}

function validRoad(squad: ParsedSquad) {
  const run = squad.run,
    road = run?.road;
  if (!run) return true;
  if (!road) return true;
  if (
    Object.keys(road.members).length !== squad.members.length ||
    squad.members.some((id) => !(id in road.members))
  )
    return false;
  if (
    Object.keys(road.opponents).length !== (run.enemies?.length || 0) ||
    run.enemies?.some((e) => !(e.id in road.opponents))
  )
    return false;
  return validRoadClocks(run) && validRoadAmbush(run) && validRoadScene(run);
}
function validRoadClocks(run: ParsedRun) {
  const road = run.road;
  if (!road) return true;
  return (
    run.target <= run.targetMax &&
    road.previousAt <= road.at &&
    road.at <= road.nextAt &&
    (run.phase === "rest" || road.nextAt >= run.nextAt)
  );
}
function validRoadAmbush(run: ParsedRun) {
  const road = run.road;
  if (!road) return true;
  if (road.ambushNode === undefined) return true;
  const quest = quests.find((q) => q.id === run.quest);
  return (
    !!quest &&
    road.ambushNode === run.node + 1 &&
    road.ambushNode < run.nodes &&
    encounter(quest, run.node) !== "battle" &&
    encounter(quest, road.ambushNode) === "battle"
  );
}
type ParsedRun = z.infer<typeof run>;
function validStoppedEnemies(run: ParsedRun, ambush: boolean) {
  return ambush || (!!run.road?.scene && validRoadScene(run));
}
function validConfrontationEnemies(run: ParsedRun) {
  const duel = confrontation(run.quest, run.road?.ambushNode ?? run.node);
  return !(run.enemies || []).some(
    (e) =>
      e.trick &&
      (e.role || !duel || (e.trick !== duel && !(duel === "merrill" && e.trick === "mushroom"))),
  );
}
function validEnemies(run: ParsedRun) {
  const enemies = run.enemies;
  if (!enemies) return true; // Existing battles keep their exact progress until the next node.
  const quest = quests.find((q) => q.id === run.quest);
  if (!quest) return false;
  const ambush = run.road?.ambushNode !== undefined;
  if (!validConfrontationEnemies(run)) return false;
  if (encounter(quest, run.node) !== "battle" && !ambush) return enemies.length === 0;
  if (
    !enemies.length ||
    new Set(enemies.map((enemy) => enemy.id)).size !== enemies.length ||
    enemies.some((enemy) => enemy.hp > enemy.maxHp)
  )
    return false;
  if (!validEnemyTotals(run, enemies, ambush)) return false;
  const living = enemies.filter((enemy) => enemy.hp > 0);
  if (!living.length) return validStoppedEnemies(run, ambush);
  return (
    run.enemyAt === Math.min(...living.map((enemy) => enemy.nextAt)) &&
    (run.phase === "rest" || living.every((enemy) => enemy.nextAt >= run.nextAt))
  );
}
function validEnemyTotals(
  run: ParsedRun,
  enemies: NonNullable<ParsedRun["enemies"]>,
  ambush: boolean,
) {
  return (
    ambush ||
    (run.target === enemies.reduce((sum, enemy) => sum + enemy.hp, 0) &&
      run.targetMax === enemies.reduce((sum, enemy) => sum + enemy.maxHp, 0))
  );
}
function validateState(s: ParsedState, ctx: z.RefinementCtx) {
  if (s.techniques && !validTechniques(s.techniques, s.owned))
    ctx.addIssue({ code: "custom", message: "Invalid techniques" });
  if (s.inventory && !validInventory(s.inventory, s.owned))
    ctx.addIssue({ code: "custom", message: "Invalid equipment ownership" });
  const members = s.squads.flatMap((squad) => squad.members);
  if (
    new Set(members).size !== members.length ||
    members.some((member) => !s.owned.includes(member)) ||
    new Set(s.squads.map((squad) => squad.id)).size !== s.squads.length
  )
    ctx.addIssue({ code: "custom", message: "Invalid party" });
  if (s.squads.some((squad) => !validTimeline(squad, s.updatedAt)))
    ctx.addIssue({ code: "custom", message: "Invalid timeline" });
}
const stateBase = z.object({
  version: z.literal(4),
  autoNextQuest: z.boolean().optional(),
  techniques: techniquesSchema.optional(),
  inventory: inventorySchema.optional(),
  story: storySchema.optional(),
  friendship: keyedNumbers,
  gold: n,
  herbs: n,
  ore: n,
  owned: uniqueHeroes,
  xp: keyedNumbers,
  clears: count,
  done: keyedNumbers,
  updatedAt: n,
  squads: z
    .array(
      z.object({
        id: z.literal("party-1"),
        name: z.string().min(1).max(40),
        customName: z.string().min(1).max(20).optional(),
        members: uniqueHeroes,
        repeat: z.boolean(),
        run: run.nullable(),
        lastQuest: z
          .string()
          .refine((id) => quests.some((q) => q.id === id))
          .optional(),
      }),
    )
    .length(1),
  log: z.array(z.object({ text: z.string().max(500), at: n })).max(40),
});
const stateSchema = stateBase.superRefine(validateState);
export type Profile = { id: string; name: string; test: boolean; state: State };
export type SaveBundle = {
  format: 4;
  deviceId: string;
  active: string;
  profiles: Profile[];
  serial: number;
  sound: boolean;
  cloudAt: number;
};
export const bundleSchema = z
  .object({
    format: z.literal(4),
    deviceId: id,
    active: id,
    profiles: z
      .array(
        z.object({ id, name: z.string().min(1).max(50), test: z.boolean(), state: stateSchema }),
      )
      .min(1)
      .max(12),
    serial: count,
    sound: z.boolean(),
    cloudAt: n,
  })
  .refine(
    (b) =>
      new Set(b.profiles.map((p) => p.id)).size === b.profiles.length &&
      b.profiles.some((p) => p.id === b.active),
  );
function upgradeCurrentBundle(raw: unknown): unknown {
  if (!isRecord(raw) || raw.format !== 4 || !Array.isArray(raw.profiles)) return raw;
  const profiles: unknown[] = raw.profiles;
  return {
    ...raw,
    profiles: profiles.map((profile: unknown): unknown => {
      if (!isRecord(profile) || !isRecord(profile.state)) return profile;
      const state = profile.state;
      if (state.version !== 4 || typeof state.updatedAt !== "number") return profile;
      try {
        return {
          ...profile,
          state: migrate(state as Parameters<typeof migrate>[0]),
        };
      } catch {
        return profile;
      }
    }),
  };
}
export function parseBundle(raw: unknown): SaveBundle {
  const result = bundleSchema.safeParse(upgradeCurrentBundle(raw));
  if (!result.success)
    throw Error("冒険の記録を読み取れません。STARLIT GUILD のセーブファイルを選んでください。");
  return result.data;
}
