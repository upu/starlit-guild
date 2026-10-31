import type { StageItem, StageActor } from "./story-stage-cues.ts";
import { actor, ground, npc, type LaterBeat } from "./story-stage-later-shared.ts";
import { chair } from "./story-stage-furniture.ts";

const guests: StageActor[] = [
  actor("aria", 15, { bottom: 12, left: false, seated: true, chair: true, tea: "hold" }),
  actor("leon", 55, { bottom: 12, left: true, seated: true, chair: true, tea: "hold" }),
  actor("mira", 55, { bottom: 35, left: true, seated: true, chair: true, tea: "hold" }),
];
function items(returned: boolean): StageItem[] {
  return [
    { ...ground("dining-table", 35, 20, 32), id: "table" },
    { ...ground("teapot", 34, 31, 4.5), support: "table" },
    { ...ground("empty-cup", 43, 29, 2.5), id: "finn-cup", support: "table" },
    {
      ...ground("paper", 0, 0, 4.5),
      id: "shipping-record",
      wrist: true,
      ...(returned ? { extra: "merchant" as const } : { actor: "finn" as const }),
    },
  ];
}

export function restorationDining(): LaterBeat {
  return {
    at: 4,
    background: "dining-room",
    night: false,
    cast: [...guests, actor("finn", 80, { bottom: 42, left: false, pose: "offer", dressed: true })],
    furniture: guests.map((seat) => chair(seat)),
    items: items(false),
    extras: [{ ...npc("merchant", "控えの持ち主", 89, "explain"), bottom: 41 }],
    sequence: [
      { after: 900, items: items(true) },
      {
        after: 1900,
        actors: { finn: { x: 75, pose: "think" } },
        extras: [{ ...npc("merchant", "控えの持ち主", 89, "explain", true), bottom: 41 }],
      },
      { after: 2200, actors: { aria: { tea: "sip" } } },
      { after: 2700, actors: { mira: { tea: "sip" } } },
      { after: 3300, actors: { leon: { tea: "sip" } } },
      { after: 3900, actors: { aria: { tea: "hold" } } },
      { after: 4400, actors: { mira: { tea: "hold" } } },
      { after: 5000, actors: { leon: { tea: "hold" } } },
    ],
  };
}
