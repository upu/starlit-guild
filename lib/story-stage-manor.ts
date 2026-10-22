import { manorDoor } from "./story-stage-manor-door.ts";
import { manorDisplay } from "./story-stage-manor-display.ts";
import { surveyDoor } from "./story-stage-survey-door.ts";
import { surveyGarden } from "./story-stage-survey-garden.ts";
import {
  scene,
  quartet,
  held,
  ground,
  table,
  onTable,
  npc,
  type LaterStage,
} from "./story-stage-later-shared.ts";
const servant = (speaking = false) =>
  npc("worker", "使用人", 72, speaking ? "explain" : "idle", speaking);
export const manorStages: Record<string, LaterStage> = {
  "riverside-manor-departure": manorDoor,
  "riverside-manor-return": manorDisplay,
  "manor-survey-departure": surveyDoor,
  "manor-survey-return": surveyGarden,
  "garden-reception-departure": scene(
    "manor-garden",
    quartet(),
    [
      { at: 0, items: [ground("handcart", 63, 28, 25), held("tools", "leon")] },
      { at: 2, actors: { aria: { x: 33 } } },
      { at: 4, actors: { aria: { x: 20, pose: "think" } } },
      { at: 6, actors: { leon: { reaction: "surprise" } }, extras: [servant()] },
      {
        at: 10,
        actors: { leon: { inspect: true } },
        items: [ground("handcart", 63, 28, 25), ground("tools", 72, 36, 12)],
      },
      { at: 12, actors: { aria: { inspect: true }, leon: { inspect: false } } },
      { at: 14, items: [held("map", "leon"), ground("handcart", 63, 28, 25)] },
      { at: 15, actors: { aria: { inspect: false, pose: "offer" } } },
    ],
    { exit: ["aria", "leon", "mira", "finn"] },
  ),
  "garden-reception-return": scene("manor-garden", quartet(), [
    { at: 0, actors: { aria: { inspect: true } }, items: [table(51), onTable("cloth", 51, 14)] },
    { at: 1, actors: { aria: { inspect: false } } },
    { at: 2, extras: [servant()] },
    { at: 7, actors: { aria: { pose: "offer" } } },
    { at: 10, actors: { leon: { pose: "offer" } } },
    {
      at: 13,
      items: [table(51), onTable("cloth", 51, 14), held("cloth", "leon", { id: "spare-cloth" })],
    },
    {
      at: 18,
      items: [table(51), onTable("cloth", 51, 14), held("cloth", "finn", { id: "spare-cloth" })],
    },
  ]),
  "keystone-night-road-departure": scene("manor-garden", quartet(), [
    { at: 0, night: true, items: [table(57), onTable("keystone", 57)], extras: [servant()] },
    { at: 2, actors: { finn: { x: 76, inspect: true } } },
    { at: 3, actors: { finn: { inspect: false } }, items: [table(57), onTable("cloth", 57, 15)] },
    { at: 7, actors: { mira: { x: 63, pose: "offer" } } },
    {
      at: 9,
      items: [table(57), onTable("cloth", 57, 15), held("cloth", "finn", { id: "bandage" })],
    },
    { at: 11, actors: { leon: { x: 48, pose: "offer" } } },
    { at: 12, actors: { aria: { x: 31, pose: "offer" } } },
  ]),
  "keystone-night-road-return": scene(
    "bridge-night",
    quartet(),
    [
      { at: 0, actors: { leon: { x: 41 } }, items: [ground("cloth", 53, 15, 14)] },
      {
        at: 6,
        actors: { mira: { x: 65, inspect: true }, finn: { pose: "offer" } },
        items: [ground("cloth", 53, 15, 14), held("cloth", "mira", { id: "bandage" })],
      },
      { at: 11, actors: { mira: { inspect: false } } },
    ],
    { night: true, initial: { leon: -8 } },
  ),
};
