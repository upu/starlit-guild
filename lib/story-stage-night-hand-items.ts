import type { StageItem } from "./story-stage-cues.ts";
import { ground, held } from "./story-stage-later-shared.ts";
import { receptionDisplayItems } from "./story-stage-reception-items.ts";

type HandProps = {
  cover?: "closed" | "lifting";
  clip?: "fixed" | "loose" | "hand" | "floor";
  cloth?: "hidden" | "mira" | "finn" | "stained";
  servantGone?: boolean;
  potCarried?: boolean;
};

export function nightHandItems() {
  let state: HandProps = { cover: "closed", clip: "fixed", cloth: "hidden" };
  return (patch: HandProps = {}): StageItem[] => {
    state = { ...state, ...patch };
    return [
      ...receptionDisplayItems({ cloth: "rim", covered: true }).map((p) => updateDisplay(p, state)),
      coverCloth(state),
      brokenClip(state),
      handCloth(state),
      ground("medicine-closed", 71, 8, 8),
    ];
  };
}

function updateDisplay(p: StageItem, state: HandProps): StageItem {
  if (p.id === "reception-cart") return { ...p, x: 30, bottom: 8 };
  if (p.id === "case")
    return { ...p, art: state.cover === "lifting" ? "display-closed" : "display-covered" };
  if (p.id === "tower-stone")
    return { ...p, stored: state.cover !== "lifting", glow: "dim", glowTone: "violet" };
  if (p.id === "case-key") return { ...p, stored: state.servantGone };
  if (p.id === "display-pot" && state.potCarried)
    return held("garden-pot", "aria", { id: p.id, x: 4, bottom: 23, width: p.width });
  return p;
}

function coverCloth(state: HandProps): StageItem {
  const lifted = state.cover === "lifting";
  return {
    ...ground("cart-drape", lifted ? -5 : 66, lifted ? 49 : 59, 8),
    id: "cover-cloth",
    extra: lifted ? "merchant" : undefined,
    support: "display-table",
    stored: !lifted,
  };
}

function brokenClip(state: HandProps): StageItem {
  if (state.clip === "hand")
    return held("broken-fastener", "finn", {
      id: "broken-clip",
      wrist: true,
      width: 2,
      travelMs: 300,
    });
  return {
    ...ground(
      "broken-fastener",
      state.clip === "fixed" ? 55 : 54.5,
      state.clip === "fixed" ? 61 : state.clip === "loose" ? 54 : 42,
      2,
    ),
    id: "broken-clip",
    travelMs: 400,
    support: state.clip === "fixed" ? "case" : undefined,
  };
}

function handCloth(state: HandProps): StageItem {
  const finn = state.cloth === "finn" || state.cloth === "stained";
  return held(state.cloth === "stained" ? "stained-cloth" : "cloth", finn ? "finn" : "mira", {
    id: "palm-cloth",
    x: 4,
    bottom: 25,
    width: 3.5,
    wrist: finn,
    stored: state.cloth === "hidden",
  });
}
