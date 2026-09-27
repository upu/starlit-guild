import type Phaser from "phaser";
import type { RoadLook } from "@/lib/chapter-road-presentation";
import type { RoadBattle } from "@/lib/road-view";
import { roadY } from "@/lib/road-layout";

// Keep Japanese text sharp and avoid the actual chat bounds, including font scaling.
export class RoadWorkCaption {
  private element = document.createElement("div");
  private observer: ResizeObserver;
  private dirty = true;
  private bounds = { width: 0, height: 0, top: 0, bottom: 0 };
  private host: HTMLElement;
  private chat: Element | null;
  private heading: Element | null;

  constructor(scene: Phaser.Scene) {
    const host = scene.game.canvas.parentElement;
    if (!host) throw new Error("Adventure canvas must be mounted before creating its caption");
    this.host = host;
    this.chat = host.closest(".phone-adventure")?.querySelector(".journey-banter") ?? null;
    this.heading = host.parentElement?.querySelector(".map-heading") ?? null;
    this.element.className = "road-work-caption";
    this.element.hidden = true;
    host.appendChild(this.element);
    this.observer = new ResizeObserver(() => {
      this.dirty = true;
    });
    for (const el of [host, this.element, this.chat, this.heading])
      if (el) this.observer.observe(el);
    const dispose = () => {
      this.observer.disconnect();
      this.element.remove();
      scene.events.off("shutdown", dispose);
      scene.events.off("destroy", dispose);
    };
    scene.events.once("shutdown", dispose);
    scene.events.once("destroy", dispose);
  }

  private measure() {
    if (!this.dirty) return;
    const host = this.host.getBoundingClientRect();
    this.bounds = {
      width: this.element.offsetWidth,
      height: this.element.offsetHeight,
      top: this.heading ? this.heading.getBoundingClientRect().bottom - host.top + 4 : 8,
      bottom: (this.chat?.getBoundingClientRect().top ?? host.bottom) - host.top - 8,
    };
    this.dirty = false;
  }

  paint(state: RoadBattle, look: RoadLook, x: number, objectTop: number) {
    const text = look.work?.label ?? "";
    const visible = !!state.gathering && !!text && look.workers.length > 0;
    if (this.element.hidden === visible) {
      this.element.hidden = !visible;
      this.dirty = true;
    }
    if (!visible) return;
    if (this.element.textContent !== text) {
      this.element.textContent = text;
      this.dirty = true;
    }
    this.measure();
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    const size = Math.min(90, width * 0.18, height * 0.34);
    const actorTop = Math.min(
      objectTop,
      ...state.heroes.filter((hero) => hero.hp > 0).map((hero) => roadY(hero.lane, height) - size),
    );
    const { top, bottom } = this.bounds;
    const left = Math.max(8, Math.min(width - this.bounds.width - 8, x - this.bounds.width / 2));
    const y = Math.max(top, Math.min(actorTop - 14, bottom) - this.bounds.height);
    this.element.style.transform = `translate(${String(left)}px, ${String(y)}px)`;
    this.element.style.setProperty(
      "--caption-pointer",
      `${String(Math.max(14, Math.min(this.bounds.width - 14, x - left)))}px`,
    );
  }
}
