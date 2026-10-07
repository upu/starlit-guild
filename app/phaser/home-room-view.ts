import type Phaser from "phaser";
import { ROOM } from "@/lib/home-room-layout";

type Point = { x: number; y: number };
type Drag = Point & { id: number; center: Point; moved: boolean };
export class HomeRoomView {
  private zoomed = false;
  private center: Point = { x: ROOM.width / 2, y: ROOM.height / 2 };
  private drag?: Drag;
  constructor(
    private scene: Phaser.Scene,
    private tap: (point: Point) => void,
    private preview: (point: Point) => void,
  ) {
    const canvas = scene.game.canvas;
    canvas.addEventListener("pointerdown", this.down);
    canvas.addEventListener("pointermove", this.move);
    canvas.addEventListener("pointerup", this.up);
    canvas.addEventListener("pointercancel", this.cancel);
    canvas.addEventListener("lostpointercapture", this.cancel);
    canvas.parentElement?.parentElement?.addEventListener("keydown", this.key);
    scene.events.once("shutdown", () => {
      canvas.removeEventListener("pointerdown", this.down);
      canvas.removeEventListener("pointermove", this.move);
      canvas.removeEventListener("pointerup", this.up);
      canvas.removeEventListener("pointercancel", this.cancel);
      canvas.removeEventListener("lostpointercapture", this.cancel);
      canvas.parentElement?.parentElement?.removeEventListener("keydown", this.key);
    });
  }
  update(zoomed: boolean) {
    if (this.zoomed !== zoomed) {
      this.cancel();
      this.center = { x: ROOM.width / 2, y: ROOM.height / 2 };
    }
    this.zoomed = zoomed;
    this.sync();
  }
  private sync() {
    const canvas = this.scene.game.canvas;
    const factor = this.zoomed ? 2 : 1;
    const zoom = Math.min(canvas.width / ROOM.width, canvas.height / ROOM.height) * factor;
    const half = {
      x: Math.min(ROOM.width / 2, canvas.width / (2 * zoom)),
      y: Math.min(ROOM.height / 2, canvas.height / (2 * zoom)),
    };
    this.center.x = Math.max(half.x, Math.min(ROOM.width - half.x, this.center.x));
    this.center.y = Math.max(half.y, Math.min(ROOM.height - half.y, this.center.y));
    this.scene.cameras.main
      .setSize(canvas.width, canvas.height)
      .setZoom(zoom)
      .centerOn(this.center.x, this.center.y);
  }
  private point(event: PointerEvent) {
    // Use current CSS bounds even after the surrounding panel has scrolled.
    const canvas = this.scene.game.canvas,
      rect = canvas.getBoundingClientRect();
    return this.scene.cameras.main.getWorldPoint(
      ((event.clientX - rect.left) * canvas.width) / rect.width,
      ((event.clientY - rect.top) * canvas.height) / rect.height,
    );
  }
  private down = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0) return;
    this.drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      center: { ...this.center },
      moved: false,
    };
    if (this.zoomed) {
      this.scene.game.canvas.setPointerCapture(event.pointerId);
      this.scene.game.canvas.parentElement?.parentElement?.focus({ preventScroll: true });
    }
  };
  private move = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || drag.id !== event.pointerId) {
      this.preview(this.point(event));
      return;
    }
    const dx = event.clientX - drag.x,
      dy = event.clientY - drag.y;
    drag.moved ||= Math.hypot(dx, dy) > 7;
    if (!this.zoomed || !drag.moved) return;
    const canvas = this.scene.game.canvas;
    const scale =
      canvas.width / canvas.getBoundingClientRect().width / this.scene.cameras.main.zoom;
    this.center = { x: drag.center.x - dx * scale, y: drag.center.y - dy * scale };
    this.scene.game.canvas.style.cursor = "grabbing";
    this.sync();
  };
  private up = (event: PointerEvent) => {
    const drag = this.drag;
    if (!drag || drag.id !== event.pointerId) return;
    const tapped = !drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) <= 7;
    this.cancel();
    if (this.scene.game.canvas.hasPointerCapture(event.pointerId))
      this.scene.game.canvas.releasePointerCapture(event.pointerId);
    if (tapped) this.tap(this.point(event));
  };
  private cancel = () => {
    this.drag = undefined;
    this.scene.game.canvas.style.cursor = "";
  };
  private key = (event: KeyboardEvent) => {
    if (!this.zoomed || event.target !== event.currentTarget) return;
    const moves: Partial<Record<string, Point>> = {
      ArrowLeft: { x: -24, y: 0 },
      ArrowRight: { x: 24, y: 0 },
      ArrowUp: { x: 0, y: -24 },
      ArrowDown: { x: 0, y: 24 },
    };
    const step = moves[event.key];
    if (!step && event.key !== "Home") return;
    event.preventDefault();
    this.center = step
      ? { x: this.center.x + step.x, y: this.center.y + step.y }
      : { x: ROOM.width / 2, y: ROOM.height / 2 };
    this.sync();
  };
}
