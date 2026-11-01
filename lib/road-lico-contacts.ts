import type { RoadBattle, TravellerId } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { mossBedsLayout, fieldCastScale } from "./road-moss-beds-layout.ts";
import { waterwayAt } from "./road-waterway-contacts.ts";
import { recordsPoint } from "./road-lico-positions.ts";

type Dialogue = NonNullable<NonNullable<RoadLook["mossBeds"]>["recordsDialogue"]>;
function canSupport(battle: RoadBattle, dialogue?: Dialogue) {
  if (dialogue?.cue !== "support" || !dialogue.patient || dialogue.patient === "mira") return false;
  const mira = battle.heroes.find((hero) => hero.id === "mira");
  const patient = battle.heroes.find((hero) => hero.id === dialogue.patient);
  return !!mira && mira.hp > 0 && !mira.paralyzed && !!patient && patient.hp > 0;
}
function canCloseBottle(battle: RoadBattle, dialogue?: Dialogue) {
  const finn = battle.heroes.find((hero) => hero.id === "finn");
  return (
    dialogue?.cue === "bottle" &&
    !!finn &&
    finn.hp > 0 &&
    !finn.paralyzed &&
    battle.enemies.some((enemy) => enemy.kind === "lico" && enemy.hp > 0)
  );
}

/** Coordinates are in the painting; sprite hands and the bottle use the same image scale. */
export function recordsContactTarget(
  id: TravellerId,
  battle: RoadBattle,
  dialogue: Dialogue | undefined,
  portrait: boolean,
): [number, number] | undefined {
  const ratio = (portrait ? 0.78 : 1) * fieldCastScale(portrait);
  if (dialogue?.patient && canSupport(battle, dialogue)) {
    const patient = recordsPoint(dialogue.patient, portrait);
    if (id === dialogue.patient) return patient;
    if (id === "mira") return [patient[0] - 49.5 * ratio, patient[1] - 14.4 * ratio];
  }
  if (id === "finn" && canCloseBottle(battle, dialogue)) {
    const board = recordsPoint("reflector", portrait);
    return [board[0] - 28.4 * ratio, board[1] + 33.9 * ratio];
  }
  return undefined;
}

export function finishRecordsContacts(
  battle: RoadBattle,
  look: RoadLook,
  view: RoadViewport,
  reduced = false,
) {
  const scene = battle.waterwayActions,
    dialogue = look.mossBeds?.recordsDialogue;
  if (!scene || !dialogue) return;
  const l = mossBedsLayout(view);
  for (const hero of battle.heroes) {
    const target = recordsContactTarget(hero.id, battle, dialogue, l.portrait);
    if (!target || hero.walking || hero.paralyzed || !waterwayAt(hero, l.world(...target), view))
      continue;
    const pose = contactPose(hero.id, dialogue, battle.time, reduced);
    if (pose) scene.poses[hero.id] = pose;
  }
}
function contactPose(id: TravellerId, dialogue: Dialogue, time: number, reduced: boolean) {
  if (id === "mira" && dialogue.cue === "support")
    return { asset: "/storybook-study/mira-moss-care-v1.webp", frame: 3, rows: 2 };
  if (id === "finn" && dialogue.cue === "bottle")
    return {
      asset: "/storybook-study/finn-gloves-balanced-v2.webp",
      frame: reduced || Math.floor(time / 400) % 2 === 0 ? 4 : 6,
      rows: 2,
    };
  return undefined;
}
