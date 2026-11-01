import type { StageActor, StageItem, StageMoment, StoryStageCue } from "../story-stage-cues.ts";
import { mossBedsStudyCue } from "./moss-beds-cue.ts";

/** The same five bodies continue from the yard; only the ground setup changes. */
export function transplantNightStudyCue(cue: StoryStageCue): StoryStageCue {
  const prepared = mossBedsStudyCue(cue);
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    ...s,
    actors: s.actors.map(nightActor),
    items: withCartWheels((s.items ?? []).map(nightItem)),
  });
  return {
    ...prepared,
    ...adjust(prepared),
    cell: 19,
    description: "夜の運搬路。埋め戻した水路の脇と、乾いた木の根元。",
    initialBottom: { ...prepared.initialBottom, finn: (prepared.initialBottom?.finn ?? 40) - 8.5 },
    sequence: restartAfterGrip(
      prepared.sequence?.map((s) => {
        const state = adjust(s);
        // The short move needs enough time for the pulling gait to play once.
        return prepared.cut && s.after === 2200
          ? { ...s, ...state, actors: state.actors.map((a) => ({ ...a, paceMsPerUnit: 180 })) }
          : { ...s, ...state };
      }),
    ),
  };
}
function restartAfterGrip(steps?: StageMoment[]) {
  const attach = steps?.find((step) => step.after === 3800);
  const previous = steps?.find((step) => step.after === 3400);
  const cart = attach?.items.find((item) => item.id === "transplant-cart");
  const oldCart = previous?.items.find((item) => item.id === "transplant-cart");
  if (
    !steps ||
    !attach ||
    !previous ||
    cart?.actor !== "finn" ||
    oldCart?.support !== "wheel-board"
  )
    return steps;
  const slowerFinn = (actors: StageActor[]) =>
    actors.map((actor) => (actor.id === "finn" ? { ...actor, paceMsPerUnit: 80 } : actor));
  const waitLico = (actors: StageActor[]) =>
    actors.map((actor) =>
      actor.id === "lico" ? (previous.actors.find((a) => a.id === "lico") ?? actor) : actor,
    );
  return steps.flatMap((step) => {
    if (step === attach)
      return [
        { ...step, actors: slowerFinn(previous.actors) },
        { ...step, after: 4500, actors: waitLico(slowerFinn(step.actors)) },
      ];
    if (step.after === 4600)
      return [
        { ...step, actors: waitLico(slowerFinn(step.actors)) },
        { ...step, after: 5800, actors: slowerFinn(step.actors) },
      ];
    return step.after > 3800 ? [{ ...step, actors: slowerFinn(step.actors) }] : [step];
  });
}
function withCartWheels(items: StageItem[]): StageItem[] {
  const cart = items.find((item) => item.id === "transplant-cart");
  if (!cart) return items;
  const stuck = !!cart.tilt;
  // Wheel centers follow the axle on the 512x288 cart, including its tilted state.
  return [
    ...items,
    {
      id: "transplant-wheel-far",
      art: "cart-wheel",
      carrier: cart.id,
      width: 5.5,
      x: stuck ? -0.3 : -1,
      bottom: stuck ? 1.3 : 1.5,
      behindOwner: true,
    },
    {
      id: "transplant-wheel-near",
      art: "cart-wheel",
      carrier: cart.id,
      width: 5.5,
      x: stuck ? -5.8 : -6.6,
      bottom: stuck ? -0.4 : 1.5,
    },
  ];
}
function nightActor(a: StageActor): StageActor {
  const hands = a.id === "lico" ? [83, 77] : a.id === "finn" ? [80, 74] : [79, 76];
  const grip = Object.fromEntries([8, 9, 22, 23, 14, 15, 16].map((f) => [f, hands]));
  const actor: StageActor = {
    ...a,
    bottom: a.id === "finn" ? (a.bottom ?? 14) - 8.5 : a.bottom,
    wristPoints: { ...a.wristPoints, ...grip, 13: a.id === "finn" ? [101, 111] : [88, 111] },
    carryWalkFrames: [8, 9, 22, 23],
  };
  return contactActor(a, actor);
}
function contactActor(a: StageActor, actor: StageActor): StageActor {
  if (a.id === "aria") return ariaContact(a, actor);
  if (a.id === "mira") return miraContact(a, actor);
  if (a.id === "finn") return finnContact(a, actor);
  if (a.id === "lico") return licoContact(a, actor);
  return actor;
}
function finnContact(a: StageActor, actor: StageActor): StageActor {
  if ((a.x === 80 || a.x === 134) && a.pull) return { ...actor, nameAbove: true, nameOffset: 0 };
  if (a.x === 71 && a.bottom === 36 && a.pose === "offer")
    return { ...actor, nameAbove: true, nameOffset: 0 };
  if (a.x === 82 && a.inspect) return { ...actor, x: 79.5078125, bottom: 63.08984375 };
  return actor;
}
function licoContact(a: StageActor, actor: StageActor): StageActor {
  if (a.x === 80 && a.bottom === -12)
    return {
      ...actor,
      x: 82,
      bottom: 10,
      nameOffset: 35,
      via: [
        { x: 30, bottom: 0 },
        { x: 82, bottom: 0 },
      ],
    };
  if (a.x === 30) return { ...actor, x: 29.8203125, bottom: 5.51953125, left: true };
  return actor;
}
function miraContact(a: StageActor, actor: StageActor): StageActor {
  if (a.x === 64 && a.bottom === 25) return { ...actor, x: 60 };
  if (a.x === 66.9375) return { ...actor, x: 71, bottom: 14.5 };
  if (a.x === 70 && a.bottom === 12) return { ...actor, bottom: 18 };
  if (a.x !== 16.75) return actor;
  return {
    ...actor,
    x: 17.546875,
    bottom: 8.66015625,
    wristPoints: { ...actor.wristPoints, 13: [94, 113] },
    via: a.via?.map((p) => ({ ...p, x: p.x === 16.75 ? 17.546875 : p.x })),
  };
}
function ariaContact(a: StageActor, actor: StageActor): StageActor {
  // Both hands meet before the basket changes owner.
  if (a.x === 70.875) return { ...actor, x: 71.765625, bottom: 13.109375, carry: true };
  if (a.x === 29.625) return { ...actor, x: 23.4375, bottom: 13.08984375, left: false };
  if (a.x === 47.125) return { ...actor, x: 46.1875, bottom: 37.88984375 };
  if (a.x === 65 && a.bottom === -5) return { ...actor, x: 52, bottom: 18, nameAbove: true };
  return actor;
}
function nightItem(i: StageItem): StageItem {
  if (i.id === "transplant-basket") return square(i, 6.5);
  if (i.id === "transplant-moss") return { ...i, width: 3.5, bottom: 3.3 };
  if (i.id.startsWith("cart-moss-")) return cartPlant(i);
  if (i.id === "transplant-cart") return cartItem(i);
  if (i.id === "transplant-rope") return square({ ...i, pitch: i.actor ? 0 : 55 }, 4);
  if (i.id === "basket-cloth") return clothItem(i);
  if (i.id === "wheel-board" || i.id.startsWith("spare-board-")) return boardItem(i);
  return i;
}
function cartPlant(i: StageItem): StageItem {
  const left = i.id.endsWith("left");
  return { ...i, width: 3.5, x: left ? -6 : 1, bottom: left ? 13 : 11 };
}
function cartItem(i: StageItem): StageItem {
  return i.actor === "finn"
    ? { ...i, width: 25, x: i.x + 1.5, bottom: i.bottom + 10.5, behindOwner: true }
    : { ...i, width: 25 };
}
function boardItem(i: StageItem): StageItem {
  return {
    ...i,
    bottom: i.id === "wheel-board" && !i.actor && !i.carrier ? 39.8 : i.bottom,
    width: 10,
    ...(i.wrist ? { wristOffset: { x: 0, bottom: 10 * 0.75 * (1 / 1.3 - 1 / 4) } } : {}),
  };
}
function clothItem(i: StageItem): StageItem {
  if (i.carrier) return { ...i, width: 2.8, x: -1.5, bottom: 0.5 };
  return i.actor ? square(i, 7) : { ...i, width: 10, pitch: 55 };
}
function square(i: StageItem, width: number): StageItem {
  return {
    ...i,
    width,
    ...(i.wrist ? { wristOffset: { x: 0, bottom: -width * 0.75 * (1 - 1 / 1.3) } } : {}),
  };
}
