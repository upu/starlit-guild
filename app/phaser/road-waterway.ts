import type Phaser from "phaser";
import type { RoadBattle } from "@/lib/road-view";
import type { RoadLook } from "@/lib/chapter-road-presentation";
import { waterwayLayout, waterwayCutFoot } from "@/lib/road-waterway-layout";
import { roadFigureDepth, roadHeroSize, roadX, roadY } from "@/lib/road-layout";
import { applyStorybookFrame } from "./road-storybook-poses";
import { faceRoadHero } from "./road-hero-pose";
import { fitPaintedEnemy } from "./road-storybook-enemy";
import { RoadSpriteFilter } from "./road-sprite-filter";
import type { WaterwayActions, WaterwayProp } from "@/lib/road-waterway-contacts";
import { waterwayPropDepth } from "@/lib/road-waterway-contacts";
import { WATERWAY_WORKER, waterwayWorkerFrame } from "@/lib/road-waterway";

export class RoadWaterway {
  private worker?: Phaser.GameObjects.Image;
  private props = new Map<string, Phaser.GameObjects.Image>();
  private shadows = new Map<string, Phaser.GameObjects.Ellipse>();
  private actors = new Map<string, Phaser.GameObjects.Image>();
  private filter: RoadSpriteFilter;
  constructor(private scene: Phaser.Scene) {
    this.filter = new RoadSpriteFilter(scene);
  }
  get bounds() {
    return [...this.props.values(), ...this.actors.values(), ...(this.worker ? [this.worker] : [])]
      .filter((image) => image.visible)
      .map((image) => image.getBounds());
  }
  get actorBounds() {
    return [...this.actors.values(), ...(this.worker ? [this.worker] : [])]
      .filter((image) => image.visible)
      .map((image) => image.getBounds());
  }
  private ensureWorker() {
    const texture = this.scene.textures.get(WATERWAY_WORKER);
    if (!texture.has("0"))
      for (let frame = 0; frame < 4; frame++)
        texture.add(String(frame), 0, frame * 256, 0, 256, 192);
    this.worker ??= this.scene.add.image(0, 0, WATERWAY_WORKER, "0").setOrigin(96 / 256, 176 / 192);
    return this.worker;
  }
  paint(state: RoadBattle, look: RoadLook, reduced: boolean) {
    this.paintProps(state, look);
    this.paintActors(state, look);
    if (!look.waterway || look.quest === "old-waterway") {
      this.worker?.setVisible(false);
      return;
    }
    const worker = this.ensureWorker();
    if (state.waterwayActions?.worker) {
      this.paintActionWorker(worker, state.waterwayActions.worker, state, look);
      return;
    }
    const { width, height } = this.scene.scale;
    const layout = waterwayLayout(width, height),
      foot = layout.project(waterwayCutFoot.x, waterwayCutFoot.y);
    const node = look.waterway.node;
    const frame = waterwayWorkerFrame(
      node,
      state.time,
      reduced,
      state.enemies.some((e) => e.hp > 0),
    );
    worker
      .setVisible(true)
      .setTexture(WATERWAY_WORKER, String(frame))
      .setFlipX(false)
      .setOrigin(96 / 256, 176 / 192)
      .setScale(layout.figureScale)
      .setPosition(foot.x, foot.y)
      .setDepth(
        roadFigureDepth(
          layout.world(waterwayCutFoot.x, waterwayCutFoot.y).lane,
          this.scene.scale,
          look,
        ),
      );
  }
  private paintActionWorker(
    image: Phaser.GameObjects.Image,
    worker: NonNullable<WaterwayActions["worker"]>,
    state: RoadBattle,
    look: RoadLook,
  ) {
    const { width, height } = this.scene.scale;
    const size = roadHeroSize(width, height) * (worker.size ?? 1);
    if (worker.pose.square)
      fitPaintedEnemy(
        image,
        {
          asset: worker.pose.asset,
          frame: String(worker.pose.frame),
          cell: worker.pose.cell ?? 512,
          rows: worker.pose.rows ?? 2,
          foot: worker.pose.square.foot,
          height: worker.pose.square.height,
        },
        size,
      );
    else
      applyStorybookFrame(
        image,
        worker.pose.asset,
        worker.pose.frame,
        size,
        worker.pose.cell,
        worker.pose.rows,
      );
    faceRoadHero(image, worker.facing ?? 1);
    if (worker.pose.square) this.filter.apply(image);
    image
      .setVisible(true)
      .setAlpha(worker.alpha ?? 1)
      .setPosition(
        roadX(worker.point.x, state.distance, width),
        roadY(worker.point.lane, height, width),
      )
      .setDepth(roadFigureDepth(worker.point.lane, this.scene.scale, look));
  }
  private paintProps(state: RoadBattle, look: RoadLook) {
    for (const image of this.props.values()) image.setVisible(false);
    for (const shadow of this.shadows.values()) shadow.setVisible(false);
    const { width, height } = this.scene.scale;
    for (const prop of state.waterwayActions?.props ?? []) {
      const key = prop.id ?? prop.asset;
      const image = this.ensureProp(key, prop.asset);
      const size = roadHeroSize(width, height) * prop.size;
      image.setTexture(prop.asset);
      const source = image.texture.getSourceImage() as HTMLImageElement;
      image
        .setVisible(true)
        .setOrigin(prop.origin?.x ?? 0.5, prop.origin?.y ?? 1)
        .setDisplaySize(size, ((size * source.height) / source.width) * (prop.verticalScale ?? 1))
        .setAngle(prop.angle ?? 0)
        .setFlipX(prop.flipX ?? false)
        .setAlpha(prop.alpha ?? 1)
        .setPosition(
          roadX(prop.point.x, state.distance, width),
          roadY(prop.point.lane, height, width),
        )
        .setDepth(waterwayPropDepth(prop, this.scene.scale, look));
      this.paintGroundShadow(prop, state, look, key, size);
    }
  }
  private ensureProp(key: string, asset: string) {
    let image = this.props.get(key);
    if (!image) {
      image = this.scene.add.image(0, 0, asset).setOrigin(0.5, 1);
      this.props.set(key, image);
    }
    return image;
  }
  private paintGroundShadow(
    prop: WaterwayProp,
    state: RoadBattle,
    look: RoadLook,
    key: string,
    size: number,
  ) {
    if (prop.groundShadow === undefined) return;
    let shadow = this.shadows.get(key);
    if (!shadow) {
      shadow = this.scene.add.ellipse(0, 0, 1, 1, 0x21170e, 0.35);
      this.shadows.set(key, shadow);
    }
    const { width, height } = this.scene.scale;
    shadow
      .setVisible(true)
      .setDisplaySize(size * 0.75, size * 0.18)
      .setPosition(
        roadX(prop.point.x, state.distance, width),
        roadY(prop.point.lane, height, width) + size * prop.groundShadow,
      )
      .setDepth(waterwayPropDepth(prop, this.scene.scale, look) - 0.02);
  }
  private paintActors(state: RoadBattle, look: RoadLook) {
    for (const actor of this.actors.values()) actor.setVisible(false);
    for (const actor of state.waterwayActions?.actors ?? []) {
      let image = this.actors.get(actor.id);
      if (!image) {
        image = this.scene.add.image(0, 0, actor.pose.asset);
        this.actors.set(actor.id, image);
      }
      this.paintActionWorker(image, actor, state, look);
    }
  }
}
