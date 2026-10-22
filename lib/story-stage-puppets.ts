import { scene, trio, held, ground, npc, type LaterStage } from "./story-stage-later-shared.ts";
import { blockadeApproach } from "./story-stage-blockade.ts";
const pumpkin = (pose: "idle" | "explain" | "point" | "wave" = "idle", x = 60) =>
  npc("masked-pumpety", undefined, x, pose);
const dolls = () => [ground("golem", 78, 37, 21), ground("puppet", 39, 36, 9)];
export const puppetStages: Record<string, LaterStage> = {
  "spinning-signpost-departure": scene(
    "mountain-road",
    trio(),
    [
      {
        at: 0,
        actors: { aria: { x: 36, inspect: true } },
        items: [ground("signpost", 47, 27, 15), held("map", "leon")],
      },
      {
        at: 4,
        actors: { aria: { inspect: false, reaction: "surprise" } },
        items: [ground("signpost", 57, 42, 15), ground("puppet", 57, 28, 9), held("map", "leon")],
      },
      { at: 6, actors: { aria: { x: 35, pose: "surprise" } } },
      { at: 8, actors: { leon: { x: 50, pose: "offer" } } },
      {
        at: 10,
        items: [ground("signpost", 78, 42, 15), ground("puppet", 78, 28, 9), held("map", "leon")],
      },
    ],
    { exit: ["aria", "leon", "mira"] },
  ),
  "spinning-signpost-return": scene("mountain-road", trio(), [
    {
      at: 0,
      actors: { leon: { inspect: true } },
      items: [ground("signpost", 56, 26, 15), ground("bread", 28)],
    },
    { at: 1, actors: { leon: { inspect: false } } },
    {
      at: 5,
      actors: { aria: { inspect: true } },
      items: [ground("signpost", 56, 26, 15), ground("cloth", 28)],
    },
    { at: 8, actors: { aria: { inspect: false, reaction: "surprise" } } },
    {
      at: 11,
      actors: { mira: { inspect: true } },
      items: [ground("signpost", 56, 26, 15), ground("cloth", 28), ground("honey", 69, 14, 6)],
    },
    {
      at: 14,
      actors: { mira: { inspect: false }, leon: { pose: "think" }, aria: { pose: "surprise" } },
    },
  ]),
  "begging-golem-departure": scene("mountain-road", trio(), [
    {
      at: 0,
      actors: { aria: { left: false }, leon: { left: false }, mira: { left: false } },
      items: [ground("medicine", 35), ground("honey", 26, 13, 6)],
    },
    { at: 1, actors: { aria: { pose: "surprise" } } },
  ]),
  "begging-golem-return": scene("workshop", trio(), [
    {
      at: 0,
      actors: { mira: { carry: true } },
      items: [held("medicine", "mira"), ground("honey", 57, 24, 6), ...dolls()],
    },
    { at: 3, actors: { aria: { reaction: "surprise" } } },
    { at: 4, items: [held("medicine", "mira"), ground("honey", 80, 35, 6), ...dolls()] },
    { at: 6, extras: [pumpkin("point")] },
    { at: 8, items: [held("medicine", "mira")], extras: [] },
    { at: 10, actors: { mira: { carry: false, x: 65 }, leon: { x: 50, pose: "offer" } } },
    {
      at: 13,
      actors: { leon: { pose: "offer" }, mira: { inspect: true } },
      items: [ground("medicine", 61)],
    },
    {
      at: 17,
      actors: {
        leon: { inspect: true },
        aria: { left: false },
        mira: { inspect: false, pose: "offer" },
      },
    },
  ]),
  "sweet-blockade-departure": blockadeApproach,
  "sweet-blockade-return": scene(
    "workshop",
    trio(),
    [
      {
        at: 0,
        items: [held("honey", "aria", { width: 6 }), ground("medicine", 53), ...dolls()],
        extras: [pumpkin()],
      },
      { at: 1, extras: [pumpkin("point")] },
      { at: 5, extras: [pumpkin("idle")] },
      { at: 9, extras: [pumpkin("wave")] },
      { at: 10, items: [held("honey", "mira", { width: 6 }), ground("medicine", 53), ...dolls()] },
      { at: 12, extras: [pumpkin(), npc("worker", "運び手", 25, "explain")] },
      {
        at: 17,
        background: "mountain-road",
        items: [ground("signpost", 55, 31, 14), held("honey", "mira", { width: 6 })],
        actors: { leon: { inspect: true } },
      },
      {
        at: 20,
        actors: { leon: { inspect: false } },
        extras: [pumpkin(), npc("worker", "運び手", 25, "wave", true)],
      },
      { at: 22, extras: [pumpkin("point", 111)], items: [ground("medicine", 54)] },
      { at: 24, actors: { aria: { x: 51, pose: "think" }, leon: { x: 30 }, mira: { x: 71 } } },
      { at: 27, actors: { mira: { seated: true } } },
      {
        at: 30,
        actors: { aria: { inspect: true } },
        items: [ground("medicine", 54), held("cloth", "aria")],
      },
      { at: 31, actors: { aria: { inspect: false }, mira: { seated: false } } },
    ],
    { exit: ["aria", "leon", "mira"] },
  ),
};
