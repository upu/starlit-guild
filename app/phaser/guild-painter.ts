import type Phaser from "phaser";
import type { State } from "@/lib/game";
import { GuildSprites } from "./guild-sprites";
import { GuildMenuPainter } from "./guild-menu-painter";
export type GuildFrame = {
  state: State;
  site: "shop";
  now: number;
  selected?: string;
};
// The only caller is GuildCatalog. Home and gardens use HomeRoomGame.
export function guildAssets() {
  return ["/guild/home-floor-v2.webp", "/guild/furniture-v3.webp", "/guild/goods-v3.webp"];
}
export class GuildPainter {
  private sprites: GuildSprites;
  private menu: GuildMenuPainter;
  constructor(private scene: Phaser.Scene) {
    this.sprites = new GuildSprites(scene);
    this.menu = new GuildMenuPainter(this.sprites);
  }
  paint(input: GuildFrame, reduced: boolean) {
    this.sprites.clear();
    this.menu.clear();
    this.sprites
      .image("floor", "/guild/home-floor-v2.webp")
      .setOrigin(0)
      .setPosition(0, 0)
      .setDisplaySize(this.scene.scale.width, this.scene.scale.height)
      .setDepth(-1000);
    this.menu.paint(input, reduced);
  }
}
