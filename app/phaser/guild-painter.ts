import type Phaser from "phaser";
import type { State } from "@/lib/game";
import type { TravellerId } from "@/lib/road-view";
import {
  guildStageLayout,
  guildRoute,
  guildStagePeople,
  guildStagePlots,
  type GuildSite,
} from "@/lib/guild-stage-model";
import {
  guildIds,
  guildPose,
  guildPropsAsset,
  guildPropFrames,
  type GuildPoseKind,
} from "./guild-art";

export type GuildFrame = { state: State; site: GuildSite; now: number };
export function guildAssets() {
  return [
    ...new Set([
      ...["home", "linde", "brekka"].map((site) => `/guild/${site}-floor-v2.webp`),
      guildPropsAsset,
      ...guildIds.flatMap((id) =>
        (["idle", "walk", "tend", "craft"] as const).map((mode) => guildPose(id, mode, 0).asset),
      ),
    ]),
  ];
}
export class GuildPainter {
  private objects = new Map<string, Phaser.GameObjects.Image>();
  private tool: Phaser.GameObjects.Graphics;
  private elapsed = 0;
  constructor(private scene: Phaser.Scene) {
    this.tool = scene.add.graphics();
  }
  private image(key: string, asset: string, rect?: readonly number[]) {
    const name = rect?.join("-");
    const texture = this.scene.textures.get(asset);
    if (name && rect && !texture.has(name))
      texture.add(name, 0, rect[0], rect[1], rect[2], rect[3]);
    let image = this.objects.get(key);
    if (!image) {
      image = this.scene.add.image(0, 0, asset, name);
      this.objects.set(key, image);
    }
    image.setTexture(asset, name).setVisible(true);
    return image;
  }
  private place(image: Phaser.GameObjects.Image, x: number, y: number, width: number, depth = y) {
    const w = this.scene.scale.width,
      h = this.scene.scale.height;
    image
      .setOrigin(0.5, 1)
      .setPosition((x * w) / 1000, (y * h) / 750)
      .setDisplaySize(
        (width * w) / 1000,
        ((image.frame.height / image.frame.width) * width * w) / 1000,
      )
      .setDepth(depth);
  }
  private prop(key: string, frame: number, place: { x: number; y: number; width: number }) {
    const image = this.image(key, guildPropsAsset, guildPropFrames[frame]);
    this.place(image, place.x, place.y, place.width);
    return image;
  }
  private actor(
    id: TravellerId,
    mode: GuildPoseKind,
    x: number,
    y: number,
    left: boolean,
    reduced: boolean,
  ) {
    const frame = guildPose(
      id,
      mode,
      reduced ? 0 : Math.floor(this.elapsed / (mode === "walk" ? 160 : 550)),
    );
    const image = this.image(`hero-${id}`, frame.asset, frame.rect);
    this.place(image, x, y, frame.rect[2] * frame.scale * 175);
    image.setFlipX(left);
  }
  paint(input: GuildFrame, delta: number, reduced: boolean) {
    this.elapsed += Math.min(delta, 100);
    for (const object of this.objects.values()) object.setVisible(false);
    this.tool.clear();
    this.image("floor", `/guild/${input.site}-floor-v2.webp`)
      .setOrigin(0)
      .setPosition(0, 0)
      .setDisplaySize(this.scene.scale.width, this.scene.scale.height)
      .setDepth(-1000);
    if (input.site === "home") this.home(input, reduced);
    else this.garden(input);
    const active =
      input.site === "home" ||
      guildStagePlots(input.site).some((id) => !!input.state.guild?.plots[id].batch);
    guildStagePeople(input.state, input.site).forEach((id, index) => {
      if (!guildIds.includes(id as TravellerId)) return;
      const point = guildRoute(index, input.site, this.elapsed, reduced || !active);
      const mode = point.walking ? "walk" : input.site !== "home" && active ? "tend" : "idle";
      this.actor(id as TravellerId, mode, point.x, point.y, point.left, reduced);
    });
  }
  private home({ state, now }: GuildFrame, reduced: boolean) {
    this.prop("table", 0, guildStageLayout.table);
    this.prop("bench", 1, guildStageLayout.bench);
    const id = state.guild?.roles.workbench;
    const work = state.guild?.work;
    const active = !!work?.batch && work.batch.readyAt > now && work.pausedMs === undefined;
    if (id && guildIds.includes(id as TravellerId))
      this.actor(
        id as TravellerId,
        active ? "craft" : "idle",
        guildStageLayout.worker.x,
        guildStageLayout.worker.y,
        false,
        reduced,
      );
    if (work) this.tools(work.recipe, active && !!id && !reduced);
  }
  private tools(recipe: string, active: boolean) {
    const sx = this.scene.scale.width / 1000,
      sy = this.scene.scale.height / 750;
    const phase = active ? Math.sin(this.elapsed / 180) : 0;
    this.tool
      .setPosition(595 * sx, 285 * sy)
      .setScale(sx)
      .setDepth(391);
    if (recipe === "lunch") {
      this.tool.fillStyle(0xefd7a1).fillEllipse(20, 16, 65, 32);
      this.tool.lineStyle(12, 0xb68146).lineBetween(-8, 8 + phase * 5, 48, 8 + phase * 5);
    } else if (recipe === "soda") {
      this.tool.fillStyle(0x79a994).fillRoundedRect(8 + phase * 4, -20, 27, 47, 6);
      this.tool.fillStyle(0xdcc18a).fillRect(13 + phase * 4, -26, 17, 8);
    } else {
      this.tool.fillStyle(0xb1b59b).fillRoundedRect(-10, 0, 57, 34, 10);
      this.tool.fillStyle(0x617d55).fillEllipse(18, 0, 58, 18);
      this.tool.lineStyle(5, 0xe4c696).lineBetween(18 + phase * 10, 0, 28 + phase * 8, -35);
    }
  }
  private garden({ state, site, now }: GuildFrame) {
    for (const id of guildStagePlots(site)) {
      const place = guildStageLayout.plots[id];
      const bed = this.prop(id, 2, place);
      const plot = state.guild?.plots[id],
        batch = plot?.batch;
      if (!batch) continue;
      const growth = Math.min(
        1,
        Math.max(0, (now - batch.startedAt) / Math.max(1, batch.readyAt - batch.startedAt)),
      );
      const frame = plot.crop === "carrot" ? 4 : plot.crop === "moss" ? 5 : 3;
      this.crops(id, place, bed.displayHeight, growth, frame);
    }
  }
  private crops(
    id: string,
    place: { x: number; y: number; width: number },
    height: number,
    growth: number,
    frame: number,
  ) {
    for (let n = 0; n < 8; n++) {
      const crop = this.image(`${id}-crop-${String(n)}`, guildPropsAsset, guildPropFrames[frame]);
      const x = place.x + ((n % 4) - 1.5) * place.width * 0.19;
      const offset = (Math.floor(n / 4) === 0 ? 0.56 : 0.34) * height;
      this.place(
        crop,
        x,
        place.y - (offset * 750) / this.scene.scale.height,
        place.width * (0.085 + growth * 0.055),
        place.y + 1 + n,
      );
    }
  }
}
