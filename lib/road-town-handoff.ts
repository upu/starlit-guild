import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import {
  foundingRecipient,
  foundingRecipientHand,
  foundingRecipientTurn,
  foundingRecipientWalk,
} from "./road-founding-recipient.ts";
import {
  waterwayMix,
  waterwayPalm,
  waterwayFoot,
  type WaterwayActions,
  type WaterwayPoint,
} from "./road-waterway-contacts.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";

export const townParcelAsset = "/storybook-study/delivery-box-v2.webp";
export const townReceipt = "/storybook-study/shipping-record-v1.webp";
const clamp = (v: number) => Math.max(0, Math.min(1, v));

function recipientFrame(age: number | undefined, approaching: boolean) {
  if (age === undefined) return 0;
  if (approaching) return Math.floor(age / 120) % 4;
  return age < 1250 ? 2 : 1;
}
function recipientPose(age: number | undefined, near: number) {
  const approaching = age !== undefined && near < 1;
  const holding = age !== undefined && age >= 850 && age < 1250;
  return {
    asset: approaching
      ? foundingRecipientWalk
      : holding
        ? foundingRecipientTurn
        : foundingRecipient,
    frame: recipientFrame(age, approaching),
    cell: 128,
    rows: 1,
    square: { foot: 120, height: 104 },
  };
}

function receiveBox(
  scene: WaterwayActions,
  center: number,
  foot: WaterwayPoint,
  view: RoadViewport,
  age: number,
) {
  if (age < 450) return;
  const size = roadHeroSize(view.width, view.height);
  const ground = { x: center, lane: 0.82 };
  const held = {
    x: foot.x,
    lane: foot.lane - (35 * size) / 104 / roadDepth(view.width, view.height),
  };
  scene.debrisHidden = true;
  scene.props.push({
    id: "town-delivered-box",
    asset: townParcelAsset,
    point: waterwayMix(ground, held, (age - 450) / 600),
    size: 0.6,
    depth: foot.lane + 0.03,
    origin: { x: 0.5, y: 1 },
  });
  scene.poses.aria = { asset: "/storybook-study/aria-conversation-v1.webp", frame: 0 };
}

function addReceipt(
  scene: WaterwayActions,
  battle: RoadBattle,
  view: RoadViewport,
  receiver: Traveller,
  foot: WaterwayPoint,
  age: number,
) {
  if (age < 1250) return;
  const palm = receiver.id === "aria" ? [143, 108] : [134, 105];
  const receiverHand = waterwayPalm(receiver, palm, -1, view);
  const sender = foundingRecipientHand(foot, view, battle.stage, -1);
  const point = waterwayMix(sender, receiverHand, clamp((age - 1250) / 500));
  scene.props.push({
    id: "town-receipt",
    asset: townReceipt,
    point,
    size: 0.18,
    depth: Math.max(receiver.lane, foot.lane) + 0.05,
    origin: { x: 0.5, y: 0.5 },
  });
}

function receiverHandoff(
  receiver: Traveller,
  foot: WaterwayPoint,
  battle: RoadBattle,
  view: RoadViewport,
  age: number,
) {
  const size = roadHeroSize(view.width, view.height);
  const original = { x: receiver.x, lane: receiver.lane };
  const below = {
    x: original.x,
    lane: original.lane + (size * 0.8) / roadDepth(view.width, view.height),
  };
  const recipientHand = foundingRecipientHand(foot, view, battle.stage, -1);
  const palm = receiver.id === "aria" ? [143, 108] : [134, 105];
  const target = waterwayFoot(recipientHand, palm, -1, view);
  const around = { x: target.x, lane: below.lane };
  const point =
    age < 350
      ? waterwayMix(original, below, age / 350)
      : age < 900
        ? waterwayMix(below, around, (age - 350) / 550)
        : waterwayMix(around, target, (age - 900) / 350);
  Object.assign(receiver, point, { facing: age < 1250 ? 1 : -1, walking: age < 1250 });
  return age < 1250
    ? { asset: `/storybook-study/${receiver.id}-walk-v1.webp`, frame: Math.floor(age / 150) % 4 }
    : { asset: `/storybook-study/${receiver.id}-conversation-v1.webp`, frame: 2 };
}

/** Display a recipient at the destination; after lowering, they approach the box. */
export function townHandoff(
  battle: RoadBattle,
  view: RoadViewport,
  center: number,
  groundAge?: number,
  appearance = 1,
  receiverId: "aria" | "leon" = "leon",
) {
  const size = roadHeroSize(view.width, view.height);
  const near = groundAge === undefined ? 0 : clamp(groundAge / 450);
  const foot = {
    x: center + ((1.4 - near * 0.715) * size) / roadScale(view.width, battle.stage),
    lane: 0.82 + (14 * size) / 104 / roadDepth(view.width, view.height),
  };
  const scene = battle.waterwayActions ?? {
    poses: {},
    props: [],
    debrisHidden: false,
    closeContact: false,
  };
  battle.waterwayActions = scene;
  scene.actors = [
    ...(scene.actors ?? []),
    {
      id: "town-delivery-recipient",
      point: foot,
      facing: groundAge !== undefined && groundAge >= 1250 ? -1 : 1,
      alpha: clamp(appearance),
      size: 1,
      pose: recipientPose(groundAge, near),
    },
  ];
  if (groundAge === undefined) return;
  receiveBox(scene, center, foot, view, groundAge);
  const receiver = battle.heroes.find((hero) => hero.id === receiverId);
  if (!receiver) return;
  scene.poses[receiverId] = receiverHandoff(receiver, foot, battle, view, groundAge);
  addReceipt(scene, battle, view, receiver, foot, groundAge);
}
