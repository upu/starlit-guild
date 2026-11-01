import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadLook } from "./road-look.ts";
import { foundingCartAsset, journeyCartGrip } from "./road-journey-cart.ts";
import { roadTravellerCanMove, type RoadBattle, type Traveller } from "./road-view.ts";

type Frame = { battle: RoadBattle; look: RoadLook };

function openingAllowed({ battle, look }: Frame, finn?: Traveller) {
  const draft = look.foundingDraft;
  const cart = battle.journeyCart;
  return (
    !!draft &&
    draft.node === 0 &&
    !draft.completed &&
    draft.actor !== "finn" &&
    cart?.asset === foundingCartAsset &&
    cart.phase === "parked" &&
    battle.phase !== "rest" &&
    !battle.enemies.some((enemy) => enemy.hp > 0) &&
    !!finn &&
    roadTravellerCanMove(finn) &&
    !finn.paralyzed
  );
}

/** The preceding conversation already leaves Finn holding the cart. */
export class FoundingOpening {
  private key = "";
  private start = 0;
  private active = false;

  prepare(frame: Frame, key: string, view: RoadViewport, reduced: boolean): Frame {
    const { battle, look } = frame;
    const cart = battle.journeyCart;
    const finn = battle.heroes.find((hero) => hero.id === "finn");
    const allowed = openingAllowed(frame, finn);
    if (this.key !== key) {
      this.key = key;
      this.start = battle.time;
      this.active = allowed && !reduced && (look.foundingDraft?.departureAge ?? Infinity) <= 1000;
    }
    if (!allowed || reduced || battle.time - this.start >= 800) this.active = false;
    if (!this.active || !cart || !finn || !look.foundingDraft) return frame;
    const grip = journeyCartGrip(finn, cart, view, battle.stage);
    return {
      look: { ...look, foundingDraft: { ...look.foundingDraft, openingGrip: true } },
      battle: {
        ...battle,
        heroes: battle.heroes.map((hero) =>
          hero.id === "finn" ? { ...hero, ...grip, facing: 1, walking: false } : hero,
        ),
      },
    };
  }
}
