import type Phaser from "phaser";
import type { RoadBattle } from "@/lib/road-view";
import { RoadWheelRotation } from "@/lib/road-wheel-rotation";
import {
  tradeWheelAsset,
  tradeWheelLayout,
  tradeWheelLayoutFor,
} from "@/lib/road-trade-cart-wheels";

export class RoadTradeWheels {
  private front?: Phaser.GameObjects.Image;
  private rear?: Phaser.GameObjects.Image;
  private rotation = new RoadWheelRotation(tradeWheelLayout.front.diameter);
  constructor(private scene: Phaser.Scene) {}

  paint(
    state: RoadBattle,
    visible: boolean,
    x: number,
    y: number,
    size: number,
    depth: number,
    reduced: boolean,
    asset?: string,
  ) {
    const cart = state.journeyCart;
    if (!visible || !cart) {
      this.front?.setVisible(false);
      this.rear?.setVisible(false);
      this.rotation.hide();
      return;
    }
    this.front ??= this.scene.add.image(0, 0, tradeWheelAsset);
    this.rear ??= this.scene.add.image(0, 0, tradeWheelAsset);
    const angle = this.rotation.update(
      cart.x,
      state.time,
      this.scene.scale.width,
      state.stage,
      size,
      cart.phase === "moving",
      reduced,
    );
    const { front, rear } = tradeWheelLayoutFor(asset);
    this.rear
      .setVisible(true)
      .setDisplaySize(size * rear.diameter, size * rear.diameter)
      .setPosition(x + size * rear.x, y + size * rear.y)
      .setDepth(depth - 0.01)
      .setRotation((angle * front.diameter) / rear.diameter);
    this.front
      .setVisible(true)
      .setDisplaySize(size * front.diameter, size * front.diameter)
      .setPosition(x + size * front.x, y + size * front.y)
      .setDepth(depth + 0.01)
      .setRotation(angle);
  }
}
