import {
  keeper,
  moss as dishMoss,
  lamp,
  item,
  type ChapterStage,
} from "./story-stage-chapter-shared.ts";

const moss: typeof dishMoss = (actor, glow) => ({
  ...dishMoss(actor, glow),
  art: "moss-jar",
  width: 5,
  bottom: 23,
});

export const towerStages: Record<string, ChapterStage> = {
  "tower-road-departure": {
    background: "hill-path",
    exit: "together",
    beats: [
      { at: 0, aria: { left: false }, leon: { left: false } },
      { at: 1, aria: { pose: "offer" }, leon: { left: true } },
      { at: 3, aria: { reaction: "surprise" } },
      {
        at: 4,
        aria: { reaction: undefined },
        items: [item("lantern", "lantern", 63, 14, { width: 6 })],
      },
      {
        at: 5,
        leon: { inspect: true },
        aria: { x: 39, pose: "offer" },
        items: [item("cloth", "cloth", 50, 18, { width: 10 })],
      },
      {
        at: 8,
        leon: { inspect: false, pose: "offer" },
        items: [item("cloth", "cloth", 6, 25, { actor: "aria", width: 9 })],
      },
      { at: 9, aria: { x: 35, left: false }, items: [] },
      { at: 11, leon: { pose: "tease" } },
      { at: 14, aria: { pose: "tease" } },
      { at: 15, aria: { x: 40, left: false }, leon: { x: 60, left: false } },
    ],
  },
  "tower-road-return": {
    background: "tower-base-moss",
    beats: [
      {
        at: 0,
        aria: { wave: true, bottom: 20 },
        leon: { wave: true },
        extras: [keeper()],
      },
      { at: 1, aria: { wave: false }, leon: { wave: false } },
      { at: 2, extras: [keeper("explain", true)] },
      { at: 4, extras: [keeper("point", true)] },
      { at: 5, aria: { x: 35 }, leon: { x: 59 } },
      { at: 7, extras: [keeper("explain", true)] },
      {
        at: 8,
        aria: { x: 42, bottom: 36, inspect: true },
      },
      { at: 9, aria: { inspect: false, reaction: "surprise" } },
      { at: 11, aria: { reaction: undefined, left: false, pose: "think" } },
      { at: 13, extras: [keeper("explain", true)] },
      { at: 14, aria: { pose: "offer" } },
      { at: 17, extras: [keeper("point", true)] },
      { at: 18, aria: { inspect: true } },
      {
        at: 19,
        leon: { carry: true },
        items: [{ ...dishMoss("leon", "dim"), x: -4, width: 6 }],
      },
    ],
  },
  "moss-night-road-departure": {
    background: "hill-night",
    night: true,
    exit: "together",
    beats: [
      { at: 0, aria: { carry: true }, leon: { bottom: 24 }, items: [moss("aria", "bright")] },
      { at: 2, aria: { x: 36 }, leon: { x: 60 } },
      { at: 3, items: [moss("aria", "bright"), lamp("leon")] },
      { at: 7, aria: { left: false }, leon: { left: false, pose: "think" } },
      { at: 10, aria: { left: true }, leon: { left: true } },
      { at: 11, aria: { left: false } },
      { at: 14, aria: { pose: "think" } },
      { at: 15, leon: { x: 55, pose: "offer" }, aria: { shawl: true } },
      { at: 20, aria: { x: 39 }, items: [moss("aria", "bright"), lamp("leon")] },
      { at: 22, aria: { left: false }, leon: { left: false } },
    ],
  },
  "moss-night-road-return": {
    background: "meeting-night",
    night: true,
    exit: "apart",
    beats: [
      {
        at: 0,
        aria: { shawl: true, x: 38 },
        leon: { carry: true, x: 57 },
        items: [moss("leon", "dim"), lamp("leon")],
      },
      {
        at: 3,
        aria: { x: 40, pose: "offer" },
      },
      { at: 7, leon: { x: 59, pose: "offer" } },
      { at: 12, aria: { left: true } },
      { at: 13, aria: { left: false } },
      {
        at: 18,
        aria: { x: 39, carry: true },
        leon: { x: 57, carry: false },
        items: [moss("aria", "dim"), lamp("leon")],
      },
      { at: 21, items: [moss("aria", "dim"), lamp("leon"), lamp("aria")] },
      { at: 23, aria: { pose: "tease" } },
      { at: 25, aria: { x: 34, bottom: 22, left: true }, leon: { x: 61, bottom: 22, left: false } },
    ],
  },
};
