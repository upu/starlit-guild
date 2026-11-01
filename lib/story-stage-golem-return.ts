import { actor, npc, scene } from "./story-stage-later-shared.ts";
import { golemFieldItems } from "./story-stage-golem-items.ts";
import { golemCare } from "./story-stage-golem-care.ts";
export const golemReturn = scene(
  "workshop-yard",
  [
    actor("aria", 15, { bottom: 43, left: false }),
    actor("leon", 37, { bottom: 22, left: false, push: "brace" }),
    actor("mira", 43, { bottom: 62, left: true, carry: true }),
  ],
  [
    {
      at: 0,
      items: golemFieldItems("near").map((p) => (p.id === "golem" ? { ...p, x: 55 } : p)),
      extras: [{ ...npc("masked-pumpety", undefined, 96), bottom: 58 }],
      sequence: [
        {
          after: 300,
          actors: { leon: { push: "extend" } },
          items: golemFieldItems("near").map((p) =>
            p.id === "golem" ? { ...p, travelMs: 500 } : p,
          ),
        },
        { after: 1100, actors: { leon: { push: undefined, pose: "idle" } } },
      ],
    },
    { at: 2, actors: { leon: { sword: false, pose: "offer" } } },
    { at: 3, actors: { aria: { reaction: "surprise" } } },
    {
      at: 4,
      items: golemFieldItems("lifting"),
      sequence: [{ after: 700, items: golemFieldItems("road") }],
    },
    { at: 6, extras: [{ ...npc("masked-pumpety", undefined, 96, "point"), bottom: 58 }] },
    {
      at: 8,
      items: golemFieldItems("door"),
      sequence: [{ after: 2500, items: golemFieldItems("guard") }],
    },
    ...golemCare,
  ],
);
