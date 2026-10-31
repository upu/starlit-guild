import type { RoadViewport } from "./road-cart-layout.ts";
import { waterwayLayout } from "./road-waterway-layout.ts";
import { mossRemovalAssets as assets, mossBasketSupport } from "./road-moss-removal-layout.ts";
import {
  waterwayActionAssets as shared,
  waterwayPalm,
  waterwayMix,
  type WaterwayActions,
} from "./road-waterway-contacts.ts";

type Phase =
  | "idle"
  | "wait-departure"
  | "outbound"
  | "place"
  | "empty-approach"
  | "pickup"
  | "turn-right"
  | "return"
  | "turn-left"
  | "offer"
  | "done";
const palms = [
  [61, 111],
  [66, 111],
  [62, 111],
  [65, 111],
];
/** One worker and one parked cart. Full baskets remain where they were put down. */
export class RoadMossBasketShuttle {
  private phase: Phase = "idle";
  private x = 930;
  private travel = 0;
  private at = 0;
  private previous = 0;
  private final = false;
  private stored: [number, number][] = [];
  private spare = true;
  private delivery = 0;
  get ownsBasket() {
    return !["idle", "done"].includes(this.phase);
  }
  get waiting() {
    return this.phase === "offer";
  }
  get awaitingClearance() {
    return this.phase === "wait-departure";
  }
  get departing() {
    return ["wait-departure", "outbound", "place"].includes(this.phase);
  }
  depart(time: number) {
    if (this.awaitingClearance) this.setPhase("outbound", time);
  }
  get finished() {
    return this.phase === "done";
  }
  get readyToClose() {
    return (
      this.stored.length >= 2 ||
      (this.delivery === 1 && this.x < 800 && ["outbound", "place", "done"].includes(this.phase))
    );
  }
  point(view: RoadViewport) {
    return waterwayLayout(view.width, view.height).world(this.x, 800);
  }
  begin(time: number, final: boolean) {
    this.final = final;
    this.phase = "wait-departure";
    this.at = time;
    this.previous = time;
    this.delivery = this.stored.length;
  }
  takeEmpty() {
    this.phase = "idle";
  }
  restoreFirst() {
    this.stored = [[395, 748]];
    this.spare = false;
  }
  restoreComplete() {
    this.stored = [
      [395, 748],
      [440, 758],
    ];
    this.spare = false;
    this.phase = "done";
    this.x = 475;
  }
  paint(
    scene: WaterwayActions,
    view: RoadViewport,
    time: number,
    reduced: boolean,
    receiving: boolean,
  ) {
    const dt = Math.max(0, Math.min(0.05, (time - this.previous) / 1000));
    this.previous = time;
    this.advance(time, dt, view, reduced);
    this.paintCart(scene, view);
    const face = this.facing(time);
    const pose = this.pose(receiving);
    scene.worker = { point: this.point(view), pose, facing: face };
    if (this.ownsBasket)
      scene.props.push({
        id: "moss-active-basket",
        asset: this.full() ? assets.filled : assets.basket,
        point: this.basket(view, time, face),
        size: 0.3,
        depth: this.point(view).lane + 0.002,
      });
  }
  private full() {
    return ["wait-departure", "outbound", "place"].includes(this.phase);
  }
  private setPhase(phase: Phase, time: number) {
    this.phase = phase;
    this.at = time;
  }
  private advance(time: number, dt: number, view: RoadViewport, reduced: boolean) {
    const targets: Partial<Record<Phase, [number, Phase]>> = {
      outbound: [this.delivery ? 475 : 430, "place"],
      "empty-approach": [475, "pickup"],
      return: [930, "turn-left"],
    };
    const move = targets[this.phase];
    if (move) {
      const step =
        Math.sign(move[0] - this.x) *
        Math.min(Math.abs(move[0] - this.x), reduced ? 2000 : dt * 180);
      this.x += step;
      this.travel += Math.abs(step);
      if (Math.abs(this.x - move[0]) < 0.01) this.setPhase(move[1], time);
      return;
    }
    this.advanceRest(time, view, reduced);
  }
  private advanceRest(time: number, view: RoadViewport, reduced: boolean) {
    const age = reduced ? 1000 : time - this.at;
    if (this.phase === "place" && age >= 450) {
      this.completePlace(time);
      return;
    }
    if (this.phase === "pickup" && age >= 650) {
      this.spare = false;
      this.setPhase("turn-right", time);
      return;
    }
    const turns: Partial<Record<Phase, Phase>> = { "turn-right": "return", "turn-left": "offer" };
    const next = turns[this.phase];
    if (next && age >= 250) this.setPhase(next, time);
  }
  private completePlace(time: number) {
    this.stored.push(this.delivery ? [440, 758] : [395, 748]);
    this.setPhase(this.final ? "done" : "empty-approach", time);
  }
  private facing(time: number): 1 | -1 {
    if (["return", "empty-approach"].includes(this.phase)) return -1;
    if (this.phase === "turn-right") return time - this.at < 125 ? 1 : -1;
    if (this.phase === "turn-left") return time - this.at < 125 ? -1 : 1;
    return 1;
  }
  private pose(receiving: boolean) {
    const walking = ["outbound", "return", "empty-approach"].includes(this.phase);
    if (walking)
      return {
        asset: this.phase === "empty-approach" ? shared.worker : assets.workerWalk,
        frame: (this.phase === "empty-approach" ? 4 : 0) + (Math.floor(this.travel / 35) % 4),
        cell: 256,
        rows: this.phase === "empty-approach" ? 2 : 1,
      };
    const extended = !["idle", "done"].includes(this.phase) || receiving;
    return { asset: shared.worker, frame: extended ? 0 : 3, cell: 256, rows: 2 };
  }
  private held(view: RoadViewport, face: number, walking = false) {
    const palm = walking ? palms[Math.floor(this.travel / 35) % 4] : [62, 111];
    return mossBasketSupport(waterwayPalm(this.point(view), palm, face, view), view);
  }
  private storagePoint(view: RoadViewport) {
    return waterwayLayout(view.width, view.height).world(
      this.delivery ? 440 : 395,
      this.delivery ? 758 : 748,
    );
  }
  private basket(view: RoadViewport, time: number, face: number) {
    const age = time - this.at,
      held = this.held(view, face, ["outbound", "return"].includes(this.phase));
    if (this.phase === "place") return waterwayMix(held, this.storagePoint(view), age / 450);
    if (["empty-approach", "pickup"].includes(this.phase)) {
      const spare = waterwayLayout(view.width, view.height).world(440, 758);
      return this.phase === "pickup" ? waterwayMix(spare, held, (age - 300) / 350) : spare;
    }
    if (this.phase === "turn-right")
      return waterwayMix(this.held(view, 1), this.held(view, -1), age / 250);
    if (this.phase === "turn-left")
      return waterwayMix(this.held(view, -1), this.held(view, 1), age / 250);
    return held;
  }
  private paintCart(scene: WaterwayActions, view: RoadViewport) {
    const layout = waterwayLayout(view.width, view.height),
      depth = layout.world(440, 750).lane;
    scene.props.push({
      id: "moss-basket-cart",
      asset: assets.cart,
      point: layout.world(440, 810),
      size: 1.05,
      depth,
    });
    this.stored.forEach((point, index) =>
      scene.props.push({
        id: `stored-moss-basket-${String(index)}`,
        asset: assets.filled,
        point: layout.world(...point),
        size: 0.3,
        depth: depth + 0.002,
      }),
    );
    if (this.spare && !["empty-approach", "pickup"].includes(this.phase))
      scene.props.push({
        id: "moss-spare-basket",
        asset: assets.basket,
        point: layout.world(440, 758),
        size: 0.3,
        depth: depth + 0.002,
      });
  }
}
