import type Phaser from "phaser";
import {
  ROOM,
  furnitureCatalog,
  furnitureSpots,
  cellPoint,
  type Furniture,
  type RoomSite,
} from "@/lib/home-room-layout";
import { residentFrame } from "@/lib/home-actor";
import type { Resident } from "@/lib/home-room-life";

export const homeAsset = (name: string) => `/home-pixel/${name}.webp`;
export class HomeRoomArt {
  private images = new Map<string, Phaser.GameObjects.Image>();
  private used = new Set<string>();
  readonly marks: Phaser.GameObjects.Graphics;
  private bubbles = new Map<string, Phaser.GameObjects.Text>();
  constructor(private scene: Phaser.Scene) {
    this.marks = scene.add.graphics().setDepth(2000);
  }
  begin() {
    this.used.clear();
    this.marks.clear();
    for (const text of this.bubbles.values()) text.setVisible(false);
  }
  image(
    id: string,
    texture: string,
    x: number,
    y: number,
    width: number,
    depth: number,
    frame?: number,
  ) {
    this.used.add(id);
    let image = this.images.get(id);
    if (!image) {
      image = this.scene.add.image(x, y, texture, frame);
      this.images.set(id, image);
    }
    image
      .setTexture(texture, frame)
      .setOrigin(0.5, 1)
      .setPosition(x, y)
      .setDepth(depth)
      .setVisible(true)
      .setFlipX(false)
      .setAngle(0)
      .setAlpha(1);
    image.setDisplaySize(width, (width * image.frame.height) / image.frame.width);
    return image;
  }
  background(site: RoomSite) {
    for (let y = 0; y < ROOM.rows; y++)
      for (let x = 0; x < ROOM.columns; x++) {
        const tile = floorTile(site, x, y);
        this.image(
          `floor-${String(x)}-${String(y)}`,
          homeAsset(`tile-${String(tile)}`),
          x * 24 + 12,
          y * 24 + 24,
          24,
          -1000,
        );
      }
    if (site === "home") this.image("notice", homeAsset("prop-10"), 205, 66, 95, -900);
  }
  furniture(item: Furniture, growth?: number) {
    const data = furnitureCatalog[item.kind],
      x = (item.x + data.w / 2) * 24,
      bottom = (item.y + data.h) * 24;
    let width = data.w * 24,
      y = bottom,
      depth = bottom - 4;
    if (item.kind === "table") {
      width = 132;
      y = bottom - 11;
      depth = bottom - 39;
      this.chairs(item);
    }
    if (item.kind === "rug") depth = -800;
    if (item.kind === "bookcase") width = 55;
    this.image(`f-${item.id}`, homeAsset(`prop-${String(data.frame)}`), x, y, width, depth);
    if (item.kind === "plot" && growth !== undefined) this.crops(item, growth, bottom);
  }
  private chairs(item: Furniture) {
    for (let i = 0; i < 6; i++) {
      const { x, y } = cellPoint(furnitureSpots(item)[i]);
      this.image(
        `chair-${item.id}-${String(i)}`,
        homeAsset(i % 2 === 0 ? "prop-1" : "prop-2"),
        x,
        y + 6,
        28,
        y - 1,
      );
    }
  }
  private crops(item: Furniture, growth: number, bottom: number) {
    for (let i = 0; i < 2; i++) {
      this.image(
        `crop-${item.id}-${String(i)}`,
        homeAsset(growth >= 0.7 ? "prop-8" : "prop-7"),
        (item.x + 1.2 + i * 1.6) * 24,
        bottom - 29,
        30,
        bottom + 1,
      );
    }
    const x = item.x * 24,
      width = furnitureCatalog.plot.w * 24;
    this.marks.fillStyle(0x213628, 0.95).fillRoundedRect(x, bottom + 3, width, 6, 2);
    this.marks
      .fillStyle(0xbacf78)
      .fillRoundedRect(x + 1, bottom + 4, (width - 2) * Math.max(0.02, growth), 4, 1);
  }
  resident(r: Resident, time: number, reduced: boolean) {
    const greeting = time < r.greetUntil;
    const pose = greeting && r.pose !== "tea" ? "wave" : r.pose;
    const frame = residentFrame(pose, time + r.phase, reduced);
    const bob = !reduced && pose === "walk" ? Math.sin((time / 160) * Math.PI) * 0.6 : 0;
    const y = r.y + (pose === "tea" ? -1 : 0);
    const image = this.image(`r-${r.id}`, homeAsset(r.id), r.x, y + bob + 4, 80, r.y + 1, frame);
    image.setFlipX(r.left);
    if (greeting) this.bubble(r, "♥", time, reduced);
    else if (pose === "tea" && (time + r.phase) % 13000 < 3500) this.bubble(r, "♪", time, reduced);
    else if (pose === "paper" && (time + r.phase) % 16000 < 4000)
      this.bubble(r, "…", time, reduced);
    this.effects(r, pose, time, reduced);
  }
  private bubble(r: Resident, symbol: string, time: number, reduced: boolean) {
    let label = this.bubbles.get(r.id);
    if (!label) {
      label = this.scene.add
        .text(0, 0, "", {
          fontFamily: "sans-serif",
          fontSize: "13px",
          color: "#623e26",
          backgroundColor: "#fff2d7",
          padding: { x: 4, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(2100);
      this.bubbles.set(r.id, label);
    }
    label
      .setText(symbol)
      .setPosition(r.x + 18, r.y - 66 - (reduced ? 0 : Math.sin(time / 450) * 1.2))
      .setVisible(true);
  }
  private effects(r: Resident, pose: string, time: number, reduced: boolean) {
    if (reduced) return;
    const sign = r.left ? -1 : 1,
      phase = ((time + r.phase) % 1800) / 1800;
    if (pose === "tea")
      this.marks
        .fillStyle(0xfff6df, (1 - phase) * 0.7)
        .fillCircle(r.x + sign * 8, r.y - 25 - phase * 15, 1.2);
    if (pose === "craft" && time % 880 < 160)
      this.marks.fillStyle(0xf3cb74, 0.8).fillRect(r.x + sign * 22, r.y - 23, 2, 2);
    if (pose === "garden")
      this.marks
        .fillStyle(0x89bdd1, 0.9)
        .fillRect(r.x + sign * (20 + phase * 8), r.y - 20 + phase * 18, 1, 3);
  }
  grid(items: Furniture[], selected?: string, ghost?: Furniture, error = false) {
    this.marks.lineStyle(0.6, 0xfde3aa, 0.25);
    for (let x = 0; x <= ROOM.width; x += 24) this.marks.lineBetween(x, 72, x, ROOM.height);
    for (let y = 72; y <= ROOM.height; y += 24) this.marks.lineBetween(0, y, ROOM.width, y);
    const item = ghost ?? items.find((f) => f.id === selected);
    if (!item) return;
    const { w, h } = furnitureCatalog[item.kind];
    this.marks
      .lineStyle(2, error ? 0xf1997f : 0xdce793, 1)
      .strokeRect(item.x * 24, item.y * 24, w * 24, h * 24);
    this.marks
      .fillStyle(error ? 0xe7886c : 0xb8d482, 0.18)
      .fillRect(item.x * 24, item.y * 24, w * 24, h * 24);
  }
  finish() {
    for (const [key, image] of this.images) if (!this.used.has(key)) image.setVisible(false);
  }
}

function floorTile(site: RoomSite, x: number, y: number) {
  if (site !== "home") return y < 3 || x % 5 === 0 ? 1 : 3;
  if (y < 2) return 4;
  return y === 2 ? 5 : 0;
}
