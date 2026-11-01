import { scene, quintet, ground, npc } from "./story-stage-later-shared.ts";
import { loadingBaskets } from "./story-stage-seedling-items.ts";
import {
  transplantBasket,
  restingBasket,
  transplantCart as cart,
  cartMoss,
  basketCloth,
  wheelBoard,
  transplantHoe,
  transplantRope,
} from "./story-stage-transplant-items.ts";
import { bedBag } from "./story-stage-moss-bed-items.ts";
import { spareBoards, withTransplantBoards } from "./story-stage-transplant-boards.ts";
import { transplantGuard } from "./story-stage-transplant-guard.ts";

const loadingItems = (hoes: "back" | "ground" = "back") => [
  ...loadingBaskets(),
  { ...ground("plant-label", 69, 37, 2.8), id: "loading-label", support: "open-seedlings" },
  { ...transplantRope("ground"), x: 75, bottom: -12 },
  transplantHoe(0, hoes),
  transplantHoe(1, hoes),
];
const loadingCast = () =>
  quintet().map((a, i) => ({
    ...a,
    x: [27, 45, 19, 41, 63][i],
    bottom: [21, 4, -3, -15, 18][i],
    left: false,
  }));

const tools = () => transplantRope("ground");
const carried = () => [...transplantBasket("lico", true), tools(), cart(), ...cartMoss()];
const placed = () => [...restingBasket(), tools(), cart(), ...cartMoss()];

export const transplantDeparture = scene(
  "moss-beds",
  loadingCast(),
  withTransplantBoards(
    transplantGuard([
      {
        at: 0,
        actors: { lico: { mossStudy: "write" } },
        items: loadingItems(),
        extras: [npc("keeper", undefined, 84)],
      },
      { at: 5, extras: [npc("keeper", undefined, 84, "explain", true)] },
      { at: 9, actors: { leon: { pose: "think" } } },
      {
        at: 12,
        finishBeforeAdvance: true,
        actors: { leon: { carry: true, pose: "idle" } },
        items: loadingItems().map((p) => (p.id === "loading-hoe-0" ? transplantHoe(0, "hand") : p)),
        sequence: [
          {
            after: 1000,
            actors: { leon: { carry: false, inspect: true } },
            items: loadingItems().map((p) =>
              p.id === "loading-hoe-0" ? transplantHoe(0, "ground") : p,
            ),
          },
          {
            after: 2600,
            actors: { leon: { carry: true, inspect: false } },
            items: [
              ...loadingItems("ground").filter((p) => p.id !== "loading-hoe-1"),
              transplantHoe(1, "hand"),
            ],
          },
          {
            after: 3400,
            actors: { leon: { carry: false, inspect: true } },
            items: loadingItems("ground"),
          },
          { after: 5000, actors: { leon: { inspect: false, pose: "idle" } } },
        ],
      },
      {
        at: 13,
        actors: { mira: { x: 19, bottom: -65, via: [{ x: 19, bottom: -20 }], mossCare: "hold" } },
        items: [...loadingItems("ground"), bedBag()],
      },
      {
        at: 16,
        finishBeforeAdvance: true,
        background: "transplant-path",
        cut: true,
        night: true,
        actors: {
          aria: { x: 39, bottom: 14 },
          finn: { x: 67, bottom: 40, pull: true, left: false },
          mira: { x: 19, bottom: 14, via: undefined, mossCare: undefined },
          lico: { carry: true, left: false, x: 83, bottom: 14, mossStudy: undefined },
          leon: { carry: false, left: false, x: 51, bottom: 14 },
        },
        items: [
          ...transplantBasket("lico", true),
          transplantRope("cart"),
          { ...cart(false, -16), bottom: 14, actor: "finn" },
          ...cartMoss(),
        ],
        extras: [],
        sequence: [
          {
            after: 2200,
            actors: {
              aria: { x: 43 },
              leon: { x: 55 },
              mira: { x: 23 },
              finn: { x: 71 },
              lico: { x: 84 },
            },
            items: [
              ...transplantBasket("lico", true),
              transplantRope("cart"),
              { ...cart(false, -16), bottom: 14, actor: "finn" },
              ...cartMoss(),
            ],
          },
        ],
      },
      {
        at: 20,
        finishBeforeAdvance: true,
        actors: {
          aria: { x: 23 },
          leon: { x: 39 },
          lico: { x: 78, left: true },
          mira: {
            x: 72,
            bottom: 0,
            via: [
              { x: 23, bottom: 0 },
              { x: 72, bottom: 0 },
            ],
          },
          finn: { bottom: 36, nameOffset: -30 },
        },
        items: [...transplantBasket("lico", true), transplantRope("cart"), cart(), ...cartMoss()],
      },
      {
        at: 25,
        finishBeforeAdvance: true,
        actors: {
          leon: {
            carry: false,
            x: 41.75,
            bottom: 36.1177884615,
            left: false,
            via: [
              { x: 34, bottom: 14 },
              { x: 34, bottom: 36.1177884615 },
            ],
          },
        },
        items: [...transplantBasket("lico", true), cart(), ...cartMoss(), transplantRope("cart")],
        sequence: [
          {
            after: 3200,
            actors: { leon: { carry: true, via: undefined } },
            items: [
              ...transplantBasket("lico", true),
              cart(),
              ...cartMoss(),
              transplantRope("hand"),
            ],
          },
          {
            after: 4000,
            actors: {
              leon: {
                x: 34,
                bottom: 14,
                reachOver: undefined,
                via: [{ x: 34, bottom: 36.1177884615 }],
                left: true,
              },
            },
          },
          {
            after: 6200,
            actors: { leon: { carry: false, inspect: true, via: undefined, left: false } },
            items: carried(),
          },
          {
            after: 7000,
            actors: { leon: { inspect: false, sword: true, x: 34, bottom: 34, left: true } },
          },
        ],
      },
      {
        at: 29,
        actors: {
          aria: { x: 64, lane: 0, pose: "offer" },
          mira: { x: 88, bottom: 0, via: undefined },
        },
      },
      {
        at: 31,
        finishBeforeAdvance: true,
        actors: {
          aria: { carry: true, x: 70.875, bottom: 12.875, left: false },
          lico: { carry: false, mossStudy: "reach" },
          mira: { inspect: false },
        },
        items: carried(),
        sequence: [
          {
            after: 1600,
            actors: { lico: { carry: false, mossStudy: "reach" } },
            items: [...transplantBasket("aria", true), tools(), cart(), ...cartMoss()],
          },
          {
            after: 2400,
            actors: {
              aria: { x: 29.625, bottom: 14.15625, lane: 0, left: true },
              mira: { x: 66.9375, bottom: 15.125, left: false, via: [{ x: 60, bottom: -5 }] },
            },
          },
          { after: 4300, actors: { mira: { healing: "treat", via: undefined } } },
          {
            after: 5200,
            actors: { aria: { carry: false, inspect: true, lane: undefined } },
            items: [...transplantBasket("aria"), basketCloth(true), tools(), cart(), ...cartMoss()],
          },
          {
            after: 6000,
            items: [...transplantBasket("aria"), basketCloth(), tools(), cart(), ...cartMoss()],
          },
          {
            after: 6700,
            items: placed(),
          },
          {
            after: 7400,
            actors: { aria: { x: 42, bottom: 14, lane: 0, inspect: false, pose: "think" } },
          },
        ],
      },
      {
        at: 33,
        finishBeforeAdvance: true,
        actors: { finn: { x: 62.5, bottom: 36, left: true, pull: false, carry: false } },
        sequence: [
          {
            after: 1600,
            actors: { finn: { carry: true } },
            items: [...placed(), ...spareBoards("hand")],
          },
          { after: 2400, actors: { finn: { x: 82, bottom: 68, left: false } } },
          {
            after: 4200,
            actors: { finn: { carry: false, inspect: true } },
            items: [...placed(), ...spareBoards("ground")],
          },
          {
            after: 5000,
            actors: { finn: { inspect: false, x: 71, bottom: 36, left: true, pull: false } },
          },
          { after: 6400, actors: { finn: { left: false, pull: true } } },
        ],
      },
      {
        at: 35,
        finishBeforeAdvance: true,
        actors: {
          lico: { x: 30, lane: 0, carry: false, mossStudy: undefined },
          mira: {
            x: 16.75,
            bottom: 7.5,
            left: false,
            via: [
              { x: 60, bottom: -15 },
              { x: 16.75, bottom: -15 },
            ],
            inspect: true,
            healing: undefined,
            pose: "offer",
          },
        },
        sequence: [
          {
            after: 3600,
            actors: { lico: { carry: true, left: true, lane: undefined } },
            items: [...transplantBasket("lico"), basketCloth(), tools(), cart(), ...cartMoss()],
          },
        ],
      },
      { at: 36, actors: { mira: { healing: undefined } } },
      {
        at: 37,
        finishBeforeAdvance: true,
        actors: {
          aria: {
            x: 47.125,
            bottom: 36.65625,
            inspect: true,
            left: false,
            lane: undefined,
            reachOver: "transplant-cart",
          },
          mira: { x: 64, bottom: 25, inspect: false, via: [{ x: 48, bottom: -10 }], pose: "offer" },
          finn: { x: 71, bottom: 36, pose: "offer" },
        },
        sequence: [
          {
            after: 900,
            items: [
              ...transplantBasket("lico"),
              basketCloth(),
              tools(),
              cart(),
              ...cartMoss(),
              wheelBoard(true),
            ],
          },
          {
            after: 1800,
            items: [
              ...transplantBasket("lico"),
              basketCloth(),
              tools(),
              cart(),
              ...cartMoss(),
              wheelBoard(),
            ],
          },
          {
            after: 2600,
            items: [
              ...transplantBasket("lico"),
              basketCloth(),
              tools(),
              { ...cart(false), support: "wheel-board" },
              ...cartMoss(),
              wheelBoard(),
            ],
          },
          {
            after: 3800,
            actors: {
              aria: { x: 65, bottom: -5, lane: 3, inspect: false, reachOver: undefined },
              lico: { x: 80, bottom: -12, left: false, lane: 0 },
              mira: { x: 70, bottom: 12, lane: 16, via: undefined },
              finn: { x: 80, bottom: 40, pull: true, left: false },
            },
            items: [
              ...transplantBasket("lico"),
              tools(),
              { ...cart(false, -16), bottom: 14, actor: "finn" },
              ...cartMoss(),
              basketCloth(),
              wheelBoard(),
            ],
          },
        ],
      },
    ]),
  ),
  { cell: 24, exit: ["aria", "lico", "mira", "finn"] },
);
