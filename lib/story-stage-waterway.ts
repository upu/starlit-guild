import {
  keeper,
  worker,
  moss,
  lamp,
  basket,
  notes,
  stone,
  tools,
  item,
  type ChapterStage,
} from "./story-stage-chapter-shared.ts";
import { lowSeat } from "./story-stage-low-seats.ts";

const towerSeats = () => [
  lowSeat({ id: "aria", x: 40, left: false }, "stone", 24),
  lowSeat({ id: "leon", x: 47, left: false }, "stone", 24),
];

const samples = (bright = false) => [
  item("near", "moss", 66, 17, { width: 9, glow: bright ? "bright" : undefined }),
  item("far", "moss", 24, 14, { width: 9 }),
  item("forest", "moss", 37, 14, { width: 9 }),
];
const spatula = () => item("spatula", "spatula", 5, 21, { actor: "aria", width: 5 });
export const waterwayStages: Record<string, ChapterStage> = {
  "old-waterway-departure": {
    background: "tower-foot",
    exit: "together",
    beats: [
      {
        at: 0,
        aria: { carry: true },
        leon: { pose: "offer" },
        extras: [keeper()],
        items: [moss("aria"), notes()],
      },
      { at: 3, extras: [keeper("point", true)] },
      { at: 4, aria: { inspect: true, carry: false }, leon: { inspect: true }, items: samples() },
      { at: 7, items: samples(true) },
      { at: 8, aria: { inspect: false, reaction: "surprise" } },
      { at: 9, aria: { reaction: undefined }, extras: [keeper("point", true)] },
      { at: 10, leon: { inspect: false, pose: "think" } },
      { at: 12, extras: [keeper("explain", true)] },
      { at: 13, aria: { x: 44, inspect: true } },
      {
        at: 16,
        aria: { x: 35, inspect: false },
        leon: { x: 55, inspect: true },
        items: [stone(), notes(true), ...samples(true)],
      },
      { at: 18, extras: [keeper("point", true)] },
      { at: 21, extras: [keeper("explain", true)] },
      { at: 22, aria: { inspect: true }, leon: { inspect: true } },
      {
        at: 25,
        aria: { inspect: false, x: 40, left: false },
        leon: { inspect: false, x: 59, left: false },
        items: [item("notes", "map", -5, 24, { actor: "leon", width: 11 })],
      },
    ],
  },
  "old-waterway-return": {
    background: "drain-blocked",
    exit: "together",
    beats: [
      { at: 0, aria: { pose: "think" }, leon: { pose: "think", left: false } },
      { at: 3, extras: [keeper()] },
      { at: 4, extras: [keeper("point", true)] },
      { at: 7, aria: { x: 45, inspect: true }, leon: { x: 60 }, items: [lamp("leon")] },
      { at: 8, aria: { inspect: false, reaction: "surprise" } },
      { at: 9, aria: { inspect: true, reaction: undefined } },
      { at: 12, extras: [keeper("explain", true)] },
      { at: 14, aria: { inspect: false, pose: "offer" } },
      { at: 15, extras: [keeper("explain", true)] },
      {
        at: 18,
        aria: { x: 37, inspect: true },
        leon: { x: 57, inspect: true },
        items: [notes(), lamp("leon")],
      },
    ],
  },
  "tower-restoration-departure": {
    background: "tower-foot",
    exit: "together",
    beats: [
      {
        at: 0,
        extras: [keeper("idle"), worker(), { id: "merchant", x: 50, bottom: 42 }],
        items: [tools(), basket()],
      },
      {
        at: 1,
        extras: [
          keeper(),
          worker(),
          { id: "merchant", x: 50, bottom: 42, pose: "explain", speaking: true },
        ],
      },
      { at: 3, extras: [keeper(), worker("point", true)] },
      { at: 5, extras: [keeper(), worker("explain", true)] },
      {
        at: 6,
        extras: [keeper("explain", true), worker()],
        leon: { carry: true },
        items: [tools(), basket("leon")],
      },
      { at: 9, aria: { x: 39, pose: "think" }, leon: { carry: false }, items: [tools(), basket()] },
      { at: 10, aria: { pose: "offer" } },
      { at: 11, leon: { pose: "think" } },
      { at: 14, aria: { x: 43 }, leon: { carry: true }, items: [tools(), basket("leon")] },
      {
        at: 15,
        aria: { left: false },
        leon: { left: false },
        extras: [keeper("wave"), worker("wave")],
      },
    ],
  },
  "tower-restoration-return": {
    background: "drain-cleared",
    exit: "together",
    beats: [
      {
        at: 0,
        aria: { inspect: true },
        extras: [keeper(), worker("wave")],
        items: [tools(), basket()],
      },
      { at: 1, extras: [keeper(), worker("explain", true)] },
      { at: 4, aria: { inspect: false, left: false }, leon: { left: false } },
      { at: 6, extras: [keeper("point", true), worker()] },
      {
        at: 7,
        aria: { inspect: true, x: 42 },
        items: [tools(), basket(), item("remaining", "colony", 55, 14, { width: 12, glow: "dim" })],
      },
      { at: 10, aria: { inspect: false }, extras: [keeper("point"), worker()] },
      { at: 11, aria: { pose: "tease" }, leon: { left: true } },
      {
        at: 13,
        aria: { x: 44, pose: "offer" },
        leon: { pose: "offer" },
        items: [basket(), item("cloth", "cloth", 4, 20, { actor: "aria", width: 9 })],
        sequence: [
          {
            after: 900,
            items: [basket(), item("cloth", "cloth", -4, 24, { actor: "leon", width: 9 })],
          },
          {
            after: 2300,
            items: [basket(), item("cloth", "cloth", 4, 20, { actor: "aria", width: 9 })],
          },
        ],
      },
      {
        at: 16,
        leon: { carry: true },
        aria: { left: false },
        items: [basket("leon"), tools()],
        extras: [keeper("wave"), worker("wave")],
      },
    ],
  },
  "tower-moss-removal-departure": {
    background: "drain-cleared",
    exit: "together",
    beats: [
      {
        at: 0,
        items: [
          tools(),
          item("basket", "basket", 58, 14, { width: 10 }),
          item("remaining", "colony", 49, 13, { width: 9, glow: "bright" }),
        ],
        extras: [keeper(), worker()],
      },
      { at: 1, extras: [keeper("point"), worker()] },
      { at: 3, extras: [keeper("explain", true), worker()] },
      { at: 5, extras: [keeper(), worker("point", true)] },
      {
        at: 7,
        aria: { x: 42, inspect: true },
        leon: { x: 64, inspect: true },
        items: [
          tools(),
          item("basket", "basket", 58, 14, { width: 10 }),
          item("remaining", "colony", 49, 13, { width: 9, glow: "bright" }),
          spatula(),
        ],
      },
      {
        at: 10,
        items: [
          tools(),
          item("basket", "basket", 58, 14, { width: 10 }),
          item("remaining", "colony", 49, 13, { width: 7, glow: "dim" }),
          item("collected", "colony", 58, 17, { width: 6, support: "basket" }),
          spatula(),
        ],
      },
      { at: 13, aria: { inspect: false, left: false }, leon: { inspect: false } },
      {
        at: 16,
        aria: { pose: "offer" },
        leon: { carry: true },
        items: [tools(), { ...basket("leon"), width: 10 }],
      },
      {
        at: 17,
        aria: { inspect: true },
        leon: { inspect: true, carry: false },
        items: [
          tools(),
          item("basket", "basket", 58, 14, { width: 10 }),
          item("collected", "colony", 58, 17, { width: 6, support: "basket" }),
          spatula(),
        ],
      },
    ],
  },
  "tower-moss-removal-return": {
    background: "tower-foot",
    beats: [
      { at: 0, items: [tools(), ...towerSeats()], extras: [keeper("point"), worker()] },
      { at: 1, extras: [keeper("explain", true), worker()] },
      {
        at: 2,
        aria: { x: 40, seated: true, perch: true },
        leon: { x: 47, seated: true, perch: true, left: false },
        extras: [worker()],
        items: [tools(), ...towerSeats()],
      },
      { at: 5, extras: [keeper("point"), worker()] },
      { at: 25, aria: { seated: false }, leon: { seated: false } },
    ],
  },
};
