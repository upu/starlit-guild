import type { RoadBattle, Traveller } from "./road-view.ts";
import { roadTravellerCanMove } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { mossBedsLayout, fieldCastScale } from "./road-moss-beds-layout.ts";
import { recordsPoint } from "./road-lico-positions.ts";
import { waterwayAt } from "./road-waterway-contacts.ts";
import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import { handheldPalm, handheldWidth } from "./road-handheld.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
const LEON_PALM = [146, 99] as const;
const FINN_PALM = [59, 100] as const;

function recordsWork(look: RoadLook, battle: RoadBattle) {
  const site = look.mossBeds;
  return (
    !!site?.records &&
    site.node < 14 &&
    !site.recordsClosing &&
    !site.completed &&
    !battle.enemies.some((enemy) => enemy.kind === "lico")
  );
}
function documentWork(look: RoadLook, battle: RoadBattle) {
  return recordsWork(look, battle) && (look.mossBeds?.node ?? 0) % 3 === 1;
}
function readerReady(hero?: Traveller): hero is Traveller {
  return !!hero && !hero.walking && roadTravellerCanMove(hero) && !hero.paralyzed;
}

/** The existing paper carrier brings the record to Leon at the same body scale. */
export function recordsDocumentTarget(portrait: boolean): [number, number] {
  const [x, y] = recordsPoint("leon", portrait);
  const ratio = 0.9 * (portrait ? 0.78 : 1) * fieldCastScale(portrait);
  return [x + (LEON_PALM[0] - FINN_PALM[0]) * ratio, y + (LEON_PALM[1] - FINN_PALM[1]) * ratio];
}

export class RoadRecordsDocuments {
  private runKey = "";
  private received = false;
  private key = "";
  private contactAt?: number;
  private outward = 0;
  private homeward = 0;
  prepare(frame: Frame, view: RoadViewport, key: string, reduced = false): Frame {
    if (key !== this.runKey) {
      this.runKey = key;
      this.received = false;
      this.key = "";
    }
    if (!documentWork(frame.look, frame.battle)) return frame;
    const current = `${key}:${String(frame.look.mossBeds?.node)}`;
    if (current !== this.key) {
      this.key = current;
      this.contactAt = undefined;
      this.outward = this.homeward = 0;
    }
    if (!reduced && this.homeward >= 3) return frame;
    const receiver = frame.battle.heroes.find((hero) => hero.id === "leon");
    if (!receiver || !roadTravellerCanMove(receiver) || receiver.paralyzed) return frame;
    const layout = mossBedsLayout(view);
    const target = reduced
      ? recordsDocumentTarget(layout.portrait)
      : this.point(layout.portrait, frame.battle.time);
    return {
      ...frame,
      battle: {
        ...frame.battle,
        heroes: frame.battle.heroes.map((hero) =>
          hero.id === "finn" && roadTravellerCanMove(hero) && !hero.paralyzed
            ? { ...hero, ...layout.world(...target), facing: 1 }
            : hero,
        ),
      },
    };
  }

  private age(time: number) {
    return this.contactAt === undefined ? -1 : Math.max(0, time - this.contactAt);
  }

  private point(portrait: boolean, time: number): [number, number] {
    const base = recordsPoint("finn", portrait),
      target = recordsDocumentTarget(portrait);
    const front = portrait ? 880 : 890;
    const near: [number, number] = [base[0], front],
      far: [number, number] = [target[0], front];
    return this.age(time) >= 2700
      ? [far, near, base][Math.min(2, this.homeward)]
      : [near, far, target][this.outward];
  }

  finish(battle: RoadBattle, look: RoadLook, view: RoadViewport, reduced = false) {
    if (!recordsWork(look, battle)) return;
    const scene = battle.waterwayActions;
    const leon = battle.heroes.find((hero) => hero.id === "leon");
    const finn = battle.heroes.find((hero) => hero.id === "finn");
    if (!scene || !finn || !readerReady(leon)) return;
    const offering = documentWork(look, battle) && this.contact(battle, finn, view, reduced);
    const shared = offering && !reduced && this.age(battle.time) < 500;
    if (offering && !shared) this.received = true;
    if (!shared && !this.received) return;
    this.poses(scene, leon, finn, shared);
    this.copy(battle, leon, view, shared ? LEON_PALM : handheldPalm("leon", 0));
  }

  private poses(
    scene: NonNullable<RoadBattle["waterwayActions"]>,
    leon: Traveller,
    finn: Traveller,
    shared: boolean,
  ) {
    scene.poses.leon = {
      asset: shared
        ? "/storybook-study/leon-conversation-v1.webp"
        : "/storybook-study/leon-handheld-v1.webp",
      frame: shared ? 2 : 0,
    };
    if (shared) {
      scene.poses.finn = {
        asset: "/storybook-study/finn-conversation-balanced-v3.webp",
        frame: 2,
      };
      finn.facing = 1;
    }
    leon.facing = 1;
  }

  private contact(
    battle: RoadBattle,
    finn: RoadBattle["heroes"][number],
    view: RoadViewport,
    reduced: boolean,
  ) {
    if (!reduced && this.homeward >= 3) return false;
    if (finn.walking || !roadTravellerCanMove(finn) || finn.paralyzed) return false;
    const layout = mossBedsLayout(view);
    if (!this.ready(finn, view, battle.time, reduced)) return false;
    if (!waterwayAt(finn, layout.world(...recordsDocumentTarget(layout.portrait)), view))
      return false;
    this.contactAt ??= battle.time;
    return true;
  }

  private copy(
    battle: RoadBattle,
    leon: RoadBattle["heroes"][number],
    view: RoadViewport,
    palm: readonly number[],
  ) {
    const scene = battle.waterwayActions;
    if (!scene) return;
    const layout = mossBedsLayout(view);
    const figure = layout.figureRatio * fieldCastScale(layout.portrait);
    const pixel = (roadHeroSize(view.width, view.height) * figure * 0.9) / 144;
    scene.props.push({
      id: "keeper-record-copy",
      asset: "/storybook-study/shipping-record-v1.webp",
      point: {
        x: leon.x + ((palm[0] - 96) * pixel) / roadScale(view.width),
        lane: leon.lane + ((palm[1] - 176) * pixel) / roadDepth(view.width, view.height),
      },
      size: handheldWidth("field-paper", view, figure) / roadHeroSize(view.width, view.height),
      depth: leon.lane + 0.04,
    });
  }

  private ready(
    finn: RoadBattle["heroes"][number],
    view: RoadViewport,
    time: number,
    reduced: boolean,
  ) {
    if (reduced) return true;
    const layout = mossBedsLayout(view);
    if (!waterwayAt(finn, layout.world(...this.point(layout.portrait, time)), view)) return false;
    if (this.age(time) >= 2700) {
      this.homeward++;
      return false;
    }
    if (this.outward < 2) {
      this.outward++;
      return false;
    }
    return true;
  }
}
