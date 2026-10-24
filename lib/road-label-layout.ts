export type RoadRect = { x: number; y: number; width: number; height: number };
type Point = { x: number; y: number };
type NamedEnemy = { id: number; kind: string; text: string; body: RoadRect };
export type RoadLabel = {
  key: string;
  owner: number;
  text: string;
  anchor: Point;
};
type MeasuredLabel = RoadLabel & { width: number; height: number };

// Only equal labels of the same kind are combined. A cue such as singing or
// preparing a hit stays separate from the ordinary name of another opponent.
export function groupRoadLabels(enemies: NamedEnemy[]): RoadLabel[] {
  const groups = new Map<string, NamedEnemy[]>();
  for (const enemy of enemies) {
    if (!enemy.text) continue;
    const key = `${enemy.kind}:${enemy.text}`;
    groups.set(key, [...(groups.get(key) ?? []), enemy]);
  }
  return [...groups].map(([key, members]) => ({
    key,
    owner: members[0].id,
    text: members[0].text + (members.length > 1 ? ` ×${String(members.length)}` : ""),
    anchor: {
      x: members.reduce((sum, m) => sum + m.body.x + m.body.width / 2, 0) / members.length,
      y: Math.max(...members.map((m) => m.body.y + m.body.height)) + 4,
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
