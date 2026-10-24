import { actor, ground, npc, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageExtra } from "./story-stage-cues.ts";

const cook = (patch: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("cook", "料理人", 66),
  bottom: 28,
  ...patch,
});
function meeting(): LaterBeat[] {
  return [
    {
      at: 0,
      actors: { finn: { x: 70, bottom: 46, left: false } },
      items: [
        ground("basket", 28, 16, 7),
        ground("delivery-bag", 55, 8, 8),
        ground("medicine-closed", 17, 32, 8),
      ],
      sequence: [
        { after: 1000, actors: { finn: { knock: true } } },
        { after: 2200, actors: { finn: { knock: false } } },
        {
          after: 2700,
          actors: { finn: { x: 66, bottom: 21, left: true, via: [{ x: 70, bottom: 32 }] } },
        },
      ],
    },
    {
      at: 3,
      background: "manor-kitchen-open",
      cut: false,
      actors: { finn: { pose: "idle" } },
      extras: [cook({ x: 81, bottom: 60 })],
      sequence: [
        { after: 300, extras: [cook({ via: [{ x: 77, bottom: 47 }] })] },
        { after: 2100, extras: [cook({ grip: "reach" })] },
        { after: 2800, extras: [cook({ grip: "hold" })] },
      ],
    },
    { at: 4, extras: [cook({ grip: "hold", speaking: true })] },
    { at: 5, actors: { finn: { pose: "idle" } } },
    { at: 7, actors: { finn: { pose: "idle" } } },
  ];
}
export const manorDoor = scene(
  "manor-kitchen",
  [
    actor("aria", 34, { bottom: 18 }),
    actor("leon", 50, { bottom: 18, left: false }),
    actor("mira", 23, { bottom: 33, left: false }),
    actor("finn", 70, { bottom: 28, left: false }),
  ],
  [
    ...meeting(),
    {
      at: 8,
      extras: [cook({ grip: "hold", speaking: true })],
      sequence: [
        { after: 1000, extras: [cook({ grip: "reach" })] },
        { after: 1800, extras: [cook({ x: 80, bottom: 31 })] },
      ],
    },
    { at: 9, extras: [cook({ x: 80, bottom: 31 })] },
    { at: 11, extras: [cook({ x: 80, bottom: 31, pose: "explain", speaking: true })] },
    { at: 12, extras: [cook({ x: 80, bottom: 31 })] },
  ],
);
