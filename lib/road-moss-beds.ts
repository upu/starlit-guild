import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import { roadTravellerCanMove } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { mossBedsLayout } from "./road-moss-beds-layout.ts";
import { waterwayAt } from "./road-waterway-contacts.ts";
import {
  presentLicoRecords,
  prepareLicoRecords,
  licoRecordsSceneryAssets,
} from "./road-lico-records.ts";
import { finishRecordsContacts } from "./road-lico-contacts.ts";
import { presentSeedlingBattle, seedlingBattleAssets } from "./road-seedling-battle.ts";
import { RoadRecordsDocuments } from "./road-lico-documents.ts";

export const mossBedsAssets = {
  bank: "/storybook-study/moss-beds-v1.png",
  portrait: "/storybook-study/moss-beds-portrait-v1.png",
  aria: "/storybook-study/aria-conversation-v1.webp",
  leon: "/storybook-study/leon-route-notes-v1.webp",
  mira: "/storybook-study/mira-moss-care-v1.webp",
  lico: "/storybook-study/lico-conversation-ponytail-v1.webp",
  reflector: "/storybook-study/field-reflector-v1.webp",
  reflectorDown: "/storybook-study/field-reflector-down-v1.webp",
  samples: "/storybook-study/field-samples-v1.webp",
  smoke: "/story-stage/prop-low-smoke.webp",
  finnContact: "/storybook-study/finn-gloves-balanced-v2.webp",
  ...licoRecordsSceneryAssets,
  ...seedlingBattleAssets,
};
type Frame = { battle: RoadBattle; look: RoadLook };
type Cue = "water" | "label" | "around" | "other";

/** Draw the garden survey without changing the underlying quest or party. */
export function presentMossBeds(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const { battle, look } = frame;
  if (look.quest === "lico-records") {
    presentLicoRecords(frame, input, view, mossBedsAssets.bank);
    return;
  }
  if (look.quest === "merrill-seedlings") {
    presentSeedlingBattle(frame, input, view);
    return;
  }
  if (
    !look.storybookHeroes ||
    look.quest !== "brekka-moss-beds" ||
    input.backgroundOverride !== mossBedsAssets.bank
  )
    return;
  look.mossBeds = {
    node: input.squad.run?.node ?? (input.questComplete ? 14 : 0),
    completed: !input.squad.run,
    cue: input.mossBedsDialogue,
  };
  Object.assign(look, {
    background: mossBedsAssets.bank,
    backgroundShade: 0,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  Object.assign(battle, { distance: 0, stage: "forest", effects: [] });
  const layout = mossBedsLayout(view);
  battle.heroes = battle.heroes.map((hero) => ({
    ...hero,
    ...layout.world(...mossBedsTarget(hero.id, 0, layout.portrait)),
    walking: false,
    facing: -1,
  }));
  if (battle.gathering && look.work)
    Object.assign(look.work, { frame: "housecalls", task: "inspect", cargo: false });
}

export function mossBedsPhase(node: number, cue?: Cue) {
  if (cue === "water") return 0;
  if (cue === "label") return 1;
  if (cue === "around") return 3;
  return node % 3;
}

export function mossBedsTarget(
  id: Traveller["id"],
  phase: number,
  portrait: boolean,
): [number, number] {
  const landscape: Partial<Record<Traveller["id"], [number, number][]>> = {
    aria: [
      [575, 490],
      [875, 435],
      [865, 610],
      [875, 435],
    ],
    leon: [
      [750, 555],
      [1030, 500],
      [1015, 670],
      [1030, 500],
    ],
    mira: [
      [925, 620],
      [755, 370],
      [1165, 600],
      [635, 390],
    ],
  };
  const tall: Partial<Record<Traveller["id"], [number, number][]>> = {
    aria: [
      [420, 600],
      [690, 540],
      [460, 770],
      [690, 540],
    ],
    leon: [
      [575, 655],
      [795, 630],
      [610, 810],
      [795, 630],
    ],
    mira: [
      [710, 735],
      [550, 465],
      [745, 740],
      [435, 465],
    ],
  };
  return (portrait ? tall : landscape)[id]?.[phase] ?? (portrait ? [610, 860] : [1100, 800]);
}

export class RoadMossBeds {
  private documents = new RoadRecordsDocuments();
  private closingKey = "";
  private closingAt = 0;
  private closingElapsed = 0;
  private records(
    frame: Frame,
    site: NonNullable<RoadLook["mossBeds"]>,
    view: RoadViewport,
    key: string,
    reduced: boolean,
  ) {
    if (!site.recordsClosing) {
      this.closingKey = "";
      return this.documents.prepare(prepareLicoRecords(frame, view), view, key, reduced);
    }
    if (this.closingKey !== key) {
      this.closingKey = key;
      this.closingElapsed = 0;
      this.closingAt = frame.battle.time;
    }
    this.closingElapsed += Math.max(0, Math.min(50, frame.battle.time - this.closingAt));
    this.closingAt = frame.battle.time;
    if (reduced) this.closingElapsed = 4200;
    const elapsed = this.closingElapsed;
    const recovering = frame.battle.heroes.some((hero) => hero.hp <= 0);
    site.visualComplete = elapsed >= (recovering ? 4200 : 1900);
    const prepared = prepareLicoRecords(frame, view, elapsed);
    if (recovering)
      prepared.battle.heroes = prepared.battle.heroes.map((hero) => {
        if (hero.hp > 0) return hero;
        const recordsRecovery =
          elapsed < 2300 || hero.paralyzed
            ? "resting"
            : elapsed < 2700
              ? "rising-low"
              : elapsed < 3300
                ? "rising-high"
                : "ready";
        return { ...hero, recordsRecovery };
      });
    return prepared;
  }
  prepare(frame: Frame, view: RoadViewport, key = "", reduced = false): Frame {
    const site = frame.look.mossBeds;
    if (!site) return frame;
    if (site.seedlings) return frame;
    if (site.records) return this.records(frame, site, view, key, reduced);
    const layout = mossBedsLayout(view),
      phase = mossBedsPhase(site.node, site.cue);
    const battle: RoadBattle = {
      ...frame.battle,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
    };
    battle.heroes = battle.heroes.map((hero) => ({
      ...hero,
      ...layout.world(...mossBedsTarget(hero.id, phase, layout.portrait)),
      walking: false,
      facing: -1,
    }));
    if (battle.gathering) {
      const point = layout.world(
        ...mossBedsTarget(phase === 1 ? "mira" : "aria", phase, layout.portrait),
      );
      battle.gathering = { ...battle.gathering, ...point, x: point.x - 65 };
    }
    return { battle, look: { ...frame.look, workers: [] } };
  }

  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport, reduced = false) {
    const site = look.mossBeds,
      scene = battle.waterwayActions;
    if (site?.seedlings) return;
    if (site?.records) {
      this.documents.finish(battle, look, view, reduced);
      finishRecords(battle, look, view, reduced);
      return;
    }
    if (!site || !scene || site.completed || battle.phase !== "journey") return;
    const layout = mossBedsLayout(view),
      phase = mossBedsPhase(site.node, site.cue);
    for (const hero of battle.heroes) {
      if (
        hero.walking ||
        hero.hp <= 0 ||
        !waterwayAt(hero, layout.world(...mossBedsTarget(hero.id, phase, layout.portrait)), view)
      )
        continue;
      const pose = mossBedsPose(hero.id, phase);
      if (pose) scene.poses[hero.id] = pose;
    }
  }
}

function finishRecords(battle: RoadBattle, look: RoadLook, view: RoadViewport, reduced: boolean) {
  const site = look.mossBeds;
  if (!site?.recordsClosing) {
    finishRecordsContacts(battle, look, view, reduced);
    return;
  }
  const pending = battle.handheld?.some((item) => {
    const hero = battle.heroes.find((value) => value.id === item.hero);
    // Paralysis expires against the live presentation clock. Keep the closing
    // scene visible until the recovered carrier has actually collected the item.
    return hero && (roadTravellerCanMove(hero) || hero.recordsRecovery) && item.phase !== "held";
  });
  if (pending || battle.heroes.some((hero) => hero.recordsRecovery && !roadTravellerCanMove(hero)))
    site.visualComplete = false;
}

function mossBedsPose(id: Traveller["id"], phase: number) {
  const poses = [
    { aria: { asset: mossBedsAssets.aria, frame: 2 } },
    { mira: { asset: mossBedsAssets.mira, frame: 3, rows: 2 } },
    { leon: { asset: mossBedsAssets.leon, frame: 1 } },
    { mira: { asset: mossBedsAssets.mira, frame: 0, rows: 2 } },
  ] as Partial<Record<Traveller["id"], { asset: string; frame: number; rows?: number }>>[];
  return poses[phase]?.[id];
}
