import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, TravellerId } from "./road-view.ts";
import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import { waterwayPalm } from "./road-waterway-contacts.ts";
export { brekkaInitialPosition } from "./road-brekka-initial-spacing.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
type Foot = { x: number; lane: number };
const palms: Record<TravellerId, [number, number]> = {
  finn: [116, 120],
  leon: [81, 122],
  aria: [119, 120],
  mira: [109, 126],
  lico: [114, 120],
};

/** Hold the actual visible positions while the group checks the notes. */
export function freezeBrekkaNoteTargets(
  battle: RoadBattle,
  look: RoadLook,
  feet: Map<string, Foot>,
) {
  if (!look.brekkaNotes) return battle;
  return {
    ...battle,
    heroes: battle.heroes.map((hero) => ({ ...hero, ...feet.get(hero.id), walking: false })),
  };
}

export function freezeBrekkaNotesFrame(frame: Frame, feet: Map<string, Foot>) {
  return { ...frame, battle: freezeBrekkaNoteTargets(frame.battle, frame.look, feet) };
}

function target(battle: RoadBattle, view: RoadViewport) {
  const cart = battle.journeyCart;
  if (!cart) return;
  const size = roadHeroSize(view.width, view.height);
  return {
    x: cart.x + (size * 1.25) / roadScale(view.width, battle.stage),
    lane: cart.lane - (size * 0.55) / roadDepth(view.width, view.height),
  };
}

/** Stay at the visiting homes and walk to a safe spot beside the parked cart. */
export class BrekkaNotes {
  private key = "";
  private positions = new Map<TravellerId, { x: number; lane: number; facing: 1 | -1 }>();
  prepare(frame: Frame, view: RoadViewport, runKey: string): Frame {
    const notes = frame.look.brekkaNotes,
      point = target(frame.battle, view);
    if (!notes || !point) return frame;
    const key = `${runKey}:${String(notes.generation)}`;
    if (key !== this.key) {
      this.key = key;
      this.positions = new Map(
        frame.battle.heroes.map((h) => [h.id, { x: h.x, lane: h.lane, facing: h.facing }]),
      );
    }
    return {
      ...frame,
      battle: {
        ...frame.battle,
        waterwayActions: { poses: {}, props: [], debrisHidden: true, closeContact: false },
        heroes: frame.battle.heroes.map((hero) => ({
          ...hero,
          ...(hero.id === notes.actor
            ? { ...point, facing: 1 as const }
            : this.positions.get(hero.id)),
          walking: false,
        })),
      },
    };
  }
}

export function finishBrekkaNotes(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
  const notes = look.brekkaNotes,
    scene = battle.waterwayActions,
    point = target(battle, view);
  if (!notes || !scene || !point) return;
  const hero = battle.heroes.find((h) => h.id === notes.actor);
  if (!hero || hero.walking) return;
  const asset = noteAsset(hero.id);
  scene.poses[hero.id] = {
    asset: `/storybook-study/${asset}.webp`,
    frame: hero.id === "lico" ? 1 : notes.node % 2 ? 3 : 0,
    rows: hero.id === "lico" ? 1 : 2,
  };
  const hand = waterwayPalm(hero, palms[hero.id], hero.facing, view);
  scene.props.push({
    id: "brekka-notes-in-hand",
    asset: "/storybook-study/shipping-record-v1.webp",
    point: hand,
    size: 0.24,
    depth: hero.lane + 0.02,
    origin: { x: 0.5, y: 0.7 },
  });
}

function noteAsset(id: TravellerId) {
  return (
    {
      finn: "finn-handheld-balanced-v2",
      aria: "aria-night-handheld-v1",
      lico: "lico-conversation-ponytail-v1",
      leon: "leon-handheld-v1",
      mira: "mira-handheld-v1",
    } as const
  )[id];
}
