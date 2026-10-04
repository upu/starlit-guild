import {
  cellKey,
  cellPoint,
  roomPath,
  furnitureSpots,
  blockedCells,
  type Cell,
  type Furniture,
} from "./home-room-layout.ts";
import { residentNames, residentHand, type ResidentId, type ResidentPose } from "./home-actor.ts";
export type RoomActivity = "auto" | "tea" | "craft" | "paper" | "garden";
export type Resident = {
  id: ResidentId;
  x: number;
  y: number;
  left: boolean;
  rear: boolean;
  pose: ResidentPose;
  path: Cell[];
  spot?: Cell;
  furniture?: string;
  seat: number;
  until: number;
  phase: number;
  greetUntil: number;
  cycle: number;
  walkDistance: number;
};
const furniturePoses: Partial<Record<Furniture["kind"], ResidentPose>> = {
  table: "tea",
  bench: "craft",
  desk: "paper",
  plot: "garden",
};
const arrivalText: Partial<Record<Furniture["kind"], string>> = {
  table: "お茶の席に加わりました",
  desk: "依頼の手紙を整理しています",
  plot: "苗の根元へ水を注いでいます",
  bench: "道具を手入れしています",
};
const activityKind = { tea: "table", craft: "bench", paper: "desk", garden: "plot" };
const poseFor = (f?: Furniture): ResidentPose => (f ? (furniturePoses[f.kind] ?? "idle") : "idle");
function createResident(id: ResidentId, index: number): Resident {
  return {
    id,
    ...cellPoint({ x: 1 + index * 2, y: 12 }),
    left: false,
    rear: false,
    pose: "idle",
    path: [],
    seat: 0,
    until: 0,
    phase: index * 870,
    greetUntil: 0,
    cycle: 0,
    walkDistance: 0,
  };
}
function faceFurniture(r: Resident, item?: Furniture) {
  if (item?.kind === "table") return r.seat % 2 === 1;
  return item?.kind === "plot" && residentHand(r.id) === "left";
}
function walkStep(r: Resident, delta: number) {
  const next = cellPoint(r.path[0]),
    dx = next.x - r.x,
    dy = next.y - r.y;
  const distance = Math.hypot(dx, dy),
    step = Math.min(delta, 80) * 0.029;
  if (Math.abs(dx) > 0.1) r.left = dx < 0;
  r.rear = Math.abs(dy) > Math.abs(dx) && dy < 0;
  r.walkDistance += Math.min(distance, step);
  if (distance <= step) {
    r.x = next.x;
    r.y = next.y;
    r.path.shift();
  } else {
    r.x += (dx / distance) * step;
    r.y += (dy / distance) * step;
  }
}
export class HomeLife {
  residents: Resident[] = [];
  time = 0;
  event = "仲間たちが、思い思いに過ごしています。";
  private signature = "";
  private activity: RoomActivity = "auto";
  private working?: ResidentId;
  private socialAt = 8000;
  sync(
    ids: ResidentId[],
    furniture: Furniture[],
    activity: RoomActivity,
    reduced: boolean,
    working?: ResidentId,
  ) {
    const signature = JSON.stringify([ids, furniture, activity, working]);
    if (signature === this.signature) return;
    const first = !this.signature;
    this.signature = signature;
    this.activity = activity;
    this.working = working;
    ids = [...ids].sort((a, b) => Number(b === working) - Number(a === working));
    this.residents = ids.map(
      (id, i) => this.residents.find((r) => r.id === id) ?? createResident(id, i),
    );
    const blocked = blockedCells(furniture);
    for (const resident of this.residents) {
      resident.spot = undefined;
      resident.furniture = undefined;
    }
    for (const [index, r] of this.residents.entries()) {
      r.furniture = undefined;
      r.spot = undefined;
      r.path = [];
      const cell = { x: Math.floor(r.x / 24), y: Math.floor(r.y / 24) };
      if (blocked.has(cellKey(cell))) Object.assign(r, cellPoint({ x: 8, y: 12 }));
      this.choose(r, furniture, index, first || reduced);
    }
  }
  private available(item: Furniture, id: ResidentId) {
    const reserved = new Set(this.residents.flatMap((r) => (r.spot ? [cellKey(r.spot)] : [])));
    return furnitureSpots(item)
      .map((cell, seat) => ({ cell, seat }))
      .filter(({ seat }) => item.kind !== "plot" || seat === (residentHand(id) === "left" ? 0 : 1))
      .filter(({ cell }) => !reserved.has(cellKey(cell)));
  }
  private candidates(furniture: Furniture[], index: number, r: Resident) {
    let requested =
      this.activity === "auto"
        ? ["table", "table", "desk", "bench", "table"][index % 5]
        : activityKind[this.activity];
    if (r.id === this.working) requested = "bench";
    return furniture
      .filter((f) => furniturePoses[f.kind])
      .sort((a, b) => Number(b.kind === requested) - Number(a.kind === requested));
  }
  private destination(r: Resident, furniture: Furniture[], index: number) {
    const start = { x: Math.floor(r.x / 24), y: Math.floor(r.y / 24) };
    const reserved: Furniture[] = this.residents.flatMap((other) =>
      other.id !== r.id && other.spot
        ? [{ ...other.spot, id: `reserved-${other.id}`, kind: "plant" as const }]
        : [],
    );
    for (const item of this.candidates(furniture, index + r.cycle, r)) {
      for (const { cell, seat } of this.available(item, r.id)) {
        const route = roomPath(start, cell, [...furniture, ...reserved]);
        if (route) return { item, cell, seat, route };
      }
    }
    return null;
  }
  choose(r: Resident, furniture: Furniture[], index: number, immediate = false) {
    r.furniture = undefined;
    r.spot = undefined;
    const target = this.destination(r, furniture, index);
    if (!target) {
      this.rest(r, furniture, index, immediate);
      return;
    }
    r.spot = target.cell;
    r.furniture = target.item.id;
    r.seat = target.seat;
    r.path = immediate ? [] : target.route;
    if (immediate) Object.assign(r, cellPoint(target.cell));
    r.pose = r.path.length ? "walk" : poseFor(target.item);
    r.until = this.time + 32000 + index * 4700;
    r.left = faceFurniture(r, target.item);
    r.rear = r.pose === "craft" || r.pose === "paper";
  }
  private rest(r: Resident, furniture: Furniture[], index: number, immediate: boolean) {
    const cell = { x: 2 + index * 2, y: 4 },
      start = { x: Math.floor(r.x / 24), y: Math.floor(r.y / 24) };
    r.path = roomPath(start, cell, furniture) ?? [];
    if (immediate && r.path.length) {
      Object.assign(r, cellPoint(cell));
      r.path = [];
    }
    r.pose = r.path.length ? "walk" : "idle";
    r.until = this.time + 30000;
  }
  tick(delta: number, furniture: Furniture[], reduced: boolean) {
    if (reduced) return;
    this.time += Math.min(delta, 80);
    this.residents.forEach((r, index) => {
      this.updateResident(r, index, delta, furniture);
    });
    if (this.time > this.socialAt) this.social();
  }
  private updateResident(r: Resident, index: number, delta: number, furniture: Furniture[]) {
    if (this.time < r.greetUntil) return;
    if (r.path.length) {
      walkStep(r, delta);
      if (!r.path.length) this.arrive(r, furniture);
      return;
    }
    if (this.time <= r.until || this.activity !== "auto" || r.id === this.working) return;
    r.cycle++;
    this.choose(r, furniture, index);
  }
  private arrive(r: Resident, furniture: Furniture[]) {
    const item = furniture.find((f) => f.id === r.furniture);
    r.pose = poseFor(item);
    r.left = faceFurniture(r, item);
    r.rear = r.pose === "craft" || r.pose === "paper";
    r.until = this.time + 32000 + r.phase * 3;
    if (item)
      this.event = `${residentNames[r.id]}が${arrivalText[item.kind] ?? "ひと息ついています"}。`;
  }
  private social() {
    this.socialAt = this.time + 17000;
    const seated = this.residents.filter((r) => r.pose === "tea");
    if (seated.length < 2) return;
    const a = seated[Math.floor(this.time / 17000) % seated.length];
    const b = seated.find((r) => r.id !== a.id && r.furniture === a.furniture);
    if (!b) return;
    a.greetUntil = this.time + 2200;
    b.greetUntil = this.time + 3400;
    this.event = `${residentNames[a.id]}と${residentNames[b.id]}が、お茶を片手に笑い合っています。`;
  }
  greet(id: ResidentId) {
    const r = this.residents.find((person) => person.id === id);
    if (!r) return;
    r.greetUntil = this.time + 2800;
    this.event = `${residentNames[id]}がこちらに気づいて、笑顔を返しました。`;
  }
}
