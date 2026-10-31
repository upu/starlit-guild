import { RoadWheelRotation } from "./road-wheel-rotation.ts";

export const seedlingWheelDiameter = 0.22;

export class SeedlingWheelRotation extends RoadWheelRotation {
  constructor() {
    super(seedlingWheelDiameter);
  }
}
