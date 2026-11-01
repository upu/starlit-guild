import { roadScale } from "./road-layout.ts";

/** Wheel angle follows world distance; pauses, resizing and scene jumps keep it still. */
export class RoadWheelRotation {
  private previous?: { x: number; time: number; view: string; moving: boolean };
  private angle = 0;

  private diameter: number;

  constructor(diameter: number) {
    this.diameter = diameter;
  }

  update(
    x: number,
    time: number,
    width: number,
    stage: string,
    size: number,
    moving: boolean,
    reduced: boolean,
  ) {
    const view = `${String(width)}:${stage}:${String(size)}`;
    const previous = this.previous;
    if (!reduced && moving && previous?.moving && previous.view === view && time > previous.time) {
      const distance = (x - previous.x) * roadScale(width, stage);
      if (Math.abs(distance) < size * 1.5) this.angle += distance / ((size * this.diameter) / 2);
    }
    this.previous = { x, time, view, moving: moving && !reduced };
    return reduced ? 0 : this.angle;
  }

  hide() {
    this.previous = undefined;
  }
}
