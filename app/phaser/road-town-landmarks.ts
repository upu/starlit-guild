import type Phaser from "phaser";
import type { RoadBattle } from "@/lib/road-view";
import type { RoadLook } from "@/lib/road-look";
import { roadHeroSize, roadScale, roadX, roadY } from "@/lib/road-layout";
import { STORYBOOK_WAREHOUSE } from "@/lib/road-scrolling-background";

export const TOWN_SHOP = "/storybook-study/town-shop-landmark-v1.webp";
const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Landmarks stay at their world positions; a return to the warehouse is a gradual scene change. */
export class RoadTownLandmarks {
  private shop?: Phaser.GameObjects.Image;
  private warehouse?: Phaser.GameObjects.Image;
  private key?: string;
  private shopX?: number;
  private shopLast?: number;
  private shopAlpha = 0;
  private warehouseX?: number;
  private pendingWarehouse?: number;
  private transitionAt?: number;

  constructor(private scene: Phaser.Scene) {}

  paint(battle: RoadBattle, look?: RoadLook, reduced = false) {
    if (!look?.storybookHeroes || look.quest !== "town-deliveries") {
      this.hide();
      return;
    }
    if (look.sceneKey !== this.key) this.reset(look.sceneKey);
    this.prepareWarehouse(battle, look);
    this.paintShop(battle);
    this.paintWarehouse(battle, reduced);
  }

  private reset(key?: string) {
    this.key = key;
    this.shopX =
      this.shopLast =
      this.warehouseX =
      this.pendingWarehouse =
      this.transitionAt =
        undefined;
    this.shopAlpha = 0;
    this.hide();
  }

  private hide() {
    this.shop?.setVisible(false);
    this.warehouse?.setVisible(false);
  }

  private prepareWarehouse(battle: RoadBattle, look: RoadLook) {
    if (battle.townNextWarehouseX !== undefined) this.pendingWarehouse = battle.townNextWarehouseX;
    if (!battle.townParcelHandoff && this.pendingWarehouse !== undefined) {
      this.warehouseX = this.pendingWarehouse;
      this.pendingWarehouse = undefined;
      this.transitionAt = battle.time;
    }
    if (
      this.warehouseX === undefined &&
      look.work?.label === "倉庫で荷札を確かめる" &&
      battle.gathering
    )
      this.warehouseX = battle.gathering.x + 65;
  }

  private paintShop(battle: RoadBattle) {
    const recipient = battle.waterwayActions?.actors?.find(
      (a) => a.id === "town-delivery-recipient",
    );
    if (battle.townParcelDestination !== undefined && recipient) {
      if (
        this.shopX !== battle.townParcelDestination &&
        this.transitionAt !== undefined &&
        battle.time - this.transitionAt >= 400
      )
        this.transitionAt = undefined;
      this.shopX = battle.townParcelDestination;
      this.shopLast = battle.time;
      this.shopAlpha = recipient.alpha ?? 1;
    }
    if (this.shopX === undefined || this.shopLast === undefined) return;
    const alpha =
      this.transitionAt !== undefined && !battle.townParcelHandoff
        ? 0
        : this.shopAlpha * (1 - clamp((battle.time - this.shopLast) / 400));
    const { width, height } = this.scene.scale;
    const size = roadHeroSize(width, height);
    const x = this.shopX + (0.7 * size) / roadScale(width, battle.stage);
    this.shop ??= this.scene.add.image(0, 0, TOWN_SHOP).setOrigin(0.5, 1).setDepth(2);
    const source = this.shop.texture.getSourceImage() as HTMLImageElement;
    this.shop
      .setVisible(alpha > 0)
      .setAlpha(alpha)
      .setDisplaySize(size * 3.1, (size * 3.1 * source.height) / source.width)
      .setPosition(roadX(x, battle.distance, width, battle.stage), roadY(0.54, height, width));
  }

  private paintWarehouse(battle: RoadBattle, reduced: boolean) {
    if (this.warehouseX === undefined) return;
    if (this.transitionAt !== undefined && !reduced)
      battle.townTransitionFade = 1 - clamp((battle.time - this.transitionAt) / 400);
    const { width, height } = this.scene.scale;
    const size = roadHeroSize(width, height) * 5.4;
    this.warehouse ??= this.scene.add
      .image(0, 0, STORYBOOK_WAREHOUSE)
      .setOrigin(0.46, 0.86)
      .setDepth(2);
    const source = this.warehouse.texture.getSourceImage() as HTMLImageElement;
    this.warehouse
      .setVisible(true)
      .setAlpha(1)
      .setDisplaySize(size, (size * source.height) / source.width)
      .setPosition(roadX(this.warehouseX, battle.distance, width, battle.stage), height * 0.53);
  }
}
