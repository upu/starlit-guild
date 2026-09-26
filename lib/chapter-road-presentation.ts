import { isChapterThreeQuest, BERNE_QUEST, STONE_RETURN_QUEST } from "./chapter-three.ts";
import {
  LICO_RECORDS_QUEST,
  MERRILL_SEEDLINGS_QUEST,
  MOSS_TRANSPLANT_QUEST,
  isChapterFourQuest,
} from "./chapter-four.ts";
import { presentRoadScene } from "./road-scene-presentation.ts";
import { paralyzed } from "./chapter-four-battles.ts";
import { confrontationEffects, mushroomArrival } from "./chapter-four-battle-presentation.ts";
import {
  adventureFrame,
  type AdventureInput,
  type AdventureFrame,
  type AdventureIntent,
} from "./adventure-presentation.ts";
import { encounter, targetName, type GameEvent, type Run } from "./game.ts";
import {
  roadActionKind,
  roadActorReady,
  roadHasEnemies,
  workPoint,
  movingWork,
  roadPuller,
  roadWorkOffset,
  CHAPTER_ROAD_SPACING,
  ROAD_CARRY_DISTANCE,
} from "./chapter-road.ts";
import type { RoadPosition } from "./chapter-road-types.ts";
import { roadX, roadY } from "./road-layout.ts";
import { roadWorkLook } from "./chapter-road-work-look.ts";
import { spreadBattleParty } from "./road-party-formation.ts";
import {
  travellerLane,
  type RoadBattle,
  type RoadEffect,
  type RoadEnemy,
  type TravellerId,
  type Traveller,
} from "./road-view.ts";

export type RoadLook = {
  background: string;
  length: number;
  workers: string[];
  puller: string | null;
  urban: boolean;
  destination: boolean;
  work?: ReturnType<typeof roadWorkLook>;
  enemies: Record<number, { frame: string; label: string }>;
};
export const chapterRoadX = roadX;

// Predict only the drawing between 200 ms React snapshots. Combat and saved coordinates stay untouched.
function drawnX(position: RoadPosition, run: Run, now: number) {
  const road = run.road;
  if (!road || road.scene || run.phase === "rest") return position.x;
  const elapsed = Math.max(0, Math.min(200, now - road.at));
  const dt = Math.max(1, road.at - road.previousAt);
  const velocity = Math.max(-110, Math.min(110, ((position.x - position.previousX) * 1000) / dt));
  return position.x + (velocity * elapsed) / 1000;
}
function enemyKind(role?: string): RoadEnemy["kind"] {
  if (role === "puppeteer") return "pumpety";
  if (role === "golem" || role === "sweeper") return "golem";
  return role === "puppet" ? "puppet" : "slime";
}
function effectKind(event: GameEvent): RoadEffect["kind"] | null {
  if (["hurt", "gather", "heal", "assist"].includes(event.kind))
    return event.kind as RoadEffect["kind"];
  if (!["hit", "skill", "combo"].includes(event.kind)) return null;
  return event.hero === "aria" ? "arrow" : event.hero === "mira" ? "magic" : "slash";
}
function effects(run: Run | null, battle: RoadBattle): RoadEffect[] {
  if (!run) return [];
  return run.events
    .filter((event) => event.id.startsWith(`${String(run.round)}-${String(run.node)}-`))
    .flatMap((event) => {
      if (event.kind === "move" && event.enemy) return commandEffects(event, battle);
      const kind = effectKind(event);
      if (!kind || battle.time - event.at > 650) return [];
      // Work and tap assistance without an enemy are not attacks on the supplies.
      if (battle.gathering && !event.enemy && !event.target && kind !== "heal") return [];
      const hero = battle.heroes.find((h) => h.id === (event.hero || event.target));
      const id = eventHash(event.id);
      const destination = effectDestination(battle, event);
      return [
        {
          id,
          at: event.at,
          kind,
          hero: hero?.id,
          amount: event.amount || 0,
          ...destination,
          fromX: hero?.x,
          fromLane: hero?.lane,
          wide: event.kind === "skill" || event.kind === "combo",
        },
      ];
    });
}

function commandEffects(event: GameEvent, battle: RoadBattle): RoadEffect[] {
  const age = battle.time - event.at;
  const master = battle.enemies.find(
    (enemy) => enemy.id === Number(event.enemy?.split("-")[1]) && enemy.kind === "pumpety",
  );
  if (!master || master.hp <= 0 || age < 0 || age >= 900) return [];
  return battle.enemies
    .filter((enemy) => enemy.hp > 0 && ["puppet", "golem"].includes(enemy.kind))
    .map((enemy) => ({
      id: eventHash(`${event.id}-command-${String(enemy.id)}`),
      kind: "command",
      at: event.at,
      amount: 0,
      fromX: master.x,
      fromLane: master.lane,
      x: enemy.x,
      lane: enemy.lane,
    }));
}

function eventHash(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (Math.imul(hash, 31) + id.charCodeAt(i)) | 0;
  return hash;
}
function effectDestination(battle: RoadBattle, event: GameEvent) {
  const target = battle.heroes.find((h) => h.id === event.target);
  if (target) return { x: target.x, lane: target.lane };
  const enemy = battle.enemies.find((e) => e.id === Number(event.enemy?.split("-")[1]));
  if (enemy) return { x: enemy.x, lane: enemy.lane };
  const hero = battle.heroes.find((h) => h.id === event.hero);
  return {
    x: battle.gathering ? battle.gathering.x + 65 : (hero?.x ?? battle.distance),
    lane: hero?.lane ?? 0.64,
  };
}
function drawnHeroes(input: AdventureInput, frame: AdventureFrame): RoadBattle["heroes"] {
  const run = input.squad.run,
    road = run?.road;
  return frame.members.map((member, index) => {
    const position = road?.members[member.id];
    const x = position && run ? drawnX(position, run, input.now) : index * 65;
    return {
      id: member.id as TravellerId,
      hp: run ? member.hp : 1,
      maxHp: run ? member.maxHp : 1,
      x,
      lane: travellerLane(member.id as TravellerId),
      walking: !!position?.walking && run?.phase !== "rest",
      facing: position?.facing || 1,
      paralyzed: paralyzed(
        run?.actors.find((a) => a.hero === member.id),
        input.now,
      ),
    };
  });
}
function legacyOpponents(run: Run | null, frame: AdventureFrame) {
  if (!run || !frame.target?.battle) return [];
  return [
    {
      id: "enemy-1",
      hp: run.target,
      maxHp: run.targetMax,
      nextAt: run.enemyAt,
      role: undefined,
      trick: undefined,
      cue: undefined,
      cueAt: undefined,
    },
  ];
}
function drawnEnemyKind(run: Run | null, frame: AdventureFrame, role?: string) {
  const encounterNode = run?.road?.ambushNode ?? run?.node;
  if (run?.quest === LICO_RECORDS_QUEST && encounterNode === 14) return "lico";
  if (run?.quest === MERRILL_SEEDLINGS_QUEST && encounterNode === 8) return "merrill";
  return enemyKind(role || (frame.quest.enemy >= 12 ? "golem" : undefined));
}
function drawnEnemies(input: AdventureInput, frame: AdventureFrame): RoadEnemy[] {
  const run = input.squad.run,
    road = run?.road;
  return (run?.enemies || legacyOpponents(run, frame)).map((enemy, index) => {
    const position = road?.opponents[enemy.id];
    const x = position && run ? drawnX(position, run, input.now) : 200 + index * 65;
    return {
      id: index + 1,
      kind: enemy.trick || drawnEnemyKind(run, frame, enemy.role),
      appearsAt: mushroomArrival(run, enemy.id),
      action: enemy.cueAt !== undefined && input.now - enemy.cueAt < 1800 ? enemy.cue : undefined,
      actionAt: enemy.cueAt,
      x,
      lane: drawnEnemyLane(enemy, index),
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      boss: enemy.role === "sweeper" || enemy.role === "golem",
    };
  });
}
function drawnEnemyLane(enemy: { role?: string; trick?: string }, index: number) {
  if (enemy.trick === "mushroom") return [0.47, 0.8, 0.61, 0.93][index - 1];
  return enemy.role === "puppeteer" ? 0.9 : [0.74, 0.57, 0.84][index];
}
function cameraX(run: Run | null, now: number) {
  if (!run?.road) return 0;
  const road = run.road;
  return drawnX(
    { x: road.camera, previousX: road.previousCamera, recoil: 0, walking: true, facing: 1 },
    run,
    now,
  );
}
function makeBattle(input: AdventureInput, frame: AdventureFrame): RoadBattle {
  const run = input.squad.run,
    camera = cameraX(run, input.now);
  const battle: RoadBattle = {
    stage: run?.enemies?.some((enemy) => enemy.role) ? "puppets" : "forest",
    time: input.now,
    distance: camera,
    gathering: null,
    phase: !run ? "arrived" : run.phase === "rest" ? "rest" : "journey",
    effects: [],
    heroes: drawnHeroes(input, frame),
    enemies: drawnEnemies(input, frame),
  };
  return battle;
}
function makeLook(input: AdventureInput, frame: AdventureFrame): RoadLook {
  const run = input.squad.run;
  return {
    background: frame.background,
    destination: ![
      "spinning-signpost",
      "begging-golem",
      "sweet-blockade",
      "missing-keystone",
      "matching-lantern-stone",
      "manor-survey",
      "garden-reception",
      "berne-restoration",
    ].includes(frame.quest.id),
    urban:
      ["town-deliveries", "medicine-packing", "waiting-households"].includes(frame.quest.id) ||
      (isChapterFourQuest(frame.quest.id) && frame.quest.id !== MOSS_TRANSPLANT_QUEST) ||
      (isChapterThreeQuest(frame.quest.id) &&
        ![BERNE_QUEST, STONE_RETURN_QUEST].includes(frame.quest.id)),
    length:
      (run?.nodes || 15) * CHAPTER_ROAD_SPACING +
      (run && movingWork(frame.quest, { ...run, node: run.nodes - 1 }) ? ROAD_CARRY_DISTANCE : 0),
    workers:
      run && run.phase !== "rest"
        ? input.squad.members.filter(
            (id) =>
              roadActionKind(frame.quest, run, id) !== "battle" &&
              roadActorReady(frame.quest, run, id),
          )
        : [],
    puller: run ? roadPuller(frame.quest, run) : null,
    enemies: Object.fromEntries(
      (run?.enemies || []).map((enemy, index) => [
        index + 1,
        {
          frame: String(frame.quest.enemy),
          label: enemyLabel(frame, enemy.id),
        },
      ]),
    ),
  };
}
function enemyLabel(frame: AdventureFrame, id: string) {
  const target = frame.targets.find((target) => target.id === id);
  return target?.cue || target?.name || "";
}
function gatheringX(
  road: Run["road"],
  q: AdventureFrame["quest"],
  run: Run,
  cargo: boolean,
  task: string,
  puller: string | null,
) {
  if (!road) return 160;
  return workPoint(q, run) - (cargo && task === "carry" && puller ? 105 : 65);
}
function arrangeCarriers(
  frame: AdventureFrame,
  run: Run,
  battle: RoadBattle,
  puller: string | null,
) {
  if (!puller || roadHasEnemies(run)) return;
  // Keep every carrier on the cart's ground line and spread pushers to its left.
  const rear = { aria: -145, leon: -145, mira: -175, finn: -205, lico: -240 } as Record<
    string,
    number
  >;
  for (const hero of battle.heroes) {
    const visualOffset = hero.id === puller ? 45 : rear[hero.id] || -110;
    hero.x += visualOffset - roadWorkOffset(frame.quest, run, hero.id);
    hero.lane = 0.82;
  }
}
function faceWorkers(battle: RoadBattle, look: RoadLook, cargo: boolean, x: number) {
  for (const hero of battle.heroes) {
    if (look.workers.includes(hero.id)) hero.facing = cargo || hero.x < x + 65 ? 1 : -1;
  }
}
function addWork(input: AdventureInput, frame: AdventureFrame, battle: RoadBattle, look: RoadLook) {
  const run = input.squad.run,
    road = run?.road;
  const kind = run ? encounter(frame.quest, run.node) : null;
  if (!run || kind === "battle") return;
  look.work = roadWorkLook(frame.quest, run);
  const cargo = look.work.cargo;
  const task = look.work.task;
  const x = gatheringX(road, frame.quest, run, cargo, task, look.puller);
  battle.gathering = {
    kind: cargo ? "cargo" : "herb",
    task,
    x,
    remaining: run.target,
    total: run.targetMax,
  };
  if (cargo && task === "carry") arrangeCarriers(frame, run, battle, look.puller);
  faceWorkers(battle, look, cargo, x);
}
export function chapterRoadFrame(
  input: AdventureInput,
  reduced = false,
  worldWidth = 1400,
): { battle: RoadBattle; look: RoadLook } {
  const frame = adventureFrame(input),
    run = input.squad.run;
  const battle = makeBattle(input, frame),
    look = makeLook(input, frame);
  addWork(input, frame, battle, look);
  spreadBattleParty(battle, look.workers);
  battle.effects = [...effects(run, battle), ...confrontationEffects(run, battle)];
  if (battle.effects.some((effect) => effect.kind === "command")) {
    const master = battle.enemies.find((enemy) => enemy.kind === "pumpety");
    if (master) look.enemies[master.id].label = "もう一回なのよ！";
  }
  presentRoadScene(battle, run, input.now, reduced, worldWidth);
  return { battle, look };
}
export function chapterRoadHit(
  input: AdventureInput,
  point: { x: number; y: number },
  width: number,
  height: number,
): AdventureIntent {
  const { battle } = chapterRoadFrame(input);
  const size = Math.min(90, width * 0.18, height * 0.34);
  const distance = (h: Traveller) =>
    Math.hypot(
      point.x - chapterRoadX(h.x, battle.distance, width, battle.stage),
      point.y - (roadY(h.lane, height) - size * 0.45),
    );
  const hero = [...battle.heroes]
    .sort((a, b) => distance(a) - distance(b))
    .find(
      (h) =>
        Math.abs(point.x - chapterRoadX(h.x, battle.distance, width, battle.stage)) < size * 0.45 &&
        point.y > roadY(h.lane, height) - size * 0.9 &&
        point.y < roadY(h.lane, height) + size * 0.2,
    );
  return hero ? `heal:${hero.id}` : "help";
}
export function chapterRoadActivity(input: AdventureInput) {
  const run = input.squad.run;
  if (!run) return "支度中";
  if (run.phase === "rest") return "ひと休み中";
  if (run.road?.scene)
    return {
      withdraw: "人形たちがいったん退く",
      enter: "カボチャ頭の少女と人形たち",
      escape: "少女が人形たちを引いて逃げる",
    }[run.road.scene.kind];
  const quest = adventureFrame(input).quest;
  if (run.road?.ambushNode !== undefined && roadHasEnemies(run))
    return run.target > 0 ? "作業中の仲間を護衛" : "襲ってきた敵を撃退中";
  if (encounter(quest, run.node) === "battle") return "道を開きながら前へ";
  return targetName(quest, run.node, run.nodes);
}
export function chapterRoadProgress(run: Run) {
  const cleared = Math.max(0, Math.min(1, 1 - run.target / run.targetMax));
  const parts = run.road?.ambushNode !== undefined ? 2 : 1;
  return Math.min(99, Math.floor(((run.node + cleared * parts) / run.nodes) * 100));
}
