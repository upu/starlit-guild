import type Phaser from "phaser";
import type { RoadLook } from "@/lib/chapter-road-presentation";
import type { RoadBattle } from "@/lib/road-view";
import { RoadLabelLayout, type RoadRect } from "../../lib/road-label-layout.ts";
import { firstChapterReturnFade } from "../../lib/road-housecalls-layout.ts";

// Keep Japanese text sharp and close to the work image without covering workers.
export class RoadWorkCaption {
  private element = document.createElement("div");
  private measureKey = "";
  private measured = { width: 0, height: 0 };
  private layout = new RoadLabelLayout();
  bounds: RoadRect | undefined;

  constructor(scene: Phaser.Scene) {
    const host = scene.game.canvas.parentElement;
    if (!host) throw new Error("Adventure canvas must be mounted before creating its caption");
    this.element.className = "road-work-caption";
    this.element.hidden = true;
    host.appendChild(this.element);
    const dispose = () => {
      this.element.remove();
      scene.events.off("shutdown", dispose);
      scene.events.off("destroy", dispose);
    };
    scene.events.once("shutdown", dispose);
    scene.events.once("destroy", dispose);
  }

  paint(
    state: RoadBattle,
    look: RoadLook,
    x: number,
    objectBottom: number,
    bodies: RoadRect[] = [],
  ) {
    const text = look.work?.label ?? "";
    const visible = !!state.gathering && !!text && (look.workers.length > 0 || !!look.packing);
    const hostWidth = this.element.parentElement?.clientWidth ?? 0;
    this.element.hidden = !visible;
    this.element.style.opacity = String(1 - firstChapterReturnFade(look));
    if (this.element.textContent !== text) this.element.textContent = text;
    if (!visible) {
      this.bounds = undefined;
      this.measureKey = "";
      return;
    }
    this.element.style.left = `${String(x)}px`;
    this.element.style.top = `${String(objectBottom + 12)}px`;
    const key = `${text}:${String(hostWidth)}`;
    if (key !== this.measureKey) {
      this.measured = { width: this.element.offsetWidth, height: this.element.offsetHeight };
      this.measureKey = key;
      this.layout = new RoadLabelLayout();
    }
    this.bounds = this.placeBounds(
      text,
      x,
      objectBottom,
      bodies,
      hostWidth,
      !!look.packing || !!look.signpost,
    );
    this.element.style.left = `${String(this.bounds.x + this.bounds.width / 2)}px`;
    this.element.style.top = `${String(this.bounds.y)}px`;
  }
  private placeBounds(
    text: string,
    x: number,
    objectBottom: number,
    bodies: RoadRect[],
    hostWidth: number,
    fixed: boolean,
  ): RoadRect {
    const hostHeight = this.element.parentElement?.clientHeight ?? 0;
    if (fixed)
      return {
        x: (hostWidth - this.measured.width) / 2,
        y: hostHeight - this.measured.height - 4,
        ...this.measured,
      };
    const preferred = {
      x: x - this.measured.width / 2,
      y: objectBottom + 12,
      ...this.measured,
    };
    return (
      this.layout
        .place(
          [{ key: text, owner: 0, text, anchor: { x, y: preferred.y }, ...this.measured }],
          bodies,
          hostWidth,
          hostHeight,
        )
        .get(text) ?? preferred
    );
  }
}
