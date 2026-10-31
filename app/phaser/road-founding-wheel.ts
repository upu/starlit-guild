import type Phaser from "phaser";
import type { RoadBattle } from "../../lib/road-view.ts";
import { foundingWheel } from "../../lib/road-founding-wheel.ts";
import { RoadWheelRotation } from "../../lib/road-wheel-rotation.ts";
import { tradeWheelAsset } from "../../lib/road-trade-cart-wheels.ts";

/** Rotate inside a fixed perspective squash so the wheel outline never wobbles. */
export class RoadFoundingWheel {
  private group?: Phaser.GameObjects.Container;
  private wheel?: Phaser.GameObjects.Image;
  private rotation = new RoadWheelRotation(foundingWheel.width);
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  paint(
    state: RoadBattle,
    visible: boolean,
    x: number,
    y: number,
    size: number,
    depth: number,
    reduced: boolean,
  ) {
    const cart = state.journeyCart;
    if (!visible || !cart) {
      this.group?.setVisible(false);
      this.rotation.hide();
      return;
    }
    if (!this.group) {
      this.wheel = this.scene.add.image(0, 0, tradeWheelAsset);
      this.group = this.scene.add.container(0, 0, [this.wheel]);
    }
    const angle = this.rotation.update(
      cart.x,
      state.time,
      this.scene.scale.width,
      state.stage,
      size,
      cart.phase === "moving",
      reduced,
    );
    this.wheel
      ?.setDisplaySize(size * foundingWheel.height, size * foundingWheel.height)
      .setRotation(angle);
    this.group
      .setVisible(true)
      .setPosition(x + size * foundingWheel.x, y + size * foundingWheel.y)
      .setScale(foundingWheel.width / foundingWheel.height, 1)
      .setDepth(depth + 0.01);
  }
}
