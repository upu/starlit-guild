import type Phaser from "phaser";
import { waterwayLayout } from "@/lib/road-waterway-layout";
import { fixedRoadLayout } from "@/lib/road-fixed-layout";
import {
  housecallsSceneLayout,
  nightBridgeBackdrop,
  usesHousecallsLayout,
} from "@/lib/road-housecalls-layout";
import {
  berneHandheld,
  berneJourneyAssets,
  berneGateLayout,
  berneGroundY,
} from "@/lib/road-berne-journey";
import type { RoadLook } from "@/lib/chapter-road-presentation";
import type { RoadBattle } from "@/lib/road-view";
import { RoadTownLandmarks } from "./road-town-landmarks";
import { roadHeroSize, roadX, roadY, roadScale } from "@/lib/road-layout";
import { nightPortraitBackdrop } from "@/lib/road-night-portrait";
import { passingTrafficStep } from "@/lib/road-passing-traffic";
import { lindeDeliveryAssets } from "@/lib/road-linde-delivery";
import { lanternRoadAssets } from "@/lib/road-lantern-layout";
import { brekkaLedgerAssets } from "@/lib/road-brekka-ledger";
import { mossTrailAssets, mossTrailBackdrop } from "@/lib/road-moss-trail";
import { mossBedsAssets } from "@/lib/road-moss-beds";
import { restorationAssets } from "@/lib/road-berne-restoration";
import { restorationSiteLayout } from "@/lib/road-restoration-layout";
import { brekkaVisitPortraitBackdrop } from "@/lib/road-brekka-ledger-layout";
import {
  STORYBOOK_ROAD,
  STORYBOOK_WAREHOUSE,
  STORYBOOK_WORKSHOP,
  STORYBOOK_TRANSPLANT,
  STORYBOOK_MOON_FOREST,
  STORYBOOK_HILL_TOWER,
  STORYBOOK_HILL_NIGHT,
  roadSceneBackdrop,
  isScrollingStorybookRoad,
  roadForestTileFlip,
} from "@/lib/road-scrolling-background";

export const ROAD_BACKGROUND = "/scenery/forest-background.webp";
const backdropTint = (background: string, night?: boolean) =>
  night && ![STORYBOOK_TRANSPLANT, STORYBOOK_MOON_FOREST, STORYBOOK_HILL_NIGHT].includes(background)
    ? 0x98a1bd
    : 0xffffff;

function brekkaBackground(look: RoadLook | undefined, width: number, height: number) {
  if (look?.brekkaLedger && (look.brekkaLedger.portrait ?? height > width))
    return brekkaLedgerAssets.portrait;
  if (look?.brekkaJourney?.field)
    return height > width ? brekkaLedgerAssets.outskirtsPortrait : brekkaLedgerAssets.outskirts;
  if (look?.brekkaJourney && !look.brekkaLedger && height > width)
    return brekkaLedgerAssets.visitPortrait;
  return undefined;
}
function mossTrailPortrait(look: RoadLook | undefined, width: number, height: number) {
  return !!look?.mossTrail && (look.mossTrail.portrait ?? height > width);
}
function portraitSiteBackground(look: RoadLook | undefined, width: number, height: number) {
  if (look?.mossBeds && height > width)
    return look.mossBeds.seedlings ? mossBedsAssets.yardPortrait : mossBedsAssets.portrait;
  if (look?.restoration && height > width)
    return look.restoration.installed
      ? restorationAssets.repairedPortrait
      : restorationAssets.portrait;
  if (!mossTrailPortrait(look, width, height)) return undefined;
  return look?.mossTrail?.fork ? mossTrailAssets.forkPortrait : mossTrailAssets.portrait;
}
function defaultBackground(look: RoadLook | undefined, width: number, height: number) {
  const brekka =
    portraitSiteBackground(look, width, height) ?? brekkaBackground(look, width, height);
  if (brekka) return brekka;
  if (look?.lanternRoad && (look.lanternRoad.portrait ?? height > width))
    return lanternRoadAssets.portrait;
  return look?.lindeDelivery && (look.lindeDelivery.portrait ?? height > width)
    ? lindeDeliveryAssets.portrait
    : (look?.background ?? ROAD_BACKGROUND);
}

function brekkaPortrait(input: { width: number; height: number }, look?: RoadLook) {
  return !!look?.brekkaJourney && !look.brekkaLedger && input.height > input.width;
}
function staticSceneryView(input: Parameters<typeof roadSceneBackdrop>[0], look?: RoadLook) {
  if (look?.packing || look?.signpost || look?.defense || look?.blockade)
    return fixedRoadLayout(input.width, input.height).backdrop;
  return look?.waterway
    ? waterwayLayout(input.width, input.height).backdrop
    : roadSceneBackdrop(input);
}
function sceneryView(input: Parameters<typeof roadSceneBackdrop>[0], look?: RoadLook) {
  if (look?.foundingDraft?.arrivalScene) {
    const view = roadSceneBackdrop(input);
    return { ...view, y: (input.height - view.height) / 2 };
  }
  if (brekkaPortrait(input, look)) return brekkaVisitPortraitBackdrop(input);
  if (look?.restoration) return restorationSiteLayout(input).backdrop;
  if (berneHandheld(look)) {
    const view = roadSceneBackdrop(input);
    return { ...view, y: berneGroundY(view.y, view.height) };
  }
  if (look?.nightBridge) return nightBridgeBackdrop(input, look.nightBridge.section);
  if (usesHousecallsLayout(look)) {
    const backdrop = housecallsSceneLayout(input, look).backdrop;
    // On the portrait fork image the blue cloth is at the far left. Centered
    // cover cropping cuts it off exactly when Aria points it out.
    return mossTrailBackdrop(backdrop, input, look?.mossTrail);
  }
  return staticSceneryView(input, look);
}

export class RoadScenery {
  private townLandmarks: RoadTownLandmarks;
  private backdrop: Phaser.GameObjects.Image;
  private repeat: Phaser.GameObjects.Image;
  private surround: Phaser.GameObjects.Image;
  private shade: Phaser.GameObjects.Graphics;
  private sizeKey = "";
  private warehouse?: Phaser.GameObjects.Image;
  private warehouseX?: number;
  private workshop?: Phaser.GameObjects.Image;
  private workshopX?: number;
  private hillTower?: Phaser.GameObjects.Image;
  private journeyArrival?: Phaser.GameObjects.Image;
  private trafficAt?: number;
  private trafficX?: number;
  private trafficSpan = 0;
  private trafficPaused = 0;
  private trafficPrevious?: number;
  private passingCart?: Phaser.GameObjects.Image;
  private passingWorker?: Phaser.GameObjects.Image;
  private passingGoods?: Phaser.GameObjects.Image;
  private berneGate?: Phaser.GameObjects.Image;
  private sceneKey?: string;

  constructor(private scene: Phaser.Scene) {
    this.townLandmarks = new RoadTownLandmarks(scene);
    this.surround = scene.add.image(0, 0, ROAD_BACKGROUND).setOrigin(0.5).setAlpha(0.25);
    this.backdrop = scene.add.image(0, 0, ROAD_BACKGROUND).setOrigin(0).setAlpha(0.9);
    this.repeat = scene.add
      .image(0, 0, ROAD_BACKGROUND)
      .setOrigin(0)
      .setAlpha(0.9)
      .setVisible(false);
    this.shade = scene.add.graphics().setDepth(1);
  }

  paint(state: RoadBattle, reduced: boolean, look?: RoadLook) {
    if (this.sceneKey !== look?.sceneKey) {
      this.sceneKey = look?.sceneKey;
      this.warehouseX = undefined;
      this.workshopX = undefined;
      this.trafficAt = undefined;
      this.trafficX = undefined;
      this.trafficPaused = 0;
      this.trafficPrevious = undefined;
      this.hideTraffic();
      this.workshop?.setVisible(false);
      this.warehouse?.setVisible(false);
    }
    const { background, tint } = this.paintBackground(state, reduced, look);
    this.paintWarehouse(
      state,
      background === STORYBOOK_ROAD && look?.quest !== "town-deliveries",
      tint,
    );
    this.townLandmarks.paint(state, look, reduced);
    this.paintWorkshop(state, look, tint);
    this.paintHillTower(state, look);
    this.paintTraffic(state, look);
    this.paintJourneyArrival(state, look);
    this.paintBerneGate(state, look);
  }
  private paintBackground(state: RoadBattle, reduced: boolean, look?: RoadLook) {
    const { width, height } = this.scene.scale;
    const portraitBridge = look?.nightBridge
      ? nightPortraitBackdrop({ width, height }, look.nightBridge.section)
      : null;
    const background = portraitBridge?.asset ?? defaultBackground(look, width, height);
    // This ground is already painted under night light; avoid tinting it twice.
    const tint = backdropTint(background, look?.night);
    this.backdrop.setTexture(background).setTint(tint);
    this.surround.setTexture(background).setTint(tint);
    this.shade.setAlpha(look?.backgroundShade ?? 0.36);
    const key = `${String(width)}:${String(height)}`;
    if (this.sizeKey !== key) {
      this.sizeKey = key;
      this.shade.clear().fillStyle(0x132f25, 1).fillRect(0, 0, width, height);
    }
    const source = this.backdrop.texture.getSourceImage() as HTMLImageElement;
    const scale = Math.max(width / source.width, height / source.height);
    this.surround
      .setDisplaySize(source.width * scale, source.height * scale)
      .setPosition(width / 2, height / 2);
    const scrolling = isScrollingStorybookRoad(background);
    const camera = reduced ? 0 : state.distance;
    const view = sceneryView(
      {
        width,
        height,
        imageWidth: source.width,
        imageHeight: source.height,
        camera,
        stage: state.stage,
        length: look?.length ?? 1,
        scrolling,
      },
      look,
    );
    const backdropView = portraitBridge ?? view;
    this.backdrop
      .setDisplaySize(backdropView.width, backdropView.height)
      .setPosition(backdropView.x, backdropView.y);
    this.repeat
      .setVisible(scrolling)
      .setTexture(background)
      .setTint(tint)
      .setDisplaySize(view.width, view.height)
      .setPosition(view.x + view.width, view.y);
    this.paintTileFacing(background, camera, view.width, state.stage);
    return { background, tint };
  }
  private paintBerneGate(state: RoadBattle, look?: RoadLook) {
    if (!look || !berneHandheld(look)) {
      this.berneGate?.setVisible(false);
      return;
    }
    const p = berneGateLayout(this.scene.scale, state.distance, look.length, state.stage);
    this.berneGate ??= this.scene.add
      .image(0, 0, berneJourneyAssets.gate)
      .setOrigin(0.5, 1)
      .setDepth(2);
    const source = this.berneGate.texture.getSourceImage() as HTMLImageElement;
    this.berneGate
      .setVisible(p.visible)
      .setPosition(p.x, p.y)
      .setDisplaySize(p.width, (p.width * source.height) / source.width);
  }
  private paintJourneyArrival(state: RoadBattle, look?: RoadLook) {
    if (
      !look?.storybookHeroes ||
      !["village-trade", "evening-trade-road"].includes(look.quest ?? "")
    ) {
      this.journeyArrival?.setVisible(false);
      return;
    }
    const returning = look.quest === "evening-trade-road",
      asset = returning ? "/storybook-study/signpost-v1.webp" : STORYBOOK_WAREHOUSE;
    this.journeyArrival ??= this.scene.add.image(0, 0, asset).setOrigin(0.5, 1).setDepth(2);
    this.journeyArrival.setTexture(asset);
    const { width, height } = this.scene.scale,
      size = roadHeroSize(width, height) * (returning ? 0.9 : 5.4),
      source = this.journeyArrival.texture.getSourceImage() as HTMLImageElement;
    this.journeyArrival
      .setVisible(true)
      .setDisplaySize(size, (size * source.height) / source.width)
      .setPosition(
        roadX(look.length + 110, state.distance, width, state.stage),
        returning ? roadY(0.6, height, width) : height * 0.53,
      );
  }
  private paintHillTower(state: RoadBattle, look?: RoadLook) {
    if (!look?.storybookHeroes || look.quest !== "tower-road") {
      this.hillTower?.setVisible(false);
      return;
    }
    this.hillTower ??= this.scene.add
      .image(0, 0, STORYBOOK_HILL_TOWER)
      .setOrigin(0.5, 1)
      .setDepth(2);
    const { width, height } = this.scene.scale,
      size = roadHeroSize(width, height) * 3.2;
    const source = this.hillTower.texture.getSourceImage() as HTMLImageElement;
    this.hillTower
      .setVisible(true)
      .setDisplaySize(size, (size * source.height) / source.width)
      .setPosition(roadX(look.length + 100, state.distance, width, state.stage), height * 0.53);
  }
  private paintWorkshop(state: RoadBattle, look: RoadLook | undefined, tint: number) {
    const visible = look?.storybookHeroes && look.quest === "medicine-road-home";
    if (!visible) {
      this.workshop?.setVisible(false);
      return;
    }
    if (this.workshopX === undefined && look.work?.frame === "homeward-route")
      this.workshopX = (state.gathering?.x ?? 0) + 65;
    if (this.workshopX === undefined) return;
    this.workshop ??= this.scene.add.image(0, 0, STORYBOOK_WORKSHOP).setOrigin(0.5, 1).setDepth(2);
    const { width, height } = this.scene.scale,
      size = roadHeroSize(width, height) * 3.4;
    const source = this.workshop.texture.getSourceImage() as HTMLImageElement;
    this.workshop
      .setVisible(true)
      .setTint(tint)
      .setDisplaySize(size, (size * source.height) / source.width)
      .setPosition(roadX(this.workshopX, state.distance, width, state.stage), height * 0.5);
  }
  get trafficBounds() {
    return [this.passingCart, this.passingWorker, this.passingGoods].flatMap((i) =>
      i?.visible ? [i.getBounds()] : [],
    );
  }
  private hideTraffic() {
    for (const image of [this.passingCart, this.passingWorker, this.passingGoods])
      image?.setVisible(false);
  }
  private paintTraffic(state: RoadBattle, look?: RoadLook) {
    if (!look?.storybookHeroes || look.quest !== "medicine-road-home") {
      this.hideTraffic();
      return;
    }
    const { width, height } = this.scene.scale;
    if (look.work?.frame === "passing-cart" && this.trafficAt === undefined) {
      this.trafficAt = state.time;
      this.trafficX = (state.gathering?.x ?? 0) + 65;
      this.trafficSpan = (width * 0.9) / roadScale(width, state.stage);
      this.trafficPaused = 0;
      this.trafficPrevious = state.time;
    }
    if (this.trafficAt === undefined || this.trafficX === undefined) return;
    const fighting = state.enemies.some((e) => e.hp > 0);
    const dt = Math.max(0, state.time - (this.trafficPrevious ?? state.time));
    this.trafficPrevious = state.time;
    if (fighting) this.trafficPaused += dt;
    const step = passingTrafficStep(
      this.trafficX,
      this.trafficSpan,
      state.time - this.trafficAt - this.trafficPaused,
    );
    if (!step.visible) {
      this.hideTraffic();
      return;
    }
    const images = this.ensureTraffic();
    const size = roadHeroSize(width, height),
      cart = size * 1.55,
      person = (size * 0.9) / 94;
    const x = roadX(step.x, state.distance, width, state.stage),
      y = roadY(1.15, height, width);
    images.cart
      .setVisible(true)
      .setDisplaySize(cart, (cart * 320) / 512)
      .setPosition(x, y)
      .setDepth(21.5);
    images.worker
      .setVisible(true)
      .setFrame(String(fighting ? 0 : step.frame))
      .setScale(person)
      .setFlipX(true)
      .setPosition(x + cart * 0.46 + 30 * person, y - cart * 0.342 + 48 * person)
      .setDepth(21.4);
    const source = images.goods.texture.getSourceImage() as HTMLImageElement;
    images.goods
      .setVisible(true)
      .setDisplaySize(cart * 0.45, (cart * 0.45 * source.height) / source.width)
      .setPosition(x - cart * 0.1, y - cart * 0.31)
      .setDepth(21.51);
  }
  private ensureTraffic() {
    const cart = (this.passingCart ??= this.scene.add
      .image(0, 0, "/storybook-study/handcart-raised-v1.webp")
      .setOrigin(0.5, 305 / 320));
    const asset = "/storybook-study/homeward-worker-v1.webp",
      texture = this.scene.textures.get(asset);
    if (!texture.has("0"))
      for (let f = 0; f < 8; f++)
        texture.add(String(f), 0, (f % 4) * 128, Math.floor(f / 4) * 128, 128, 128);
    const worker = (this.passingWorker ??= this.scene.add
      .image(0, 0, asset, "0")
      .setOrigin(0.5, 120 / 128));
    const goods = (this.passingGoods ??= this.scene.add
      .image(0, 0, "/storybook-study/covered-box-v1.webp")
      .setOrigin(0.5, 1));
    return { cart, worker, goods };
  }
  private paintTileFacing(background: string, camera: number, tileWidth: number, stage: string) {
    const flip = roadForestTileFlip(background, camera, this.scene.scale.width, tileWidth, stage);
    this.backdrop.setFlipX(flip ?? false);
    this.repeat.setFlipX(flip === null ? false : !flip);
  }

  private paintWarehouse(state: RoadBattle, visible: boolean, tint: number) {
    if (!visible) {
      this.warehouse?.setVisible(false);
      return;
    }
    if (this.warehouseX === undefined && state.gathering?.task === "pack")
      this.warehouseX = state.gathering.x + 65;
    if (this.warehouseX === undefined) return;
    if (!this.warehouse)
      this.warehouse = this.scene.add
        .image(0, 0, STORYBOOK_WAREHOUSE)
        .setOrigin(0.46, 0.86)
        .setDepth(2);
    const { width, height } = this.scene.scale;
    const size = roadHeroSize(width, height) * 5.4;
    const source = this.warehouse.texture.getSourceImage() as HTMLImageElement;
    this.warehouse
      .setVisible(true)
      .setTint(tint)
      .setDisplaySize(size, (size * source.height) / source.width)
      .setPosition(roadX(this.warehouseX, state.distance, width, state.stage), height * 0.53);
  }
}
