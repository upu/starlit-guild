import { ordinaryEnemyArt } from "./adventure-enemy-art.ts";

export type RoadRect = { x: number; y: number; width: number; height: number };

// Union of the visible pixels in the registered standing, walking and action
// frames (0-7 for animated atlases). Mirror the horizontal margin so either
// facing stays covered. Ordinary enemies use a single image in a 1024px cell.
const paintedBodies: Record<string, readonly [number, number, number, number, number]> = {
  golem: [39, 92, 434, 388, 512],
  puppet: [83, 96, 346, 384, 512],
  pumpety: [26, 42, 76, 78, 128],
  wolf: [289, 576, 446, 384, 1024],
  slime: [254, 576, 516, 384, 1024],
};
export function roadLabelBody(
  body: RoadRect,
  kind: string,
  painted = false,
  frame?: string,
): RoadRect {
  const species = kind === "slime" ? ordinaryEnemyArt(frame || "8") : kind;
  const bounds = painted ? paintedBodies[species] : undefined;
  if (!bounds) return body;
  const [x, y, width, height, cell] = bounds;
  return {
    x: body.x + (body.width * x) / cell,
    y: body.y + (body.height * y) / cell,
    width: (body.width * width) / cell,
    height: (body.height * height) / cell,
  };
}
export const roadLabelWrapWidth = (anchorX: number, width: number) =>
  Math.max(60, Math.min(150, width * 0.38, 2 * Math.min(anchorX - 4, width - 4 - anchorX)));
type Point = { x: number; y: number };
type NamedEnemy = { id: number; kind: string; text: string; body: RoadRect };
export type RoadLabel = {
  key: string;
  owner: number;
  text: string;
  anchor: Point;
};
type MeasuredLabel = RoadLabel & { width: number; height: number };

// Numbered ordinary enemies share one nameplate. Named opponents and action
// warnings retain their distinct labels, even when they have the same kind.
function groupName(enemy: NamedEnemy) {
  return enemy.kind === "slime"
    ? enemy.text.replace(/^(霧狼|スライム)\s+[A-Z]$/, "$1")
    : enemy.text;
}

export function groupRoadLabels(enemies: NamedEnemy[]): RoadLabel[] {
  const groups = new Map<string, NamedEnemy[]>();
  for (const enemy of enemies) {
    if (!enemy.text) continue;
    const key = `${enemy.kind}:${groupName(enemy)}`;
    groups.set(key, [...(groups.get(key) ?? []), enemy]);
  }
  return [...groups].map(([key, members]) => ({
    key,
    owner: members[0].id,
    text:
      members.length > 1 ? `${groupName(members[0])} ×${String(members.length)}` : members[0].text,
    anchor: {
      x: members.reduce((sum, m) => sum + m.body.x + m.body.width / 2, 0) / members.length,
      // Prefer the area directly above the group, so a tall enemy's name does
      // not migrate to an unrelated hero just to stay close to its feet.
      y: Math.min(...members.map((m) => m.body.y)) - 4,
    },
  }));
}

export function roadRectsOverlap(a: RoadRect, b: RoadRect, gap = 3) {
  return (
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y
  );
}

function candidates(label: MeasuredLabel, occupied: RoadRect[], width: number, height: number) {
  const x = label.anchor.x - label.width / 2;
  const xs = [x, 4, width - label.width - 4];
  const ys = [label.anchor.y, 4, height - label.height - 4];
  for (const rect of occupied) {
    xs.push(rect.x - label.width - 4, rect.x + rect.width + 4);
    ys.push(rect.y - label.height - 4, rect.y + rect.height + 4);
  }
  return ys.flatMap((y) => xs.map((x) => ({ x, y, width: label.width, height: label.height })));
}

// Keep a still-valid offset so bouncing enemies do not make names change sides
// every frame. The cache belongs to the renderer, never to the player's save.
export class RoadLabelLayout {
  private offsets = new Map<string, Point>();
  place(labels: MeasuredLabel[], bodies: RoadRect[], width: number, height: number) {
    const placed = new Map<string, RoadRect>();
    const occupied = [...bodies];
    for (const label of labels) {
      const valid = (r: RoadRect) =>
        r.x >= 4 &&
        r.y >= 4 &&
        r.x + r.width <= width - 4 &&
        r.y + r.height <= height - 4 &&
        !occupied.some((body) => roadRectsOverlap(r, body));
      const score = (r: RoadRect) =>
        Math.hypot(r.x + r.width / 2 - label.anchor.x, r.y - label.anchor.y) +
        (r.y < label.anchor.y ? 12 : 0);
      const options = candidates(label, occupied, width, height)
        .filter(valid)
        .sort((a, b) => score(a) - score(b));
      const offset = this.offsets.get(label.key);
      const previous = offset && {
        x: label.anchor.x + offset.x,
        y: label.anchor.y + offset.y,
        width: label.width,
        height: label.height,
      };
      const best = options.at(0);
      const rect =
        previous && valid(previous) && (!best || score(previous) <= score(best) + 24)
          ? previous
          : best;
      if (!rect) continue;
      placed.set(label.key, rect);
      occupied.push(rect);
      this.offsets.set(label.key, { x: rect.x - label.anchor.x, y: rect.y - label.anchor.y });
    }
    for (const key of this.offsets.keys()) if (!placed.has(key)) this.offsets.delete(key);
    return placed;
  }
}
