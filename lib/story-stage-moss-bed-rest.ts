import { ground, type LaterBeat } from "./story-stage-later-shared.ts";
import { bedBag, bedBread, bedItems, bedLabel, bedNotebook } from "./story-stage-moss-bed-items.ts";

const studyPath = [
  { x: 75, bottom: 45 },
  { x: 75, bottom: 56 },
];
export const mossBedRest: LaterBeat[] = [
  { at: 32, actors: { lico: { mossStudy: "page" } } },
  {
    at: 37,
    actors: { lico: { mossStudy: "page" } },
    sequence: [
      { after: 600, actors: { lico: { mossStudy: "read" } } },
      { after: 1200, actors: { lico: { mossStudy: "page" } } },
    ],
  },
  {
    at: 40,
    actors: { lico: { mossStudy: "reach", left: false } },
    sequence: [{ after: 900, actors: { lico: { mossStudy: "page" } } }],
  },
  {
    at: 42,
    finishBeforeAdvance: true,
    actors: { lico: { x: 60, bottom: 56, via: studyPath, mossStudy: "taste", left: false } },
    sequence: [
      {
        after: 2400,
        actors: {
          lico: {
            x: 61,
            bottom: 63,
            via: undefined,
            mossStudy: undefined,
            inspect: true,
            left: true,
          },
        },
      },
    ],
  },
  { at: 43, actors: { lico: { inspect: true, left: true } } },
  {
    at: 44,
    actors: {
      mira: {
        x: 55,
        bottom: 49,
        via: [
          { x: 74, bottom: 35 },
          { x: 75, bottom: 50 },
        ],
        mossCare: "support",
        left: false,
      },
    },
  },
  {
    at: 45,
    finishBeforeAdvance: true,
    actors: { lico: { x: 61, bottom: 51, inspect: false, mossStudy: "brace", left: false } },
    items: bedItems(),
    sequence: [
      { after: 1500, actors: { mira: { mossCare: "steady" } } },
      { after: 2200, actors: { lico: { mossStudy: "glasses" } } },
      {
        after: 3000,
        actors: {
          lico: {
            x: 70,
            bottom: 12,
            via: [
              { x: 75, bottom: 50 },
              { x: 75, bottom: 35 },
            ],
            mossStudy: undefined,
            seated: true,
            stool: true,
            left: true,
          },
          mira: {
            x: 92,
            bottom: 12,
            via: [
              { x: 75, bottom: 50 },
              { x: 75, bottom: 28 },
            ],
            mossCare: "hold",
            left: true,
          },
        },
      },
      { after: 6000, items: [bedLabel(), bedBread(), { ...bedNotebook(), wrist: true }, bedBag()] },
    ],
  },
  {
    at: 49,
    actors: { mira: { mossCare: undefined, seated: true, perch: true, via: undefined } },
    items: [
      bedLabel(),
      bedBread(),
      { ...bedNotebook(), wrist: true },
      { ...bedBag(), wrist: true, wristAnchor: "top" },
    ],
  },
  {
    at: 50,
    finishBeforeAdvance: true,
    actors: {
      aria: {
        x: 63.25,
        bottom: 6.375,
        via: [
          { x: 28, bottom: -10 },
          { x: 63.25, bottom: -10 },
        ],
        inspect: false,
        pose: "offer",
        left: false,
      },
      lico: { left: true, pose: "greet" },
    },
    sequence: [
      {
        after: 3000,
        items: [
          bedLabel(),
          bedBread(),
          { ...bedNotebook("aria"), wrist: true },
          { ...bedBag(), wrist: true, wristAnchor: "top" },
        ],
      },
      {
        after: 3600,
        actors: {
          aria: {
            x: 86.1875,
            bottom: 4.6875,
            via: [
              { x: 63.25, bottom: -10 },
              { x: 86.1875, bottom: -10 },
            ],
            pose: "offer",
            left: false,
          },
          mira: { left: true },
        },
        items: [
          bedLabel(),
          bedBread(),
          bedNotebook("aria", -4),
          { ...bedBag(), wrist: true, wristAnchor: "top" },
        ],
      },
      { after: 5200, items: [bedLabel(), bedBread(), bedNotebook("aria", -4), bedBag("aria")] },
      {
        after: 6000,
        actors: {
          aria: {
            x: 60,
            bottom: 0,
            via: [
              { x: 86.1875, bottom: -10 },
              { x: 60, bottom: -10 },
            ],
            left: false,
          },
        },
      },
      {
        after: 7800,
        actors: { aria: { inspect: true } },
        items: [
          bedLabel(),
          bedBread(),
          { ...ground("closed-ledger", 55, 2, 5), id: "ledger" },
          { ...ground("doctor-satchel", 64, 2, 6.4), id: "medicine" },
        ],
      },
      {
        after: 9000,
        actors: {
          aria: {
            x: 25,
            bottom: 14,
            inspect: false,
            via: [
              { x: 60, bottom: -10 },
              { x: 25, bottom: -10 },
            ],
            left: false,
          },
        },
      },
    ],
  },
];
