import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { housecallsLayout } from "./road-housecalls-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { waterwayAt } from "./road-waterway-contacts.ts";
import { roadX, roadY } from "./road-layout.ts";
import { RoadGait } from "./road-gait.ts";
import { chapterThreeWork } from "./chapter-three.ts";
import { receptionReturnScene, receptionReturnTarget } from "./road-garden-reception-return.ts";

export const gardenReceptionAssets = {
  bank: "/storybook-study/manor-back-paths-v1.png",
  destination: "/storybook-study/manor-display-back-v1.png",
  cart: "/storybook-study/garden-handcart-v2.webp",
  parcel: "/story-stage/prop-wrapped-stone.webp",
  pot: "/storybook-study/garden-pot-v1.webp",
  push: "/storybook-study/finn-push-balanced-v2.webp",
  notes: "/storybook-study/leon-route-notes-v1.webp",
  inspect: "/storybook-study/aria-work-v1.webp",
  table: "/storybook-study/medicine-table-v1.webp",
  covered: "/storybook-study/display-covered-v1.webp",
  servant: "/storybook-study/merchant-poses-v2.webp",
  marker: "/storybook-study/return-marker-v1.webp",
};
type Frame = { battle: RoadBattle; look: RoadLook };
type Point = { x: number; y: number };
// The balanced push palms meet the cart's front crossbar at this foot position.
const grip = { x: 139, y: 30 };
const destination = (round: number): Point => ({ x: 1000 - round * 90, y: 710 - round * 20 });

export function presentGardenReception(frame: Frame, input: AdventureInput, view: RoadViewport) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "garden-reception" ||
    input.backgroundOverride !== gardenReceptionAssets.bank
  )
    return;
  look.gardenReception = {
    node: input.squad.run?.node ?? (input.questComplete ? 14 : 0),
    completed: !!input.questComplete && !input.squad.run,
  };
  Object.assign(look, {
    background: gardenReceptionAssets.bank,
    backgroundShade: 0.04,
    destination: false,
    puller: null,
    frontCarriers: [],
    workers: [],
  });
  Object.assign(battle, { distance: 0, stage: "forest", effects: [] });
  const l = housecallsLayout(view);
  battle.heroes = battle.heroes.map((hero, i) => ({
    ...hero,
    ...l.world(450 + i * 160, 850),
    walking: false,
    facing: -1,
  }));
  if (battle.gathering && look.work) {
    Object.assign(battle.gathering, { ...l.world(720, 650), task: "inspect", kind: "herb" });
    Object.assign(look.work, {
      frame: "housecalls",
      task: "inspect",
      cargo: false,
      asset: gardenReceptionAssets.cart,
    });
  }
}

/** The cargo follows the drawn pusher, so the handle and load cannot drift apart. */
export class RoadGardenReception {
  private key = "";
  private node = 0;
  private cart: Point = { x: 1090, y: 730 };
  private step: "approach" | "push" | "done" = "approach";
  private at?: number;
  private doneAt?: number;
  private transitionAt?: number;
  private arrived = false;
  private reduced = false;
  private gait = new RoadGait();

  prepare(frame: Frame, key: string, view: RoadViewport, reduced = false): Frame {
    const site = frame.look.gardenReception;
    if (!site) return frame;
    this.reduced = reduced;
    if (this.key !== key) {
      this.key = key;
      this.node = site.node;
      this.cart = site.node ? destination(Math.floor((site.node - 1) / 3)) : { x: 1090, y: 730 };
      this.step = "approach";
      this.at = this.doneAt = this.transitionAt = undefined;
      this.arrived = site.completed;
      this.gait = new RoadGait();
    }
    if (
      site.node > this.node &&
      this.step === "done" &&
      frame.battle.time - (this.doneAt ?? frame.battle.time) >= 300
    ) {
      this.node++;
      this.step = "approach";
      this.at = this.doneAt = undefined;
    }
    const fade = this.transition(frame.battle.time);
    const l = housecallsLayout(view);
    const battle: RoadBattle = {
      ...frame.battle,
      waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: true },
      heroes: frame.battle.heroes.map((hero) => ({
        ...hero,
        ...l.world(...this.target(hero.id)),
        walking: false,
        facing: hero.id === "aria" ? 1 : -1,
      })),
    };
    const look = {
      ...frame.look,
      background: this.arrived ? gardenReceptionAssets.destination : gardenReceptionAssets.bank,
      gardenReception: { ...site, node: this.node, arrived: this.arrived, fade },
      workers: [] as string[],
    };
    if (look.work)
      look.work = {
        ...look.work,
        label: chapterThreeWork("garden-reception", this.node)?.name ?? look.work.label,
      };
    return { battle, look };
  }
  private transition(time: number) {
    if (this.node !== 14 || (this.arrived && this.transitionAt === undefined)) return 0;
    this.transitionAt ??= time;
    if (this.reduced) {
      this.arrived = true;
      return 0;
    }
    const elapsed = Math.max(0, time - this.transitionAt);
    if (elapsed >= 400) this.arrived = true;
    return Math.max(0, 1 - Math.abs(elapsed - 400) / 400);
  }
  private target(id: Traveller["id"]): [number, number] {
    if (this.arrived) return receptionReturnTarget(id);
    const p =
      this.node % 3 === 0 && this.step === "push"
        ? destination(Math.floor(this.node / 3))
        : this.cart;
    const points: Partial<Record<Traveller["id"], [number, number]>> = {
      finn: [p.x + grip.x, p.y + grip.y],
      aria: [this.cart.x - (this.node % 3 === 2 ? 190 : 260), this.cart.y - 85],
      leon: [this.cart.x - 300, this.cart.y + 85],
      mira: [this.cart.x + 20, this.cart.y + 170],
    };
    return points[id] ?? [1250, 850];
  }
  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
    const scene = battle.waterwayActions;
    if (!look.gardenReception || !scene) return;
    if (this.arrived) {
      receptionReturnScene(scene, view);
      return;
    }
    const finn = battle.heroes.find((hero) => hero.id === "finn");
    if (!finn) return;
    const l = housecallsLayout(view);
    const target = l.world(...this.target("finn"));
    const at = !finn.walking && waterwayAt(finn, target, view);
    if (at) this.at ??= battle.time;
    this.updateCartAndPoses(battle, finn, scene, view, at);
    receptionCart(scene, view, this.cart);
    this.advance(battle.time, at);
  }
  private updateCartAndPoses(
    battle: RoadBattle,
    finn: Traveller,
    scene: NonNullable<RoadBattle["waterwayActions"]>,
    view: RoadViewport,
    at: boolean,
  ) {
    const l = housecallsLayout(view);
    if (this.node % 3 === 0 && this.step === "push") {
      this.cart = {
        x: (roadX(finn.x, 0, view.width) - l.backdrop.x) / l.scale - grip.x,
        y: (roadY(finn.lane, view.height, view.width) - l.backdrop.y) / l.scale - grip.y,
      };
    }
    const stride = this.gait.frame(finn, {
      ...view,
      stage: battle.stage,
      figureSize: l.figureSize,
    });
    if (this.step === "push" || at) {
      finn.facing = -1;
      scene.poses.finn = {
        asset: gardenReceptionAssets.push,
        frame: finn.walking && !this.reduced ? 2 + stride : 1,
        rows: 2,
      };
    }
    if (this.node % 3 === 1) this.inspectPoses(battle, scene);
  }
  private inspectPoses(battle: RoadBattle, scene: NonNullable<RoadBattle["waterwayActions"]>) {
    if (!battle.heroes.find((hero) => hero.id === "leon")?.walking)
      scene.poses.leon = { asset: gardenReceptionAssets.notes, frame: 1 };
    if (!battle.heroes.find((hero) => hero.id === "aria")?.walking)
      scene.poses.aria = { asset: gardenReceptionAssets.inspect, frame: 1 };
  }
  private advance(time: number, at: boolean) {
    if (!at || time - (this.at ?? time) < 600) return;
    if (this.node % 3 === 0 && this.step === "approach") {
      this.step = "push";
      this.at = undefined;
    } else if (this.step !== "done") {
      this.step = "done";
      this.doneAt = time;
    }
  }
}

export function receptionCart(
  scene: NonNullable<RoadBattle["waterwayActions"]>,
  view: RoadViewport,
  p: Point,
) {
  const l = housecallsLayout(view);
  const cart = housecallProp(
    view,
    "reception-cart",
    gardenReceptionAssets.cart,
    l.world(p.x, p.y),
    288,
  );
  scene.props.push(cart);
  for (const [id, asset, dx, dy, width] of [
    ["replacement-parcel", gardenReceptionAssets.parcel, -33, -96, 69],
    ["cart-pot-0", gardenReceptionAssets.pot, -77, -118, 66],
    ["cart-pot-1", gardenReceptionAssets.pot, 22, -81, 66],
  ] as const) {
    const prop = housecallProp(view, id, asset, l.world(p.x + dx, p.y + dy), width);
    prop.depth = cart.depth + 0.01;
    scene.props.push(prop);
  }
}
