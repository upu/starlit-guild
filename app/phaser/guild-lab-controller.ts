import type Phaser from "phaser";
import { GuildCutout } from "./guild-cutout";
import { GuildTileRoom } from "./guild-tile-room";
import { GuildLabFilter } from "./guild-lab-filter";
import { LabAffection } from "@/lib/guild-lab-affection";
import { labShadow } from "@/lib/guild-lab-contact";
import type { LabBridge } from "./guild-lab-game";
import {
  LAB_WIDTH,
  LAB_ACTOR_SCALE,
  LAB_WALK_SPEED,
  LAB_HEIGHT,
  labPath,
  labStations,
  labTravel,
  type LabPose,
} from "@/lib/guild-lab-model";
export class GuildLabController {
  private actor: GuildCutout;
  private room: GuildTileRoom;
  private shadow: Phaser.GameObjects.Ellipse;
  private filter: GuildLabFilter;
  private elapsed = 0;
  private distance = 0;
  private request = -1;
  private path = [labStations.tea];
  private activity: LabPose = "tea";
  private affection = new LabAffection();
  private greeted = 0;
  constructor(
    private scene: Phaser.Scene,
    private bridge: LabBridge,
  ) {
    this.filter = new GuildLabFilter(scene);
    this.actor = new GuildCutout(scene, this.filter);
    this.room = new GuildTileRoom(
      scene,
      (mode, pointer) => {
        if (!this.actor.hit(this.point(pointer))) bridge.visit(mode);
      },
      this.filter,
    );
    this.shadow = scene.add.ellipse(0, 0, 35, 3.8, 0x231b15, 0.22);
    this.actor.root.setPosition(labStations.tea.x, labStations.tea.y);
    scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.touch(pointer);
    });
    scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      scene.input.setDefaultCursor(this.actor.hit(this.point(pointer)) ? "pointer" : "default");
    });
  }
  private point(pointer: Phaser.Input.Pointer) {
    return this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  }
  private touch(pointer: Phaser.Input.Pointer) {
    if (this.bridge.read().paused) return;
    const point = this.point(pointer);
    if (this.actor.hit(point)) this.affection.tap(this.elapsed);
    else
      this.affection.lookAt(
        this.elapsed,
        ((point.x - this.actor.root.x) / 80) * (this.actor.root.scaleX < 0 ? -1 : 1),
      );
  }
  update(delta: number, reduced: boolean) {
    const controls = this.bridge.read();
    if (controls.request !== this.request) {
      this.request = controls.request;
      this.path = labPath(this.actor.root, controls.mode);
      this.distance = 0;
    }
    const step = controls.paused ? 0 : Math.min(delta, 100);
    this.elapsed += step;
    if (controls.greet !== this.greeted) {
      this.greeted = controls.greet;
      this.affection.tap(this.elapsed);
    }
    this.distance += step * LAB_WALK_SPEED;
    if (reduced) this.distance = Infinity;
    const position = labTravel(this.path, this.distance);
    const activity = position.moving ? "walk" : controls.mode === "walk" ? "idle" : controls.mode;
    this.actor.root
      .setPosition(position.x, position.y)
      .setDepth(position.y + 1)
      .setScale((position.left ? -1 : 1) * LAB_ACTOR_SCALE, LAB_ACTOR_SCALE);
    this.affection.enter(activity, this.elapsed);
    const feeling = this.affection.sample(this.elapsed, reduced);
    this.camera(controls.close);
    this.actor.paint(this.elapsed, activity, reduced, controls.grid, feeling, controls.paused);
    this.contact(activity, position, reduced);
    this.scene.game.canvas.dataset.expression = feeling.yawn ? "yawn" : feeling.expression;
    this.scene.game.canvas.dataset.mark = feeling.mark ?? "none";
    this.scene.game.canvas.dataset.gesture = feeling.gesture;
    this.room.showGrid(controls.grid);
    this.filter.update();
    if (activity !== this.activity) {
      this.activity = activity;
      this.bridge.activity(activity);
    }
  }
  private contact(
    activity: LabPose,
    position: { x: number; y: number; left: boolean },
    reduced: boolean,
  ) {
    const shadow = labShadow(reduced ? 0 : this.elapsed, activity);
    this.shadow
      .setPosition(position.x + (position.left ? -1 : 1) * shadow.x, position.y + shadow.y)
      .setSize(shadow.width, shadow.height)
      .setDepth(position.y - 1);
  }
  private camera(close: boolean) {
    const density = this.scene.game.canvas.width / LAB_WIDTH;
    this.scene.cameras.main.setZoom(density * (close ? 1.8 : 1));
    this.scene.cameras.main.centerOn(
      close ? this.actor.root.x : LAB_WIDTH / 2,
      close ? this.actor.root.y - 85 * LAB_ACTOR_SCALE : LAB_HEIGHT / 2,
    );
  }
}
