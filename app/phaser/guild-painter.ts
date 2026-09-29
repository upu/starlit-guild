import type Phaser from "phaser";
import type { State } from "@/lib/game";
import type { TravellerId } from "@/lib/road-view";
import {
  guildStageLayout,
  guildWorkActive,
  guildRoute,
  guildStagePeople,
  guildStagePlots,
  guildSeats,
  guildCropSlots,
  guildCropWidth,
  type GuildSite,
} from "@/lib/guild-stage-model";
import { guildIds, guildPose, guildPropsAsset, guildPropFrames } from "./guild-art";
import { GuildSprites } from "./guild-sprites";
import { GuildMenuPainter } from "./guild-menu-painter";
export type GuildFrame = {
  state: State;
  site: GuildSite | "workbench" | "shop";
  now: number;
  selected?: string;
};
export function guildAssets() {
  return [
    ...new Set([
      ...["home", "linde", "brekka"].map((site) => `/guild/${site}-floor-v2.webp`),
      ...["furniture-v3", "goods-v3", "tea-party-v3"].map((name) => `/guild/${name}.webp`),
      guildPropsAsset,
      ...guildIds.flatMap((id) =>
        (["idle", "walk", "tend", "craft", "tea"] as const).map(
          (mode) => guildPose(id, mode, 0).asset,
        ),
      ),
    ]),
  ];
}
export class GuildPainter {
  private sprites: GuildSprites;
  private menu: GuildMenuPainter;
  private effects: Phaser.GameObjects.Graphics;
  private elapsed = 0;
  constructor(private scene: Phaser.Scene) {
    this.sprites = new GuildSprites(scene);
    this.menu = new GuildMenuPainter(this.sprites);
    this.effects = scene.add.graphics().setDepth(1200);
  }
  paint(input: GuildFrame, delta: number, reduced: boolean) {
    this.elapsed += Math.min(delta, 100);
    this.sprites.clear();
    this.effects.clear();
    this.menu.clear();
    const menu = input.site === "shop" || input.site === "workbench";
    const floor = menu ? "home" : input.site;
    this.sprites
      .image("floor", `/guild/${floor}-floor-v2.webp`)
      .setOrigin(0)
      .setPosition(0, 0)
      .setDisplaySize(this.scene.scale.width, this.scene.scale.height)
      .setDepth(-1000);
    if (input.site === "home") this.home(input, reduced);
    else if (input.site === "workbench") this.workbench(input, reduced, true);
    else if (input.site !== "shop") this.garden(input, reduced);
    if (menu) this.menu.paint(input, reduced);
  }
  private home(input: GuildFrame, reduced: boolean) {
    this.sprites.room("desk", "furniture-v3", 2, guildStageLayout.desk);
    this.sprites.room("table", "furniture-v3", 0, guildStageLayout.table);
    this.workbench(input, reduced);
    guildStagePeople(input.state, "home", input.now).forEach((id) => {
      if (!guildIds.includes(id as TravellerId)) return;
      const index = guildIds.indexOf(id as TravellerId);
      const seat = guildSeats[index];
      this.sprites.room(
        `chair-${id}`,
        "furniture-v3",
        seat.left ? 4 : 3,
        { ...seat, y: seat.y + 30, width: 140 },
        seat.y - 1,
      );
      this.sprites.actor(id as TravellerId, "tea", seat, this.elapsed + index * 1370, reduced, 160);
    });
  }
  private workbench({ state, now }: GuildFrame, reduced: boolean, close = false) {
    const bench = close ? { x: 650, y: 505, width: 540 } : guildStageLayout.bench;
    const worker = close ? { x: 275, y: 500 } : guildStageLayout.worker;
    this.sprites.room("bench", "furniture-v3", 1, bench);
    const active = guildWorkActive(state, now);
    if (close || active)
      this.workActor(state.guild?.roles.workbench, worker, active, reduced, close ? 280 : 175);
    if (active) this.steam(close ? 455 : 660, close ? 310 : 235, reduced);
  }
  private workActor(
    id: string | undefined,
    worker: { x: number; y: number },
    active: boolean,
    reduced: boolean,
    height: number,
  ) {
    if (!id || !guildIds.includes(id as TravellerId)) return;
    const image = this.sprites.actor(
      id as TravellerId,
      active ? "craft" : "idle",
      worker,
      this.elapsed,
      reduced,
      height,
    );
    if (active && !reduced) image.setAngle(Math.sin(this.elapsed / 330) * 1.2);
  }
  private steam(x: number, y: number, reduced: boolean) {
    const sx = this.scene.scale.width / 1000,
      sy = this.scene.scale.height / 750;
    for (let n = 0; n < 4; n++) {
      const life = reduced ? 0.4 : (this.elapsed / 2600 + n / 4) % 1;
      this.effects
        .fillStyle(0xf9efd6, (1 - life) * 0.4)
        .fillCircle(
          (x + Math.sin(n + life * 5) * 8) * sx,
          (y - life * 48) * sy,
          (2 + life * 5) * sx,
        );
    }
  }
  private garden(input: GuildFrame, reduced: boolean) {
    const site = input.site as GuildSite;
    for (const id of guildStagePlots(site)) {
      const place = guildStageLayout.plots[id];
      const bed = this.sprites.place(
        this.sprites.image(id, guildPropsAsset, guildPropFrames[2]),
        place.x,
        place.y,
        place.width,
      );
      const plot = input.state.guild?.plots[id],
        batch = plot?.batch;
      if (!batch) continue;
      const growth = Math.min(
        1,
        Math.max(0, (input.now - batch.startedAt) / Math.max(1, batch.readyAt - batch.startedAt)),
      );
      this.crops(
        id,
        place,
        bed.displayHeight,
        growth,
        plot.crop === "carrot" ? 4 : plot.crop === "moss" ? 5 : 3,
      );
    }
    const active = guildStagePlots(site).some((id) => !!input.state.guild?.plots[id].batch);
    guildStagePeople(input.state, site).forEach((id, index) => {
      if (!guildIds.includes(id as TravellerId)) return;
      const point = guildRoute(index, site, this.elapsed, reduced || !active);
      this.sprites.actor(
        id as TravellerId,
        point.walking ? "walk" : active ? "tend" : "idle",
        point,
        this.elapsed,
        reduced,
      );
    });
  }
  private crops(
    id: string,
    place: { x: number; y: number; width: number },
    height: number,
    growth: number,
    frame: number,
  ) {
    guildCropSlots.forEach((slot, n) => {
      const crop = this.sprites.image(
        `${id}-crop-${String(n)}`,
        guildPropsAsset,
        guildPropFrames[frame],
      );
      this.sprites.place(
        crop,
        place.x + (slot.x - 0.5) * place.width,
        place.y - ((1 - slot.y) * height * 750) / this.scene.scale.height,
        place.width * guildCropWidth(growth),
        place.y + n + 1,
      );
    });
  }
}
