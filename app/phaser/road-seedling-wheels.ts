import type Phaser from "phaser";
import type { RoadBattle } from "@/lib/road-view";
import type { RoadLook } from "@/lib/road-look";
import { isSeedlingCart } from "@/lib/road-storybook-work";
import { SeedlingWheelRotation, seedlingWheelDiameter } from "@/lib/road-seedling-wheel";

const asset = "/storybook-study/brekka-cart-wheel-v1.webp";

export class RoadSeedlingWheels {
  private rear?: Phaser.GameObjects.Image;
  private front?: Phaser.GameObjects.Image;
  private rotation = new SeedlingWheelRotation();

  constructor(private scene: Phaser.Scene) {}

  paint(
    state: RoadBattle,
    look: RoadLook,
    x: number,
    y: number,
    size: number,
    visible: boolean,
    reduced: boolean,
  ) {
    const cart = state.gathering;
    if (!visible || !look.storybookHeroes || !isSeedlingCart(look) || !cart) {
      this.rear?.setVisible(false);
      this.front?.setVisible(false);
      this.rotation.hide();
      return;
    }
    this.rear ??= this.scene.add.image(0, 0, asset);
    this.front ??= this.scene.add.image(0, 0, asset);
    const moving =
      cart.task === "carry" &&
      look.workers.length > 0 &&
      !state.enemies.some((enemy) => enemy.hp > 0);
    const angle = this.rotation.update(
      cart.x + 65,
      state.time,
      this.scene.scale.width,
      state.stage,
      size,
      moving,
      reduced,
    );
    const depth = 10 + (cart.lane ?? 0.82) * 10 - 0.1;
    this.rear
      .setVisible(true)
      .setDisplaySize(size * seedlingWheelDiameter, size * seedlingWheelDiameter)
      .setPosition(x - size * 0.04, y - (size * seedlingWheelDiameter) / 2)
      .setDepth(depth - 0.01)
      .setRotation(angle);
    this.front
      .setVisible(true)
      .setDisplaySize(size * seedlingWheelDiameter, size * seedlingWheelDiameter)
      .setPosition(x - size * 0.264, y - (size * seedlingWheelDiameter) / 2)
      .setDepth(depth + 0.01)
      .setRotation(angle);
    this.rear.setTint(look.night ? 0xd1d1d1 : 0xffffff);
    this.front.setTint(look.night ? 0xd1d1d1 : 0xffffff);
  }
}
