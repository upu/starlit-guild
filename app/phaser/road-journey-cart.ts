import type Phaser from "phaser";
import type { RoadBattle } from "@/lib/road-view";
import { foundingCartAsset, journeyCartWidth } from "@/lib/road-journey-cart";
import { roadX, roadY, roadFigureDepth } from "@/lib/road-layout";
import type { RoadLook } from "@/lib/road-look";
import { tradeCartBodies } from "@/lib/road-trade-cart-wheels";
import { RoadTradeWheels } from "./road-trade-wheels";
import { RoadFoundingWheel } from "./road-founding-wheel";
import { foundingCartBody } from "@/lib/road-founding-wheel";
import {
  foundingCargoPosition,
  foundingCargoSize,
  type FoundingCargo,
} from "@/lib/road-founding-cargo";
export class RoadJourneyCart {
  private image?: Phaser.GameObjects.Image;
  private cargo = new Map<string, Phaser.GameObjects.Image>();
  private wheels: RoadTradeWheels;
  private foundingWheel: RoadFoundingWheel;
  constructor(private scene: Phaser.Scene) {
    this.wheels = new RoadTradeWheels(scene);
    this.foundingWheel = new RoadFoundingWheel(scene);
  }
  paint(state: RoadBattle, reduced: boolean, look?: RoadLook) {
    const cart = state.journeyCart;
    if (!cart) {
      this.image?.setVisible(false);
      this.wheels.paint(state, false, 0, 0, 0, 0, reduced);
      this.foundingWheel.paint(state, false, 0, 0, 0, 0, reduced);
      for (const item of this.cargo.values()) item.setVisible(false);
      return;
    }
    const asset =
      cart.asset ??
      (cart.returning
        ? "/storybook-study/return-cart-v1.webp"
        : "/storybook-study/loaded-cart-v1.webp");
    this.image ??= this.scene.add.image(0, 0, asset).setOrigin(0.5, 268 / 280);
    const { width, height } = this.scene.scale,
      size = journeyCartWidth({ width, height }, cart);
    const founding = asset === foundingCartAsset;
    const x = roadX(cart.x, state.distance, width, state.stage),
      y = roadY(cart.lane, height, width),
      depth = roadFigureDepth(cart.lane, this.scene.scale, look);
    this.image
      .setVisible(true)
      .setTexture(founding ? foundingCartBody : (tradeCartBodies[asset] ?? asset))
      .setOrigin(0.5, founding ? 292 / 312 : 268 / 280)
      .setDisplaySize(size, (size * (founding ? 312 : 280)) / (founding ? 504 : 420))
      .setPosition(x, y)
      .setDepth(depth - 0.1);
    this.wheels.paint(state, !!tradeCartBodies[asset], x, y, size, depth - 0.1, reduced, asset);
    this.foundingWheel.paint(state, founding, x, y, size, depth - 0.1, reduced);
    this.paintCargo(founding, x, y, size, depth, cart.cargo);
  }

  private paintCargo(
    visible: boolean,
    x: number,
    y: number,
    size: number,
    depth: number,
    cargo?: FoundingCargo,
  ) {
    for (const item of this.cargo.values()) item.setVisible(false);
    if (!visible) return;
    for (const kind of ["basket", "letter"] as const) {
      const slots = cargo?.slots?.[kind] ?? [cargo?.[kind] ?? true];
      slots.forEach((shown, index) => {
        if (!shown) return;
        const key = `${kind}-${String(index)}`;
        const asset =
          kind === "basket"
            ? "/storybook-study/basket-v1.webp"
            : "/storybook-study/shipping-record-v1.webp";
        let image = this.cargo.get(key);
        if (!image) {
          image = this.scene.add.image(0, 0, asset).setOrigin(0.5);
          this.cargo.set(key, image);
        }
        const [dx, dy] = foundingCargoPosition(kind, index);
        const w = size * foundingCargoSize[kind];
        const source = image.texture.getSourceImage() as HTMLImageElement;
        image
          .setVisible(true)
          .setDisplaySize(w, (w * source.height) / source.width)
          .setPosition(x + size * dx, y + size * dy)
          .setDepth(depth - 0.09 + index * 0.001);
      });
    }
  }
}
