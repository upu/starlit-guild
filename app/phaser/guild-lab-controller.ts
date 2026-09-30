import type Phaser from "phaser";
import { GuildCutout } from "./guild-cutout";
import { GuildTileRoom } from "./guild-tile-room";
import { GuildLabFilter } from "./guild-lab-filter";
import { LabAffection, type LabFeeling } from "@/lib/guild-lab-affection";
import {
  labLookDirection,
  labPairBeat,
  labPairFeeling,
  labPairHand,
  labSharingProps,
} from "@/lib/guild-lab-pair";
import { labShadow } from "@/lib/guild-lab-contact";
import type { LabBridge, LabControls } from "./guild-lab-game";
import {
  LAB_WIDTH,
  LAB_ACTOR_SCALE,
  LAB_WALK_SPEED,
  LAB_HEIGHT,
  labPathTo,
  labStations,
  labTravel,
  type LabMode,
  type LabPose,
  type Point,
} from "@/lib/guild-lab-model";
import type { LabCharacterId } from "@/lib/guild-lab-rig";
import { labRigs } from "@/lib/guild-lab-rig";
import { labKeepDistance, labPairDestination } from "@/lib/guild-lab-spacing";

type Resident = {
  id: LabCharacterId;
  actor: GuildCutout;
  shadow: Phaser.GameObjects.Ellipse;
  affection: LabAffection;
  path: Point[];
  distance: number;
  position: { x: number; y: number; left: boolean; moving: boolean };
  activity: LabPose;
};

export class GuildLabController {
  private room: GuildTileRoom;
  private filter: GuildLabFilter;
  private residents: Resident[];
  private plate: Phaser.GameObjects.Image;
  private bite: Phaser.GameObjects.Image;
  private elapsed = 0;
  private request = -1;
  private activity: LabPose = "tea";
  private greeted = 0;
  private actorCount: number;
  constructor(
    private scene: Phaser.Scene,
    private bridge: LabBridge,
  ) {
    this.filter = new GuildLabFilter(scene);
    const count = Number(new URLSearchParams(location.search).get("actors"));
    this.actorCount = count === 4 || count === 8 ? count : 2;
    this.residents = Array.from({ length: this.actorCount }, (_, i) => this.createResident(i));
    this.room = new GuildTileRoom(
      scene,
      (mode, pointer) => {
        if (!this.residents.some((r) => r.actor.hit(this.point(pointer)))) bridge.visit(mode);
      },
      this.filter,
    );
    this.plate = this.filter.add(
      scene.add
        .image(320, 356, "/guild/lab-cookie-plate-v1.webp")
        .setDisplaySize(20, 16)
        .setDepth(385),
    );
    this.bite = this.filter.add(
      scene.add.image(0, 0, "/guild/lab-cookie-v1.webp").setDisplaySize(8, 7).setDepth(387),
    );
    scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.touch(pointer);
    });
    scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      scene.input.setDefaultCursor(
        this.residents.some((r) => r.actor.hit(this.point(pointer))) ? "pointer" : "default",
      );
    });
  }
  private createResident(i: number): Resident {
    const id: LabCharacterId = i % 2 ? "aria" : "leon";
    const actor = new GuildCutout(this.scene, this.filter, id);
    const start =
      i < 2 ? (i ? labStations.ariaTea : labStations.tea) : { x: 120 + (i - 2) * 85, y: 485 };
    actor.root.setPosition(start.x, start.y);
    return {
      id,
      actor,
      shadow: this.scene.add.ellipse(0, 0, 35, 3.8, 0x231b15, 0.22),
      affection: new LabAffection(),
      path: [start],
      distance: 0,
      position: { ...start, left: id === "aria", moving: false },
      activity: "tea",
    };
  }
  private point(pointer: Phaser.Input.Pointer) {
    return this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  }
  private hitResident(point: Point) {
    return [...this.residents]
      .sort((a, b) => b.position.y - a.position.y)
      .find((r) => r.actor.hit(point));
  }
  private lookAt(point: Point, target?: Resident) {
    for (const resident of this.residents) {
      if (resident === target) continue;
      const direction = labLookDirection(
        resident.position.x,
        point.x,
        resident.actor.root.scaleX < 0,
      );
      resident.affection.lookAt(this.elapsed, direction);
    }
  }
  private touch(pointer: Phaser.Input.Pointer) {
    if (this.bridge.read().paused) return;
    const point = this.point(pointer);
    const target = this.hitResident(point);
    if (target) {
      target.affection.tap(this.elapsed);
      this.scene.game.canvas.dataset.tapped = target.id;
    }
    this.lookAt(target?.position ?? point, target);
  }
  private destination(mode: LabMode, index: number): Point {
    if (index >= 2) return { x: 120 + (index - 2) * 85, y: 485 };
    return labPairDestination(mode, index, this.request, this.residents[0].position.x < 384);
  }
  private visitRequested(controls: LabControls) {
    if (controls.request === this.request) return;
    this.request = controls.request;
    this.residents.forEach((r, i) => {
      r.path = labPathTo(r.actor.root, this.destination(controls.mode, i), i === 1 ? 488 : 416);
      r.distance = i === 0 && controls.mode === "detour" && this.request % 2 ? -140 : 0;
    });
  }
  private residentPosition(
    r: Resident,
    i: number,
    controls: LabControls,
    step: number,
    reduced: boolean,
  ) {
    if (i >= 2) return { ...r.position, delayed: false };
    r.distance += step * LAB_WALK_SPEED;
    if (reduced) r.distance = Infinity;
    const delayed =
      i === 0 && controls.mode === "detour" && this.request % 2 === 1 && r.distance < 0;
    const position = delayed
      ? { x: r.actor.root.x, y: r.actor.root.y, left: false, moving: false }
      : labTravel(r.path, Math.max(0, r.distance));
    return { ...position, delayed };
  }
  private residentMode(
    i: number,
    controls: LabControls,
    position: { moving: boolean; delayed: boolean },
  ): LabPose {
    if (i >= 2 || (controls.mode === "walk" && !position.moving)) return "idle";
    if (position.moving) return "walk";
    if (controls.mode !== "detour") return controls.mode;
    if (i) return "idle";
    return position.delayed || this.request % 2 === 0 ? "tea" : "idle";
  }
  private residentFeeling(
    r: Resident,
    i: number,
    controls: LabControls,
    position: { moving: boolean },
    beat: ReturnType<typeof labPairBeat>,
    reduced: boolean,
  ): LabFeeling {
    const feeling = r.affection.sample(this.elapsed, reduced);
    if (r.affection.reacting(this.elapsed) || position.moving || i >= 2) return feeling;
    if (controls.mode === "tea") return labPairFeeling(feeling, r.id, beat, reduced);
    if (controls.mode !== "detour") return feeling;
    if (i === 1) return { ...feeling, expression: "surprised", mark: "notice" };
    return { ...feeling, look: reduced ? 0 : 0.06, mark: this.request % 2 ? "notice" : "thought" };
  }
  private exposeResident(i: number, feeling: LabFeeling) {
    const data = this.scene.game.canvas.dataset;
    const expression = feeling.yawn ? "yawn" : feeling.expression;
    if (i === 0) {
      data.expression = expression;
      data.mark = feeling.mark ?? "none";
      data.gesture = feeling.gesture;
    }
    if (i === 1) {
      data.ariaExpression = expression;
      data.ariaMark = feeling.mark ?? "none";
    }
  }
  private renderResident(
    r: Resident,
    i: number,
    controls: LabControls,
    position: ReturnType<GuildLabController["residentPosition"]>,
    beat: ReturnType<typeof labPairBeat>,
    reduced: boolean,
  ) {
    r.position = position;
    const mode = this.residentMode(i, controls, position);
    r.activity = mode;
    const left = (!position.moving && controls.mode === "tea" && r.id === "aria") || position.left;
    r.actor.root
      .setPosition(position.x, position.y)
      .setDepth(position.y + 1)
      .setScale((left ? -1 : 1) * LAB_ACTOR_SCALE, LAB_ACTOR_SCALE);
    r.affection.enter(mode, this.elapsed);
    const feeling = this.residentFeeling(r, i, controls, position, beat, reduced);
    const hand =
      i < 2 && controls.mode === "tea" && !position.moving && !reduced
        ? labPairHand(r.id, beat, this.elapsed)
        : null;
    r.actor.paint(this.elapsed, mode, reduced, controls.grid, feeling, controls.paused, hand);
    const shadow = labShadow(reduced ? 0 : this.elapsed, mode, labRigs[r.id]);
    r.shadow
      .setPosition(position.x + (left ? -1 : 1) * shadow.x, position.y + shadow.y)
      .setSize(shadow.width, shadow.height)
      .setDepth(position.y - 1);
    this.exposeResident(i, feeling);
  }
  update(delta: number, reduced: boolean) {
    const controls = this.bridge.read();
    this.visitRequested(controls);
    const step = controls.paused ? 0 : Math.min(delta, 100);
    this.elapsed += step;
    if (controls.greet !== this.greeted) {
      this.greeted = controls.greet;
      this.residents[0].affection.tap(this.elapsed);
    }
    this.camera(controls.close);
    const beat = labPairBeat(this.elapsed);
    const positions = this.residents.map((r, i) =>
      this.residentPosition(r, i, controls, step, reduced),
    );
    [positions[0], positions[1]] = labKeepDistance([positions[0], positions[1]]);
    this.residents.forEach((r, i) => {
      this.renderResident(r, i, controls, positions[i], beat, reduced);
    });
    this.scene.game.canvas.dataset.feet = JSON.stringify(
      positions.slice(0, 2).map(({ x, y, moving }) => ({ x, y, moving })),
    );
    this.share(controls.mode, reduced);
    this.room.showGrid(controls.grid);
    this.filter.update();
    this.scene.game.canvas.dataset.beat = controls.mode === "tea" ? beat : "none";
    this.scene.game.canvas.dataset.actors = String(this.actorCount);
    this.scene.game.canvas.dataset.frameMs = delta.toFixed(2);
    const metrics = this.scene.game as typeof this.scene.game & {
      labDrawMetrics?: { take: () => number };
    };
    this.scene.game.canvas.dataset.drawCalls = String(metrics.labDrawMetrics?.take() ?? -1);
    const activity = this.residents[0].activity;
    if (activity !== this.activity) {
      this.activity = activity;
      this.bridge.activity(activity);
    }
  }
  private share(mode: LabMode, reduced: boolean) {
    this.bite.visible = false;
    this.plate.visible =
      mode === "tea" && !this.residents.slice(0, 2).some((r) => r.position.moving);
    if (!this.plate.visible) return;
    const props = labSharingProps(this.elapsed, reduced);
    this.plate.setPosition(props.dishX, 356);
    if (props.bite) this.bite.setPosition(props.bite.x, props.bite.y).setVisible(true);
  }
  private camera(close: boolean) {
    const density = this.scene.game.canvas.width / LAB_WIDTH;
    this.scene.cameras.main.setZoom(density * (close ? 1.8 : 1));
    this.scene.cameras.main.centerOn(
      close ? (this.residents[0].actor.root.x + this.residents[1].actor.root.x) / 2 : LAB_WIDTH / 2,
      close
        ? (this.residents[0].actor.root.y + this.residents[1].actor.root.y) / 2 -
            85 * LAB_ACTOR_SCALE
        : LAB_HEIGHT / 2,
    );
  }
}
