import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, RoadEffect, Traveller, TravellerId } from "./road-view.ts";
import { mossBedsLayout, seedlingCastScale } from "./road-moss-beds-layout.ts";
import { remapFixedEffects } from "./road-lico-records.ts";
import { waterwayAt } from "./road-waterway-contacts.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
type MeleeId = "leon" | "finn";
type Pending = { effect: RoadEffect; target: number };
const melee = (id?: TravellerId): id is MeleeId => id === "leon" || id === "finn";

/** Draw melee attacks only after their owner has reached the affected enemy. */
export class RoadSeedlingMelee {
  private key = "";
  private seen = new Set<number>();
  private queues: Record<MeleeId, Pending[]> = { leon: [], finn: [] };
  private playing: Partial<Record<MeleeId, { pending: Pending; at: number }>> = {};
  private closingAt?: number;
  private previous = new Map<TravellerId, { x: number; lane: number }>();
  private licoWaiting = false;

  get licoPosition() {
    return this.previous.get("lico");
  }
  get leonPosition() {
    return this.previous.get("leon");
  }

  prepare(frame: Frame, key: string, view: RoadViewport): Frame {
    if (!frame.look.mossBeds?.seedlings) return frame;
    if (this.key !== key) {
      this.key = key;
      this.seen.clear();
      this.queues = { leon: [], finn: [] };
      this.playing = {};
      this.closingAt = undefined;
      this.previous.clear();
      this.licoWaiting = false;
    }
    const { battle, look } = frame;
    if (look.mossBeds?.completed) {
      this.closingAt ??= battle.time;
      this.queues = { leon: [], finn: [] };
      this.playing = {};
      return this.prepareReturn(frame, view);
    }
    this.capture(battle);
    const heroes = battle.heroes;
    const next: RoadBattle = {
      ...battle,
      heroes: heroes.map((hero) => this.position(hero, battle, view)),
      enemies: battle.enemies.map((enemy) => this.visualEnemy(enemy, battle.time)),
      effects: battle.effects.filter((effect) => !(effect.kind === "slash" && melee(effect.hero))),
    };
    next.effects = remapFixedEffects(next, heroes, battle.enemies);
    return { battle: next, look };
  }

  private prepareReturn(frame: Frame, view: RoadViewport): Frame {
    const leon = frame.battle.heroes.find((hero) => hero.id === "leon");
    const previousLeon = this.previous.get("leon"),
      previousLico = this.previous.get("lico");
    this.licoWaiting = !!(
      leon &&
      leon.hp > 0 &&
      !leon.paralyzed &&
      previousLeon &&
      previousLico &&
      !waterwayAt(previousLeon, leon, view)
    );
    if (!this.licoWaiting || !previousLico) return frame;
    return {
      ...frame,
      battle: {
        ...frame.battle,
        heroes: frame.battle.heroes.map((hero) =>
          hero.id === "lico" ? { ...hero, ...previousLico } : hero,
        ),
      },
    };
  }

  private visualEnemy(enemy: RoadBattle["enemies"][number], now: number) {
    const pending = (["leon", "finn"] as const).reduce((total, id) => {
      const current = this.playing[id];
      const active =
        current?.pending.target === enemy.id && now - current.at < 150
          ? current.pending.effect.amount
          : 0;
      return (
        total +
        active +
        this.queues[id].reduce(
          (sum, entry) => sum + (entry.target === enemy.id ? entry.effect.amount : 0),
          0,
        )
      );
    }, 0);
    if (pending <= 0) return enemy;
    return { ...enemy, hp: Math.min(enemy.maxHp, enemy.hp + pending), pose: undefined };
  }

  private capture(battle: RoadBattle) {
    for (const effect of battle.effects) {
      if (effect.kind !== "slash" || !melee(effect.hero) || this.seen.has(effect.id)) continue;
      const enemy = battle.enemies.find((e) => e.x === effect.x && e.lane === effect.lane);
      if (!enemy) continue;
      this.seen.add(effect.id);
      this.queues[effect.hero].push({ effect, target: enemy.id });
    }
  }

  private position(hero: Traveller, battle: RoadBattle, view: RoadViewport): Traveller {
    if (
      hero.id === "lico" &&
      hero.hp > 0 &&
      !hero.paralyzed &&
      battle.enemies.some((enemy) => enemy.kind === "mushroom" && enemy.hp > 0)
    ) {
      const l = mossBedsLayout(view),
        origin = l.world(0, 0),
        shifted = l.portrait ? l.world(-150, -100) : l.world(-60, -150);
      return {
        ...hero,
        x: hero.x + shifted.x - origin.x,
        lane: hero.lane + shifted.lane - origin.lane,
      };
    }
    if (!melee(hero.id) || hero.hp <= 0 || hero.paralyzed) return hero;
    const id = this.playing[hero.id]?.pending.target ?? this.queues[hero.id][0]?.target;
    const target =
      battle.enemies.find((enemy) => enemy.id === id) ??
      battle.enemies.find((enemy) => enemy.kind === "mushroom" && enemy.hp > 0);
    if (!target) return hero;
    const point = this.target(target, hero.id, view);
    return { ...hero, ...point, facing: 1, walking: false };
  }

  private target(enemy: { x: number; lane: number }, id: MeleeId, view: RoadViewport) {
    const l = mossBedsLayout(view);
    const origin = l.world(0, 0);
    const scale = seedlingCastScale(l.portrait);
    const offset = l.world(
      (id === "leon" ? -25 : l.portrait ? -55 : -70) * scale,
      id === "leon" ? -70 : l.portrait ? 110 : 125,
    );
    return { x: enemy.x + offset.x - origin.x, lane: enemy.lane + offset.lane - origin.lane };
  }

  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const site = look.mossBeds;
    if (!site?.seedlings) return;
    this.faceReturning(battle.heroes, site.completed);
    if (site.completed) {
      site.visualComplete =
        (!this.licoWaiting &&
          battle.heroes.every((hero) => !hero.walking || hero.hp <= 0 || hero.paralyzed)) ||
        (this.closingAt !== undefined && battle.time - this.closingAt > 6000);
      return;
    }
    for (const id of ["leon", "finn"] as const) this.finishHero(id, battle, view);
  }

  private faceReturning(heroes: Traveller[], returning: boolean) {
    for (const hero of heroes) {
      const previous = this.previous.get(hero.id);
      if (returning && hero.walking && previous && Math.abs(hero.x - previous.x) > 0.01)
        hero.facing = hero.x > previous.x ? 1 : -1;
      this.previous.set(hero.id, { x: hero.x, lane: hero.lane });
    }
  }

  private finishHero(id: MeleeId, battle: RoadBattle, view: RoadViewport) {
    const hero = battle.heroes.find((h) => h.id === id);
    if (!hero || hero.hp <= 0 || hero.paralyzed) {
      this.queues[id] = [];
      this.playing[id] = undefined;
      return;
    }
    let current = this.playing[id];
    if (current && battle.time - current.at >= 600) {
      this.playing[id] = undefined;
      current = undefined;
    }
    const pending = this.queues[id].at(0);
    const enemy = battle.enemies.find((e) => e.id === pending?.target);
    if (
      !current &&
      pending &&
      enemy &&
      !hero.walking &&
      waterwayAt(hero, this.target(enemy, id, view), view)
    ) {
      this.queues[id].shift();
      current = { pending, at: battle.time };
      this.playing[id] = current;
    }
    if (current)
      battle.effects.push({
        ...current.pending.effect,
        at: current.at,
        fromX: hero.x,
        fromLane: hero.lane,
      });
  }
}
