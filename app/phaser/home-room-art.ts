import type Phaser from "phaser";
import { ROOM, furnitureCatalog, type Furniture, type RoomSite } from "@/lib/home-room-layout";
import {
  residentArt,
  residentAnimation,
  residentAtlas,
  residentScale,
  residentSolePadding,
} from "@/lib/home-actor";
import { homeFloor, gardenScenery } from "@/lib/home-room-scenery";
import type { Resident } from "@/lib/home-room-life";
import { homeSocialCue } from "@/lib/home-room-social";
import { gardenPlantings, gardenRoot, gardenWater, gardenWetness } from "@/lib/home-garden-water";
import {
  homeFurnitureScale,
  residentDisplayPosition,
  residentDisplayCell,
  teaChairPosition,
} from "@/lib/home-room-presentation";

export const homeAsset = (name: string) => `/home-pixel/${name}.webp`;
export class HomeRoomArt {
  private images = new Map<string, Phaser.GameObjects.Image>();
  private used = new Set<string>();
  private plants = new Map<string, ReturnType<typeof gardenPlantings>>();
  readonly marks: Phaser.GameObjects.Graphics;
  constructor(private scene: Phaser.Scene) {
    this.marks = scene.add.graphics().setDepth(2000);
  }
  begin() {
    this.used.clear();
    this.plants.clear();
    this.marks.clear();
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
      .clearTint()
      .setAlpha(1);
    image.setDisplaySize(width, (width * image.frame.height) / image.frame.width);
    return image;
  }
  background(site: RoomSite) {
    for (let y = 0; y < ROOM.rows; y++)
      for (let x = 0; x < ROOM.columns; x++) {
        const { tile, tint } = homeFloor(site, x, y);
        this.image(
          `floor-${String(x)}-${String(y)}`,
          homeAsset(`tile-${String(tile)}`),
          x * 24 + 12,
          y * 24 + 24,
          24,
          -1000,
        ).setTint(tint);
      }
    if (site === "home") this.image("notice", homeAsset("prop-10"), 205, 66, 95, -900);
    else
      for (const [index, item] of gardenScenery[site].entries())
        this.image(
          `scenery-${String(index)}`,
          homeAsset(`decor-${String(item.frame)}`),
          item.x,
          item.y,
          item.width,
          -900,
        );
  }
  furniture(item: Furniture, growth: number | undefined, residents: Resident[], site: RoomSite) {
    const data = furnitureCatalog[item.kind],
      x = (item.x + data.w / 2) * 24,
      bottom = (item.y + data.h) * 24;
    let width = data.w * 24,
      y = bottom,
      depth = bottom - 4;
    if (item.kind === "table") {
      width = 132 * homeFurnitureScale;
      y = bottom - 11;
      depth = bottom - 39 * homeFurnitureScale;
      this.chairs(item, residents);
    }
    if (item.kind === "rug") depth = -800;
    if (item.kind === "bench" || item.kind === "desk") width *= homeFurnitureScale;
    if (item.kind === "bookcase") width = 55;
    this.image(`f-${item.id}`, homeAsset(`prop-${String(data.frame)}`), x, y, width, depth);
    if (item.kind === "plot" && growth !== undefined) this.crops(item, growth, bottom, site);
  }
  private chairs(item: Furniture, residents: Resident[]) {
    for (let i = 0; i < 6; i++) {
      if (residents.some((r) => r.pose === "tea" && r.furniture === item.id && r.seat === i))
        continue;
      const { x, y } = teaChairPosition(item, i);
      this.image(
        `chair-${item.id}-${String(i)}`,
        homeAsset(i % 2 === 0 ? "prop-1" : "prop-2"),
        x,
        y + 6 * residentScale,
        28 * residentScale,
        y - 1,
      );
    }
  }
  private crops(item: Furniture, growth: number, bottom: number, site: RoomSite) {
    const plants = gardenPlantings(item, growth, site);
    this.plants.set(item.id, plants);
    for (const [i, plant] of plants.entries()) {
      this.image(
        `crop-${item.id}-${String(i)}`,
        homeAsset(plant.texture),
        plant.x,
        plant.y,
        plant.width,
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
  resident(r: Resident, time: number, reduced: boolean, furniture: Furniture[]) {
    r = { ...r, ...residentDisplayPosition(r, furniture) };
    const greeting = time < r.greetUntil;
    const social = homeSocialCue(r, time);
    const pose =
      (greeting && ["idle", "walk", "garden"].includes(r.pose)) || social?.wave ? "wave" : r.pose;
    const { frame, bob, action } = residentAnimation(
      pose,
      social && pose === "tea" ? 0 : time + r.phase,
      r.walkDistance,
      reduced,
      r.rear,
    );
    const y = r.y + (pose === "tea" ? -1 : 0);
    const atlas = residentAtlas(r.id, pose, frame, action, r.left);
    const displayCell = residentDisplayCell(r);
    const image = this.image(
      `r-${r.id}`,
      homeAsset(atlas.name),
      r.x,
      y + (residentSolePadding * displayCell) / residentArt.displayCell + bob,
      displayCell,
      // The gardener stands beside the box; the can reaches over its side rim.
      r.y + (pose === "garden" ? 25 : 1),
      atlas.frame,
    );
    image.setDisplaySize(displayCell, displayCell);
    // Back-view tools have authored handedness: Lico left, the others right.
    // Never mirror a work frame or its tool would change hands.
    image.setFlipX(atlas.flip);
    this.residentBubble(r, pose, time, reduced);
    this.effects(r, pose, time, reduced);
  }
  private residentBubble(r: Resident, pose: string, time: number, reduced: boolean) {
    const greeting = time < r.greetUntil;
    const social = homeSocialCue(r, time);
    if (greeting) this.bubble(r, "♥", time, reduced);
    else if (social?.symbol) this.bubble(r, social.symbol, time, reduced);
    else if (!social && pose === "tea" && (time + r.phase) % 13000 < 3500)
      this.bubble(r, "♪", time, reduced);
    else if (pose === "paper" && (time + r.phase) % 16000 < 4000)
      this.bubble(r, "…", time, reduced);
  }
  private bubble(r: Resident, symbol: string, time: number, reduced: boolean) {
    const frame = symbol === "♪" ? 0 : symbol === "♥" ? 1 : 2;
    const scale = (residentScale * residentDisplayCell(r)) / residentArt.displayCell;
    this.image(
      `emote-${r.id}`,
      homeAsset(`icons-${String(frame)}`),
      r.x + 19 * scale,
      r.y - 57 * scale - (reduced ? 0 : Math.sin(time / 450) * 1.2),
      symbol === "…" ? 16 : 11,
      2100,
    );
  }
  private effects(r: Resident, pose: string, time: number, reduced: boolean) {
    if (reduced) return;
    const scale = (residentScale * residentDisplayCell(r)) / residentArt.displayCell;
    const sign = r.left ? -1 : 1,
      phase = ((time + r.phase) % 1800) / 1800;
    if (pose === "tea")
      this.marks
        .fillStyle(0xfff6df, (1 - phase) * 0.7)
        .fillCircle(r.x + sign * 8 * scale, r.y - (25 + phase * 15) * scale, 1.2);
    if (pose === "garden") this.water(r, time + r.phase);
  }
  private water(r: Resident, time: number) {
    const plants = r.furniture ? this.plants.get(r.furniture) : undefined;
    if (!plants) return;
    const root = gardenRoot(plants, r.id),
      target = { x: root.x - r.x, y: root.y - r.y },
      streams = gardenWater(r.id, time, target);
    this.marks.fillStyle(0x324e40, gardenWetness(time) * 0.6).fillEllipse(root.x, root.y + 1, 6, 2);
    for (const stream of streams) {
      this.marks.lineStyle(0.45, 0xb6e3ee, stream.alpha).beginPath();
      stream.points.forEach((p, i) => {
        if (i === 0) this.marks.moveTo(r.x + p.x, r.y + p.y);
        else this.marks.lineTo(r.x + p.x, r.y + p.y);
      });
      this.marks.strokePath();
    }
    if (streams.length)
      this.marks
        .fillStyle(0xb6e3ee, 0.8)
        .fillRect(root.x - 1.5, root.y - 0.5, 1, 1)
        .fillRect(root.x + 1, root.y - 1, 1, 1);
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
