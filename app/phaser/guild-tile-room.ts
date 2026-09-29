import type Phaser from "phaser";
import { guildLabArt } from "@/lib/guild-lab-art";
import { guildRoomSprite } from "@/lib/guild-menu-model";
import type { GuildLabFilter } from "./guild-lab-filter";
import { LAB_TILE, LAB_WIDTH, LAB_HEIGHT, labFurniture, labStations } from "@/lib/guild-lab-model";
export class GuildTileRoom {
  private grid: Phaser.GameObjects.Graphics;
  constructor(
    private scene: Phaser.Scene,
    visit: (mode: "tea" | "work", pointer: Phaser.Input.Pointer) => void,
    private filter: GuildLabFilter,
  ) {
    this.layer(
      Array.from({ length: 16 }, (_, y) => Array.from({ length: 24 }, (_, x) => (x * 3 + y) % 2)),
      LAB_TILE,
      LAB_TILE * 2,
    );
    this.layer(
      [Array.from({ length: 12 }, (_, x) => (x === 2 || x === 8 ? 3 : 2))],
      LAB_TILE * 2,
      0,
    );
    for (const item of labFurniture) {
      const x = (item.col + item.cols / 2) * LAB_TILE;
      const y = (item.row + item.rows) * LAB_TILE;
      const sprite = guildRoomSprite("furniture-v3", item.frame);
      const texture = scene.textures.get(sprite.asset);
      const [left, top, width, height] = sprite.rect;
      if (!texture.has(item.id)) texture.add(item.id, 0, left, top, width, height);
      scene.add.ellipse(x, y - 9, item.cols * LAB_TILE * 0.9, 22, 0x251c14, 0.22).setDepth(y - 1);
      const image = scene.add.image(x, y, sprite.asset, item.id).setOrigin(0.5, 1);

      image
        .setDisplaySize(item.cols * LAB_TILE, (item.cols * LAB_TILE * height) / width)
        .setDepth(item.id === "chair" ? labStations.tea.y - 1 : y);
      this.filter.add(image);
      if (item.id === "table" || item.id === "bench" || item.id === "chair")
        image
          .setInteractive({ useHandCursor: true })
          .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            visit(item.id === "bench" ? "work" : "tea", pointer);
          });
    }
    this.grid = scene.add.graphics().setDepth(2000);
    this.workCup();
  }
  private workCup() {
    const asset = guildLabArt.asset;
    const [x, y, w, h] = guildLabArt.frames[12];
    this.scene.textures.get(asset).add("mixing-cup", 0, x, y, w, h);
    this.filter.add(
      this.scene.add
        .image(518, 172, asset, "mixing-cup")
        .setOrigin(0.5, 1)
        .setDisplaySize((9 * w) / h, 9)
        .setDepth(193),
    );
  }
  private layer(data: number[][], size: number, y: number) {
    const map = this.scene.make.tilemap({ data, tileWidth: 128, tileHeight: 128 });
    const tiles = map.addTilesetImage("room", "/guild/room-tiles-v1.webp", 128, 128, 2, 4);
    if (!tiles) throw new Error("Missing room tiles");
    map
      .createLayer(0, tiles, 0, y)
      .setScale(size / 128)
      .setDepth(-1000);
  }
  showGrid(show: boolean) {
    this.grid.clear();
    if (!show) return;
    this.grid.lineStyle(1, 0xffe7a6, 0.3);
    for (let x = 0; x <= LAB_WIDTH; x += LAB_TILE)
      this.grid.lineBetween(x, LAB_TILE * 2, x, LAB_HEIGHT);
    for (let y = LAB_TILE * 2; y <= LAB_HEIGHT; y += LAB_TILE)
      this.grid.lineBetween(0, y, LAB_WIDTH, y);
    this.grid.lineStyle(2, 0xffb665, 0.8);
    for (const item of labFurniture)
      this.grid.strokeRect(
        item.col * LAB_TILE,
        item.row * LAB_TILE,
        item.cols * LAB_TILE,
        item.rows * LAB_TILE,
      );
    this.grid.lineStyle(2, 0x87f2cf, 1);
    for (const point of Object.values(labStations)) this.grid.strokeCircle(point.x, point.y, 7);
  }
}
