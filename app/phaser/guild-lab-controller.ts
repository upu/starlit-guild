import type Phaser from "phaser";
import { GuildCutout } from "./guild-cutout";
import { GuildTileRoom } from "./guild-tile-room";
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
  private elapsed = 0;
  private distance = 0;
  private request = -1;
  private path = [labStations.tea];
  private activity: LabPose = "tea";
  constructor(
    private scene: Phaser.Scene,
    private bridge: LabBridge,
  ) {
    this.room = new GuildTileRoom(scene, bridge.visit);
    this.shadow = scene.add.ellipse(0, 0, 31, 7, 0x231b15, 0.22);
    this.actor = new GuildCutout(scene);
    this.actor.root.setPosition(labStations.tea.x, labStations.tea.y);
  }
  update(delta: number, reduced: boolean) {
    const controls = this.bridge.read();
    if (controls.request !== this.request) {
      this.request = controls.request;
      this.path = labPath(this.actor.root, controls.mode);
      this.distance = 0;
    }
    const step = controls.paused || reduced ? 0 : Math.min(delta, 100);
    this.elapsed += step;
    this.distance += step * LAB_WALK_SPEED;
    if (reduced) this.distance = Infinity;
    const position = labTravel(this.path, this.distance);
    const activity = position.moving ? "walk" : controls.mode === "walk" ? "idle" : controls.mode;
    this.actor.root
      .setPosition(position.x, position.y)
      .setDepth(position.y + 1)
      .setScale((position.left ? -1 : 1) * LAB_ACTOR_SCALE, LAB_ACTOR_SCALE);
    this.actor.paint(this.elapsed, activity, reduced, controls.grid);
    this.shadow.setPosition(position.x, position.y + 5).setDepth(position.y - 1);
    this.room.showGrid(controls.grid);
    this.camera(controls.close);
    if (activity !== this.activity) {
      this.activity = activity;
      this.bridge.activity(activity);
    }
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
