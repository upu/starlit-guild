import type { StoryStageCue } from "../story-stage.ts";
import { storyArtAt } from "../story-art.ts";
import type { Story } from "../stories.ts";
import { studyCue } from "./carry-cue.ts";
import { storybookPresentation } from "./presentation.ts";
import { storybookPropImages } from "./shared-prop-art.ts";
import { sharedPoseImages } from "./shared-pose-images.ts";

export function stageBackground(storyId: string, page: number, cue?: StoryStageCue | false | null) {
  if (!cue) return undefined;
  const presentation = storybookPresentation(storyId, cue.background, page);
  return presentation ? `/storybook-study/${presentation.art}.png` : undefined;
}

/** Preload the next different painted setting, without loading an entire chapter. */
export function nextStageBackground(story: Story, page: number, current?: string) {
  for (let next = page + 1; next < story.lines.length; next++) {
    if (storyArtAt(story.id, next)) continue;
    const src = stageBackground(story.id, next, studyCue(story.id, next, true));
    if (src && src !== current) return src;
  }
}

/** The illustration is revealed by the story at its authored line, never earlier. */
export function nextStoryArtwork(story: Story, page: number) {
  const current = storyArtAt(story.id, page)?.src;
  for (let next = page + 1; next < story.lines.length; next++) {
    const src = storyArtAt(story.id, next)?.src;
    if (src && src !== current) return src;
  }
}

// These are the shared standing and walking strips used by the painted stage.
// Scene-specific gestures and props are still selected by their own CSS rules.
const castImages: Record<string, string[]> = {
  aria: ["aria-conversation-v1", "aria-walk-v1"],
  leon: ["leon-conversation-v1", "leon-walk-v1"],
  mira: ["mira-conversation-v1", "mira-walk-v1"],
  finn: ["finn-conversation-balanced-v3", "finn-walk-balanced-v3"],
  lico: ["lico-conversation-ponytail-v1", "lico-walk-ponytail-v1"],
};

// These scenes cut from the settlement into the patient room mid-conversation.
// Prepare the people and the objects in that shot before the stage is shown.
const householdImages = [
  "household-parent-v1",
  "household-child-bed-v1",
  "household-cook-v1",
  "medicine-table-v1",
  "medicine-v1",
  "medicine-closed-v1",
  "honey-v1",
  "honey-bag-v1",
  "empty-delivery-wrap-v1",
  "household-water-bucket-v1",
  "homeward-receipts-v1",
  "mira-bag-place-v1",
  "chair-v1",
];

// The night move and return road switch to these dedicated carry strips mid-line.
// Prepare them with the common cast so the first step does not await CSS image loading.
const storyMotionImages: Record<string, string[]> = {
  "old-waterway-departure": [
    "aria-poses-v1",
    "aria-paper-v1",
    "leon-paper-v1",
    "aria-carry-v1",
    "leon-carry-v1",
    "aria-paper-walk-v1",
    "leon-paper-walk-v2",
  ],
  "spinning-signpost-return": ["puppet-poses-v1"],
  "hilltop-picnic-return": ["aria-lunch-v1", "leon-lunch-v1"],
  "tower-moss-removal-return": [
    "keeper-tower-signal-v1",
    "keeper-lantern-registered-v2",
    "keeper-hatch-open-v1",
    "keeper-hatch-carry-walk-v2",
    "keeper-yard-walk-v1",
    "worker-repair-basket-v2",
    "inspection-stone-lid-v1",
    "night-lantern-v1",
    "basket-v1",
    "moss-colony-v1",
    "tools-v1",
    "aria-carry-v1",
    "aria-paper-walk-v1",
    "aria-poses-v1",
    "aria-rest-perch-v2",
    "leon-rest-perch-v2",
    "seat-rock-v1",
  ],
  "tower-moss-removal-departure": [
    "keeper-hatch-open-v1",
    "keeper-hatch-carry-walk-v2",
    "keeper-yard-walk-v1",
    "inspection-stone-lid-v1",
    "keeper-poses-v1",
    "worker-poses-v1",
    "basket-v1",
    "tools-v1",
  ],
  "tower-restoration-departure": [
    "waterway-empty-tool-cart-v1",
    "merchant-repair-unload-v1",
    "merchant-carry-walk-v1",
    "merchant-walk-v2",
    "repair-rope-coil-v1",
    "keeper-basket-handoff-v1",
    "keeper-yard-walk-v1",
    "leon-basket-place-v1",
    "leon-route-notes-v1",
    "leon-map-stow-v1",
    "leon-forage-v1",
    "leon-carry-v1",
    "leon-paper-walk-v2",
    "basket-v1",
    "tools-v1",
    "keeper-poses-v1",
    "worker-poses-v1",
  ],
  "tower-restoration-return": [
    "keeper-hatch-mark-v2",
    "keeper-yard-walk-v1",
    "leon-basket-place-v1",
    "aria-poses-v1",
    "leon-carry-v1",
    "aria-carry-v1",
    "basket-v1",
    "tools-v1",
    "folded-shawl-v1",
    "keeper-poses-v1",
    "worker-poses-v1",
  ],
  "old-waterway-return": [
    "night-lantern-v1",
    "leon-route-notes-v1",
    "leon-map-stow-v1",
    "leon-kneel-notes-v1",
    "leon-sit-down-v1",
    "leon-forage-v1",
    "waterway-marker-v1",
    "keeper-yard-walk-v1",
  ],
  "waiting-households-departure": householdImages,
  "waiting-households-return": householdImages,
  "medicine-road-home-departure": [
    "mira-handheld-v1",
    "mira-bag-place-v1",
    "homeward-worker-v1",
    "homeward-medicine-v1",
    "homeward-bottles-v1",
    "handcart-raised-v1",
    "trade-parcels-open-v1",
    "household-parent-v1",
  ],
  "medicine-road-home-return": [
    "mira-handheld-v1",
    "homeward-worker-v1",
    "handcart-raised-v1",
    "trade-parcels-open-v1",
    "homeward-medicine-v1",
    "homeward-bottles-v1",
    "homeward-receipts-v1",
    "teapot-v1",
    "empty-cup-v1",
    "patient-teacup-v1",
  ],
  "sweet-blockade-return": [
    "worker-poses-v1",
    "porter-service-v1",
    "mira-handheld-v1",
    "mira-workshop-reach-v1",
  ],
  "forest-wetland-return": [
    "aria-forest-sample-v1",
    "aria-forest-carry-stand-v1",
    "aria-forest-carry-walk-v1",
    "moss-jar-open-v1",
    "sample-bowl-v1",
    "moss-bowl-v1",
    "moss-colony-v1",
  ],
  "brekka-arrival-return": ["patient-visit-v2", "doctor-visit-v1"],
  "moss-transplant-return": ["patient-visit-v2", "doctor-visit-v1"],
  "moss-transplant-departure": [
    "aria-push-v3",
    "finn-pull-scene-balanced-v3",
    "lico-notebook-walk-ponytail-v1",
    "brekka-cart-wheel-v1",
  ],
  "starlit-guild-founding-departure": [
    "finn-pull-scene-balanced-v3",
    "lico-notebook-walk-ponytail-v1",
    "garden-handcart-v2",
    "basket-v1",
    "shipping-record-v1",
  ],
};

export type CastFallback = Record<string, { standing: boolean; walking: boolean }>;

export function castImageFailures(images: string[], results: boolean[]): CastFallback {
  const failed = new Set(images.filter((_, index) => !results[index]));
  return Object.fromEntries(
    Object.entries(castImages).flatMap(([actor, [standing, walking]]) => {
      const result = {
        standing: failed.has(`/storybook-study/${standing}.webp`),
        walking: failed.has(`/storybook-study/${walking}.webp`),
      };
      return result.standing || result.walking ? [[actor, result]] : [];
    }),
  );
}

const commonLuggageImages = (actors: Set<string>) =>
  actors.has("aria") ? ["/storybook-study/common-travel-bundle-v1.webp"] : [];

/** Prepare a story's shared cast once, so later pages keep their existing stage and positions. */
export function storyCastImages(story: Story) {
  const actors = new Set<string>();
  const props = new Set<string>();
  for (let page = 0; page < story.lines.length; page++) {
    if (storyArtAt(story.id, page)) continue;
    const cue = studyCue(story.id, page, true);
    if (!cue || !stageBackground(story.id, page, cue)) continue;
    collectCast(actors, cue);
    for (const src of storybookPropImages(cue)) props.add(src);
    for (const src of sharedPoseImages(cue)) props.add(src);
  }
  const names = [
    ...[...actors].flatMap((id) => castImages[id] ?? []),
    ...(storyMotionImages[story.id] ?? []),
  ];
  const scenery =
    story.id === "tower-moss-removal-return"
      ? ["/storybook-study/tower-front-open-dusk-v1.png"]
      : [];
  return [
    ...new Set([
      ...names.map((name) => `/storybook-study/${name}.webp`),
      ...scenery,
      ...commonLuggageImages(actors),
      ...props,
    ]),
  ];
}

function collectCast(actors: Set<string>, cue: StoryStageCue) {
  for (const actor of cue.actors) actors.add(actor.id);
  for (const moment of cue.sequence ?? []) for (const actor of moment.actors) actors.add(actor.id);
}

type ImageEntry = { status: "loading" | "ready"; promise: Promise<boolean> };
const images = new Map<string, ImageEntry>();
const imageTimeoutMs = 8000;
export function storyImageReady(src: string) {
  return images.get(src)?.status === "ready";
}
export function preloadStoryImage(src: string): Promise<boolean> {
  const existing = images.get(src);
  if (existing) return existing.promise;
  const image = new Image();
  const entry: ImageEntry = { status: "loading", promise: Promise.resolve(false) };
  const promise = new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.onload = null;
      image.onerror = null;
      if (ok) entry.status = "ready";
      else images.delete(src);
      resolve(ok);
    };
    const timeout = setTimeout(() => {
      finish(false);
    }, imageTimeoutMs);
    image.onload = () => {
      if (typeof image.decode === "function")
        void image.decode().then(
          () => {
            finish(true);
          },
          () => {
            finish(false);
          },
        );
      else finish(true);
    };
    image.onerror = () => {
      finish(false);
    };
  });
  entry.promise = promise;
  images.set(src, entry);
  image.src = src;
  return promise;
}
