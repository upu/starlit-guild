import type Phaser from "phaser";
import { waterwayBackgrounds } from "@/lib/road-waterway-layout";
import { waterwayActionAssets } from "@/lib/road-waterway-contacts";
import { mossRemovalAssets } from "@/lib/road-moss-removal-layout";
import { waterwaySearchAssets } from "@/lib/road-waterway-search";
import { medicinePackingAssets } from "@/lib/road-medicine-packing";
import { WATERWAY_TOOL_CART, WATERWAY_WORKER, WATERWAY_BRANCHES } from "@/lib/road-waterway";
import { STORYBOOK_EFFECTS } from "@/lib/road-effect-layout";
import { storybookRoadAssets } from "./road-storybook-poses";
import { adventureAction } from "@/lib/adventure-presentation";
import { chapterRoadFrame, chapterRoadHit } from "@/lib/chapter-road-presentation";
import { RoadMotion } from "@/lib/road-motion";
import type { RoadLook } from "@/lib/road-look";
import type { RoadBattle } from "@/lib/road-view";
import { roadPaintKey } from "@/lib/road-paint-key";
import { roadScale } from "@/lib/road-layout";
import { paintedPuppetAssets } from "@/lib/road-storybook-enemy";
import { signpostAssets } from "@/lib/road-signpost";
import { golemDefenseAssets } from "@/lib/road-golem-defense";
import { blockadeAssets } from "@/lib/road-blockade-layout";
import { housecallsAssets, firstChapterReturn } from "@/lib/road-housecalls-layout";
import { berneCallsAssets } from "@/lib/road-berne-calls";
import { foundationAssets } from "@/lib/road-berne-foundation";
import { manorDeliveryAssets } from "@/lib/road-manor-deliveries";
import { stoneSelectionAssets } from "@/lib/road-stone-selection";
import { manorSurveyAssets } from "@/lib/road-manor-survey";
import { gardenReceptionAssets } from "@/lib/road-garden-reception";
import { nightBridgeAssets } from "@/lib/road-night-bridge";
import { restorationAssets } from "@/lib/road-berne-restoration";
import { lindeDeliveryAssets } from "@/lib/road-linde-delivery";
import { lanternRoadAssets } from "@/lib/road-lantern-layout";
import { brekkaLedgerAssets } from "@/lib/road-brekka-ledger";
import { lindeCourierAssets } from "@/lib/road-linde-couriers";
import { foundingTurnAssets } from "@/lib/road-founding-carry-turn";
import { berneHandheld, berneJourneyAssets } from "@/lib/road-berne-journey";
import { RoadPainter } from "./road-painter";
import { ROAD_BACKGROUND } from "./road-scenery";
import {
  ROAD_EFFECTS,
  ROAD_HERB,
  ROAD_CARGO,
  ROAD_DESTINATION,
  ROAD_WORKSITES,
  ROAD_BERNE_WORKSITES,
  ROAD_LEDGER_DESK,
  ROAD_SIGNPOST,
} from "./road-art";
import { adventureHeroAsset } from "@/lib/adventure-hero-art";
import { mossTrailAssets } from "@/lib/road-moss-trail";
import { mossBedsAssets } from "@/lib/road-moss-beds";
import {
  foundingRecipient,
  foundingRecipientWalk,
  foundingRecipientCarryWalk,
  foundingRecipientTurn,
} from "@/lib/road-founding-recipient";
import { foundingWarehouseBackground } from "@/lib/road-founding-arrival";
import {
  adventureEnemyAsset,
  adventureMushroomProjectile,
  storybookWolfAsset,
  storybookSlimeAsset,
} from "@/lib/adventure-enemy-art";
import type { AdventureBridge, RuntimeState } from "./renderer-session";
import { TownActivityPublisher } from "./road-town-activity";
import { RoadSiteCompletion } from "./road-site-completion";
import { forestReturnPreload } from "@/lib/road-forest-return";

export function chapterRoadAssets(input: ReturnType<AdventureBridge["read"]>) {
  const { look } = chapterRoadFrame(input);
  return [
    ...new Set([
      "/sprites.png",
      ROAD_BACKGROUND,
      look.background,
      ...forestReturnPreload(look),
      ...searchAssets(look),
      ...trailAssets(look),
      ...(look.waterway
        ? [
            ...Object.values(waterwayBackgrounds),
            ...Object.values(waterwayActionAssets),
            ...(look.quest === "tower-moss-removal" ? Object.values(mossRemovalAssets) : []),
            WATERWAY_TOOL_CART,
            WATERWAY_WORKER,
            WATERWAY_BRANCHES,
          ]
        : []),
      ...(input.backgroundOverride ? [input.backgroundOverride] : []),
      ...(input.storybookHeroes ? storybookRoadAssets : []),
      ...(input.storybookHeroes
        ? [
            storybookWolfAsset,
            storybookSlimeAsset,
            STORYBOOK_EFFECTS,
            ...Object.values(paintedPuppetAssets),
          ]
        : []),
      ROAD_EFFECTS,
      ROAD_HERB,
      ROAD_CARGO,
      ...(["slime", "wolf", "dragon", "plant", "pumpety", "puppet", "golem"] as const).map(
        adventureEnemyAsset,
      ),
      ROAD_DESTINATION,
      ROAD_WORKSITES,
      ROAD_BERNE_WORKSITES,
      ROAD_LEDGER_DESK,
      ROAD_SIGNPOST,
      ...(["aria", "leon", "mira", "finn"] as const).map(adventureHeroAsset),
      ...(input.squad.members.includes("lico") ? [adventureHeroAsset("lico")] : []),
      ...(input.squad.run?.quest === "lico-records" ? [adventureEnemyAsset("lico-standing")] : []),
      ...(input.squad.run?.quest === "merrill-seedlings"
        ? [
            adventureEnemyAsset("merrill-standing"),
            adventureEnemyAsset("merrill-song"),
            adventureEnemyAsset("mushroom"),
            adventureMushroomProjectile,
          ]
        : []),
      ...(look.work ? [look.work.asset] : []),
    ]),
  ];
}

function trailAssets(look: ReturnType<typeof chapterRoadFrame>["look"]) {
  if (look.foundingDraft)
    return [
      foundingRecipient,
      foundingRecipientWalk,
      foundingRecipientCarryWalk,
      foundingRecipientTurn,
      foundingWarehouseBackground,
      ...lindeCourierAssets,
      ...foundingTurnAssets,
    ];
  return look.mossBeds
    ? Object.values(mossBedsAssets)
    : look.mossTrail
      ? Object.values(mossTrailAssets)
      : [];
}

function manorAssets(look: ReturnType<typeof chapterRoadFrame>["look"]) {
  if (look.brekkaLedger || look.brekkaJourney) return Object.values(brekkaLedgerAssets);
  if (look.lanternRoad) return Object.values(lanternRoadAssets);
  if (look.lindeDelivery) return [...Object.values(lindeDeliveryAssets), ...lindeCourierAssets];
  if (look.restoration) return Object.values(restorationAssets);
  if (look.nightBridge) return Object.values(nightBridgeAssets);
  if (look.gardenReception) return Object.values(gardenReceptionAssets);
  if (look.manorSurvey) return Object.values(manorSurveyAssets);
  if (look.stoneSelection) return Object.values(stoneSelectionAssets);
  if (look.manorDelivery) return Object.values(manorDeliveryAssets);
  if (look.foundation) return Object.values(foundationAssets);
  return undefined;
}
function sceneBackgroundRequired(look: ReturnType<typeof chapterRoadFrame>["look"]) {
  return !!(
    look.foundingDraft?.arrivalScene ||
    look.waterway ||
    look.brekkaLedger ||
    look.mossTrail ||
    look.manorDelivery?.garden ||
    look.foundation?.exposed ||
    firstChapterReturn(look) ||
    look.gardenReception?.arrived ||
    look.nightBridge ||
    look.restoration
  );
}
function searchAssets(look: ReturnType<typeof chapterRoadFrame>["look"]) {
  const manor = manorAssets(look);
  if (manor) return manor;
  if (look.berneCalls) return Object.values(berneCallsAssets);
  if (berneHandheld(look)) return Object.values(berneJourneyAssets);
  if (look.housecalls) return Object.values(housecallsAssets);
  if (look.blockade) return Object.values(blockadeAssets);
  if (look.defense) return Object.values(golemDefenseAssets);
  if (look.signpost) return Object.values(signpostAssets);
  if (look.packing) return Object.values(medicinePackingAssets);
  return look.quest === "old-waterway" && look.storybookHeroes
    ? Object.values(waterwaySearchAssets)
    : [];
}
export class ChapterRoadPainter {
  private painter?: RoadPainter;
  private motion = new RoadMotion();
  private drawn?: ReturnType<typeof chapterRoadFrame>;
  private finishedRestorationKey?: string;
  private finishedNightBridgeKey?: string;
  private finishedLindeKey?: string;
  private finishedLanternKey?: string;
  private finishedBrekkaKey?: string;
  private finishedRecordsKey?: string;
  private finishedSeedlingsKey?: string;
  private finishedFoundingKey?: string;
  private finishedMossKey?: string;
  private siteCompletion = new RoadSiteCompletion();
  private nightPushFrame: number | null = null;
  private lindeProgressKey = "";
  private townActivity = new TownActivityPublisher();
  private loading = false;
  private identity?: ReturnType<typeof roadPaintKey>;
  failed = false;
  get assetsLoading() {
    return this.loading;
  }
  constructor(
    private scene: Phaser.Scene,
    private bridge: AdventureBridge,
    private engine: typeof Phaser,
    private runtime: RuntimeState,
    private syncPause: () => void,
  ) {}
  initialize() {
    if (this.runtime.disposed || this.failed) return;
    this.painter = new RoadPainter(this.scene);
    this.scene.input.on(this.engine.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      this.pointerUp(pointer);
    });
    this.runtime.created = true;
    this.bridge.status("ready");
    this.paint();
    queueMicrotask(this.syncPause);
  }
  private pointerUp(pointer: Phaser.Input.Pointer) {
    if (
      this.runtime.disposed ||
      this.runtime.paused ||
      this.loading ||
      this.failed ||
      pointer.button !== 0 ||
      pointer.getDistance() > 14
    )
      return;
    const input = this.bridge.read();
    const intent = chapterRoadHit(
      input,
      pointer,
      this.scene.scale.width,
      this.scene.scale.height,
      this.drawn?.battle,
    );
    const action = adventureAction(input, intent);
    if (action) this.bridge.act(action);
  }
  private ensureAssets() {
    const missing = chapterRoadAssets(this.bridge.read()).filter(
      (asset) => !this.scene.textures.exists(asset),
    );
    if (!missing.length) return true;
    if (this.loading) return false;
    this.loading = true;
    this.bridge.status("loading");
    for (const asset of missing) this.scene.load.image(asset, asset);
    this.scene.load.once(this.engine.Loader.Events.COMPLETE, () => {
      this.loading = false;
      if (!this.runtime.disposed && !this.failed) {
        this.bridge.status("ready");
        this.paint();
        this.syncPause();
      }
    });
    this.scene.load.start();
    return false;
  }
  stopMotion() {
    this.paint();
  }
  paint() {
    if (!this.painter || !this.ensureAssets()) return;
    const width = this.scene.scale.width;
    const input = this.bridge.read();
    const frame = chapterRoadFrame(
      input,
      this.runtime.reduced,
      width / roadScale(width, "puppets"),
      { width, height: this.scene.scale.height },
    );
    const run = input.squad.run;
    this.identity = roadPaintKey(input.squad.id, run, frame.look, this.identity);
    const key = this.identity.key;
    this.drawn = this.motion.update(
      frame,
      key,
      width,
      this.runtime.reduced,
      this.scene.scale.height,
    );
    const { battle, look } = this.drawn;
    const sceneBackground = sceneBackgroundRequired(look);
    this.painter.paint(battle, this.runtime.reduced, {
      ...look,
      sceneKey: key,
      background: sceneBackground ? look.background : (input.backgroundOverride ?? look.background),
      backgroundShade: sceneBackground
        ? look.backgroundShade
        : input.backgroundOverride
          ? 0
          : undefined,
      storybookHeroes: input.storybookHeroes,
    });
    const pose = battle.waterwayActions?.poses.finn;
    const pushFrame = pose?.asset === nightBridgeAssets.push ? pose.frame : null;
    if (pushFrame !== this.nightPushFrame) {
      this.nightPushFrame = pushFrame;
      this.bridge.nightPushFrame?.(pushFrame);
    }
    this.publishLindeProgress(look, key);
    this.townActivity.publish(look, battle, key, run?.started, this.bridge.townActivity);
    this.finishVisuals(look, key, battle);
  }
  private publishLindeProgress(look: RoadLook, key: string) {
    const site = look.lindeDelivery ?? look.lanternRoad ?? look.brekkaJourney ?? look.foundingDraft;
    if (site) {
      const progress = {
        node: look.brekkaJourney?.displayNode ?? look.foundingDraft?.visualNode ?? site.node,
        complete: !!site.visualComplete,
        ...(look.foundingDraft
          ? { phase: look.foundingDraft.cue ? ("work" as const) : ("move" as const) }
          : {}),
      };
      const progressKey = `${key}:${String(progress.node)}:${String(progress.complete)}:${progress.phase ?? ""}`;
      if (progressKey !== this.lindeProgressKey) {
        this.lindeProgressKey = progressKey;
        this.bridge.lindeProgress?.(progress);
      }
    } else this.lindeProgressKey = "";
  }
  private finishVisuals(look: RoadLook, key: string, battle: RoadBattle) {
    this.siteCompletion.update(look, battle, key, this.bridge.visualComplete);
    this.finishMoss(look, key, battle);
    this.finishFounding(look, key);
    this.finishSeedlings(look, key);
    this.finishRecords(look, key);
    this.finishLantern(look, key);
    this.finishBrekka(look, key);
    if (look.lindeDelivery?.visualComplete && this.finishedLindeKey !== key) {
      this.finishedLindeKey = key;
      this.bridge.visualComplete?.("linde-requests");
    }
    if (look.restoration?.visualComplete && this.finishedRestorationKey !== key) {
      this.finishedRestorationKey = key;
      this.bridge.visualComplete?.("berne-restoration");
    }
    if (
      look.nightBridge?.completed &&
      look.nightBridge.section === 2 &&
      !look.nightBridge.fade &&
      this.finishedNightBridgeKey !== key
    ) {
      this.finishedNightBridgeKey = key;
      this.bridge.visualComplete?.("keystone-night-road");
    }
  }
  private finishMoss(look: RoadLook, key: string, battle: RoadBattle) {
    if (look.mossFinalizing && battle.mossVisualComplete && this.finishedMossKey !== key) {
      this.finishedMossKey = key;
      this.bridge.visualComplete?.("tower-moss-removal");
    }
  }
  private finishFounding(look: RoadLook, key: string) {
    if (!look.foundingDraft?.visualComplete || this.finishedFoundingKey === key) return;
    this.finishedFoundingKey = key;
    this.bridge.visualComplete?.("starlit-guild-founding");
  }
  private finishSeedlings(look: RoadLook, key: string) {
    if (
      !look.mossBeds?.seedlings ||
      !look.mossBeds.completed ||
      !look.mossBeds.visualComplete ||
      this.finishedSeedlingsKey === key
    )
      return;
    this.finishedSeedlingsKey = key;
    this.bridge.visualComplete?.("merrill-seedlings");
  }
  private finishRecords(look: RoadLook, key: string) {
    if (look.mossBeds?.records && look.mossBeds.visualComplete && this.finishedRecordsKey !== key) {
      this.finishedRecordsKey = key;
      this.bridge.visualComplete?.("lico-records");
    }
  }
  private finishBrekka(look: RoadLook, key: string) {
    if (look.mossTrail?.visualComplete && this.finishedBrekkaKey !== key) {
      this.finishedBrekkaKey = key;
      this.bridge.visualComplete?.(
        look.mossTrail.secondDay ? "glowing-moss-trail-next-day" : "glowing-moss-trail",
      );
    }
    if (look.brekkaJourney?.visualComplete && this.finishedBrekkaKey !== key) {
      this.finishedBrekkaKey = key;
      this.bridge.visualComplete?.("brekka-arrival");
    }
  }
  private finishLantern(look: RoadLook, key: string) {
    if (look.lanternRoad?.visualComplete && this.finishedLanternKey !== key) {
      this.finishedLanternKey = key;
      this.bridge.visualComplete?.("lantern-detour");
    }
  }
}
