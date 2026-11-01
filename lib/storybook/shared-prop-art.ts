import type { StageItem, StoryStageCue } from "../story-stage-cues.ts";

// Shared objects keep their authored identity, dimensions and hand registration.
// A scene's more specific CSS can still select its own variation of the object.
const sharedArt: Partial<Record<StageItem["art"], string>> = {
  honey: "honey-v1",
  map: "travel-map-v1",
  "medicine-packet": "medicine-packet-v1",
  "bread-roll": "bread-roll-v1",
  ledger: "field-open-ledger-v1",
  "serving-tray": "serving-tray-v1",
  teacup: "patient-teacup-v1",
  "closed-ledger": "field-closed-ledger-v1",
  "wrist-bandage": "wrist-bandage-v1",
  twine: "lunch-twine-v1",
  medicine: "medicine-v1",
  "folded-paper": "folded-request-v1",
  chair: "chair-v1",
  lantern: "night-lantern-v1",
  "packing-cloth": "common-packing-cloth-v1",
  "dragging-cloth": "common-dragging-cloth-v1",
  "delivery-bag": "common-delivery-bag-v1",
  "old-wrapper": "common-old-wrapper-v1",
  paper: "common-paper-v1",
  "lap-napkin": "common-lap-napkin-v1",
  "bread-half": "common-bread-half-v1",
  bread: "common-wrapped-bread-v1",
  "picnic-cloth": "common-picnic-cloth-v1",
  dish: "common-dish-v1",
  moss: "common-moss-bowl-v1",
  stone: "common-flat-stone-v1",
  quill: "common-quill-v1",
  spatula: "common-spatula-v1",
};

function sharedPropImage(item: StageItem) {
  const name = sharedArt[item.art];
  return item.image ?? (name ? `/storybook-study/${name}.webp` : undefined);
}

function paintedItems(items: StageItem[] | undefined) {
  return items?.map((item) => {
    const image = sharedPropImage(item);
    return image ? { ...item, image } : item;
  });
}

/** Apply defaults at the painted renderer boundary, including exits and timed steps. */
export function storybookPropCue(cue: StoryStageCue): StoryStageCue {
  return {
    ...cue,
    items: paintedItems(cue.items),
    sequence: cue.sequence?.map((step) => ({ ...step, items: paintedItems(step.items) ?? [] })),
  };
}

export function storybookPropImages(cue: StoryStageCue) {
  const items = [...(cue.items ?? []), ...(cue.sequence?.flatMap((step) => step.items) ?? [])];
  return [...new Set(items.map(sharedPropImage).filter((src): src is string => !!src))];
}
