import type Phaser from "phaser";
import { adventureAction } from "@/lib/adventure-presentation";
import { chapterRoadFrame, chapterRoadHit } from "@/lib/chapter-road-presentation";
import { RoadPainter, ROAD_BACKGROUND } from "./road-painter";
import {
  ROAD_EFFECTS,
  ROAD_HERB,
  ROAD_CARGO,
  ROAD_PUPPETS,
  ROAD_PUSH,
  ROAD_PULL,
  ROAD_FINN_PULL,
  ROAD_PACKING,
  ROAD_DESTINATION,
  ROAD_WORKSITES,
  ROAD_BERNE_WORKSITES,
  ROAD_LEDGER_DESK,
  ROAD_SIGNPOST,
  roadSheet,
  roadWalkSheet,
} from "./road-art";
import type { AdventureBridge } from "./renderer-session";
import type { RuntimeState } from "./adventure-painter-figures";

export function chapterRoadAssets(input: ReturnType<AdventureBridge["read"]>) {
  const { look } = chapterRoadFrame(input);
  return [
    ...new Set([
      "/sprites.png",
      ROAD_BACKGROUND,
      look.background,
      ROAD_EFFECTS,
      ROAD_HERB,
      ROAD_CARGO,
      ROAD_PUPPETS,
      ROAD_PUSH,
      ROAD_PULL,
      ROAD_FINN_PULL,
      ROAD_PACKING,
      ROAD_DESTINATION,
      ROAD_WORKSITES,
      ROAD_BERNE_WORKSITES,
      ROAD_LEDGER_DESK,
      ROAD_SIGNPOST,
      ...(["aria", "leon", "mira", "finn"] as const).flatMap((id) => [
        roadSheet(id),
        roadWalkSheet(id),
      ]),
      ...(input.squad.members.includes("lico") ? [roadSheet("lico"), roadWalkSheet("lico")] : []),
      ...(input.squad.run?.quest === "lico-records" ? [roadSheet("lico")] : []),
      ...(input.squad.run?.quest === "merrill-seedlings"
        ? [
            "/animations/road/merrill-standing-v1.webp",
            "/animations/road/merrill-song-v1.webp",
            "/animations/road/mushroom-v1.webp",
          ]
        : []),
      ...(look.work ? [look.work.asset] : []),
    ]),
  ];
}

export class ChapterRoadPainter {
  private painter?: RoadPainter;
  private loading = false;
  failed = false;
  constructor(
    private scene: Phaser.Scene,
    private bridge: AdventureBridge,
    private engine: typeof Phaser,
    private runtime: RuntimeState,
    private syncPause: () => void,
  ) {}
  initialize() {
    if (this.runtime.disposed || this.failed) return;
    this.painter = new RoadPainter(this.scene);
    this.scene.input.on(this.engine.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer) => {
      this.pointerUp(pointer);
    });
    this.runtime.created = true;
    this.bridge.status("ready");
    this.paint();
    queueMicrotask(this.syncPause);
  }
  private pointerUp(pointer: Phaser.Input.Pointer) {
    if (
      this.runtime.disposed ||
      this.runtime.paused ||
      this.loading ||
      this.failed ||
      pointer.button !== 0 ||
      pointer.getDistance() > 14
    )
      return;
    const input = this.bridge.read();
    const intent = chapterRoadHit(input, pointer, this.scene.scale.width, this.scene.scale.height);
    const action = adventureAction(input, intent);
    if (action) this.bridge.act(action);
  }
  private ensureAssets() {
    const missing = chapterRoadAssets(this.bridge.read()).filter(
      (asset) => !this.scene.textures.exists(asset),
    );
    if (!missing.length) return true;
    if (this.loading) return false;
    this.loading = true;
    this.bridge.status("loading");
    for (const asset of missing) this.scene.load.image(asset, asset);
    this.scene.load.once(this.engine.Loader.Events.COMPLETE, () => {
      this.loading = false;
      if (!this.runtime.disposed && !this.failed) this.bridge.status("ready");
    });
    this.scene.load.start();
    return false;
  }
  stopMotion() {
    this.paint();
  }
  paint() {
    if (!this.painter || !this.ensureAssets()) return;
    const width = this.scene.scale.width;
    const { battle, look } = chapterRoadFrame(
      this.bridge.read(),
      this.runtime.reduced,
      width / Math.min(1.1, width / 800),
    );
    this.painter.paint(battle, this.runtime.reduced, look);
  }
}
