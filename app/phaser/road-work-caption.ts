import type Phaser from "phaser";
import type { RoadLook } from "@/lib/chapter-road-presentation";
import type { RoadBattle } from "@/lib/road-view";

// Keep Japanese text sharp while anchoring it directly below the work image.
export class RoadWorkCaption {
  private element = document.createElement("div");

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

  paint(state: RoadBattle, look: RoadLook, x: number, objectBottom: number) {
    const text = look.work?.label ?? "";
    const visible = !!state.gathering && !!text && look.workers.length > 0;
    this.element.hidden = !visible;
    if (!visible) return;
    if (this.element.textContent !== text) {
      this.element.textContent = text;
    }
    this.element.style.left = `${String(x)}px`;
    this.element.style.top = `${String(objectBottom + 12)}px`;
  }
}
