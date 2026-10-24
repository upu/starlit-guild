import { actor, scene } from "./story-stage-later-shared.ts";
import { bedBag, bedItems, bedLabel, bedRails, bedSeats } from "./story-stage-moss-bed-items.ts";
import { mossBedRest } from "./story-stage-moss-bed-rest.ts";

const visitors = () => [
  actor("aria", 28, { bottom: 38, left: true }),
  actor("leon", 20, { bottom: 4, left: false }),
  actor("mira", 58, { bottom: 16, left: true, mossCare: "hold" }),
];
export const mossBedsDeparture = scene(
  "moss-beds",
  visitors(),
  [
    { at: 0, items: [bedLabel(true), bedBag()] },
    { at: 1, actors: { aria: { inspect: true } } },
    { at: 2, actors: { leon: { pose: "offer" } } },
    { at: 3, actors: { mira: { pose: "think" } } },
    { at: 4, actors: { aria: { inspect: false, left: false } } },
  ],
  { cell: 24, furniture: [...bedRails(), ...bedSeats()] },
);

export const mossBedsReturn = scene(
  "moss-beds",
  [
    ...visitors(),
    actor("lico", 85, { bottom: 70, visible: false, left: true, name: "小柄な女性" }),
  ],
  [
    { at: 0, items: bedItems(true) },
    {
      at: 2,
      actors: {
        lico: { visible: true, bottom: 51, mossStudy: "glasses" },
        aria: { reaction: "surprise", left: false },
      },
    },
    { at: 5, actors: { leon: { x: 44 } }, items: bedItems() },
    {
      at: 7,
      actors: { lico: { mossStudy: "write" } },
      sequence: [{ after: 1500, actors: { lico: { mossStudy: "read" } } }],
    },
    { at: 9, actors: { lico: { name: "リコ" } } },
    {
      at: 15,
      actors: {
        lico: {
          x: 37,
          bottom: 38,
          via: [
            { x: 75, bottom: 51 },
            { x: 75, bottom: 35 },
          ],
          left: true,
          mossStudy: "show",
        },
        aria: { pose: "surprise", left: false },
      },
    },
    { at: 17, actors: { aria: { reaction: "surprise" } } },
    { at: 18, actors: { lico: { mossStudy: "read" } } },
    {
      at: 22,
      actors: {
        lico: {
          x: 74,
          bottom: 33,
          via: [
            { x: 45, bottom: 38 },
            { x: 74, bottom: 38 },
          ],
          mossStudy: "read",
          left: true,
        },
        mira: { x: 62, bottom: 25, mossCare: "hold", left: false },
      },
    },
    {
      at: 25,
      actors: { mira: { mossCare: "hold" } },
      sequence: [{ after: 900, actors: { mira: { mossCare: "slip" } } }],
    },
    { at: 27, actors: { mira: { mossCare: "hold" } } },
    ...mossBedRest,
  ],
  {
    cell: 24,
    furniture: [...bedRails(), ...bedSeats()],
    exit: ["leon"],
    exitRoutes: { leon: { x: 30, bottom: -75, via: [{ x: 30, bottom: 0 }] } },
  },
);
