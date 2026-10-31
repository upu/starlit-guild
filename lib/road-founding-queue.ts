import type { RoadBattle } from "./road-view.ts";
import { CHAPTER_ROAD_SPACING } from "./chapter-road.ts";

export type FoundingJob = {
  kind: "letter" | "basket";
  node: number;
  point: NonNullable<RoadBattle["gathering"]>;
};

/** Keep work sites in order while the game continues between rendered frames. */
export class FoundingVisualQueue {
  private key = "";
  private firstNode = 0;
  private seen = new Set<number>();
  private jobs: FoundingJob[] = [];

  observe(
    key: string,
    node: number,
    working: boolean,
    point: RoadBattle["gathering"],
    completed = false,
    total = node + 1,
  ): number[] {
    if (this.key !== key) {
      this.key = key;
      this.firstNode = node;
      this.seen.clear();
      this.jobs = [];
    }
    // A React snapshot may skip an entire work node, especially after a tab
    // was hidden. Reconstruct only nodes passed during this renderer session;
    // loading a save midway must not replay the earlier journey.
    const passed = Math.min(total, completed ? total : node);
    for (let previous = this.firstNode; previous < passed; previous++) {
      const task = previous % 3 === 0 ? "inspect" : "pack";
      this.enqueue(previous, {
        kind: "herb",
        task,
        x: previous * CHAPTER_ROAD_SPACING + 115,
        remaining: 0,
        total: 1,
      });
    }
    if (working && point) this.enqueue(node, point);
    // During the journey retain the active and newest handoff. Once the game
    // finishes, complete the visible handoff and treat the rest as offscreen.
    const limit = completed ? 1 : 2;
    const omitted = this.jobs.length > limit ? this.jobs.splice(1, this.jobs.length - limit) : [];
    return omitted.map((job) => job.node);
  }

  private enqueue(node: number, point: NonNullable<RoadBattle["gathering"]>) {
    if (node % 3 === 2) return;
    if (this.seen.has(node)) return;
    this.seen.add(node);
    const kind = node % 3 === 0 ? "letter" : "basket";
    this.jobs.push({ kind, node, point: { ...point } });
  }

  get current(): FoundingJob | undefined {
    return this.jobs[0];
  }

  complete() {
    this.jobs.shift();
  }
}
