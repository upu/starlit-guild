import type { AdventureInput } from "./adventure-presentation.ts";
import type { Squad } from "./game.ts";
import { restorationAssets } from "./road-berne-restoration.ts";
import { nightBridgeAssets } from "./road-night-bridge.ts";
import { lindeDeliveryAssets } from "./road-linde-delivery.ts";
import { lanternRoadAssets } from "./road-lantern-layout.ts";
import { BREKKA_VISIT_BANK } from "./road-brekka-ledger.ts";
import { mossTrailAssets } from "./road-moss-trail.ts";
import { foundingRoadBackground } from "./road-journey-cart.ts";
import { foundationAssets } from "./road-berne-foundation.ts";
import { finalWorkSnapshot } from "./road-final-work-snapshot.ts";

type VisualHandoff = {
  quest?:
    | "berne-restoration"
    | "keystone-night-road"
    | "linde-requests"
    | "lantern-detour"
    | "brekka-arrival"
    | "glowing-moss-trail"
    | "glowing-moss-trail-next-day"
    | "lico-records"
    | "merrill-seedlings"
    | "town-deliveries"
    | "tower-moss-removal"
    | "missing-keystone"
    | "forest-wetland"
    | "old-waterway"
    | "starlit-guild-founding";
  active: boolean;
  squad: Squad | null;
  skipped: boolean;
  dialogue: AdventureInput["restorationDialogue"];
  nightWheel?: boolean;
  mossTrailNote?: boolean;
  waiting?: boolean;
  recordsSquad?: Squad | null;
  recordsClosing?: boolean;
};

/** Substitute rendering data only; no saved squad is modified. */
export function restorationVisualInput(
  input: AdventureInput,
  handoff?: VisualHandoff,
): AdventureInput {
  if (!handoff?.active || !handoff.squad) return input;
  const early = earlyVisualInput(input, handoff, handoff.squad);
  if (early) return early;
  const confrontation = confrontationVisualInput(input, handoff, handoff.squad);
  if (confrontation) return confrontation;
  if (handoff.quest && handoff.quest in chapterFourBanks)
    return chapterFourVisualInput(input, handoff, handoff.squad);
  if (handoff.quest === "keystone-night-road") {
    const finished = handoff.skipped || !input.squad.run;
    return {
      ...input,
      squad: finished ? { ...handoff.squad, run: null } : handoff.squad,
      startQuest: handoff.quest,
      questComplete: finished,
      skipVisual: handoff.skipped,
      nightWheel: handoff.nightWheel,
      backgroundOverride: nightBridgeAssets.bank,
      storybookHeroes: true,
    };
  }
  return {
    ...input,
    squad: handoff.skipped ? { ...handoff.squad, run: null } : handoff.squad,
    startQuest: "berne-restoration",
    questComplete: handoff.skipped || input.questComplete,
    backgroundOverride: restorationAssets.bank,
    storybookHeroes: true,
    restorationDialogue: handoff.dialogue,
  };
}

function earlyVisualInput(
  input: AdventureInput,
  handoff: VisualHandoff,
  squad: Squad,
): AdventureInput | undefined {
  if (handoff.quest === "old-waterway") {
    if (handoff.skipped) return input;
    const finalizing = !input.squad.run;
    return {
      ...input,
      squad: finalWorkSnapshot(squad, finalizing),
      startQuest: "old-waterway",
      waterwaySearchFinalizing: finalizing,
      storybookHeroes: true,
    };
  }
  if (handoff.quest === "forest-wetland") {
    if (handoff.skipped) return input;
    const finalizing = !input.squad.run;
    return {
      ...input,
      squad: finalWorkSnapshot(squad, finalizing),
      startQuest: "forest-wetland",
      forestFinalizing: finalizing,
      storybookHeroes: true,
    };
  }
  if (handoff.quest === "missing-keystone") return foundationVisualInput(input, handoff, squad);
  if (handoff.quest === "tower-moss-removal") return mossVisualInput(input, handoff, squad);
  if (handoff.quest === "town-deliveries") return townVisualInput(input, handoff, squad);
}

function foundationVisualInput(input: AdventureInput, handoff: VisualHandoff, squad: Squad) {
  if (handoff.skipped) return input;
  return {
    ...input,
    squad,
    startQuest: "missing-keystone",
    foundationFinalizing: !input.squad.run,
    backgroundOverride: foundationAssets.bank,
    storybookHeroes: true,
  };
}

function mossVisualInput(input: AdventureInput, handoff: VisualHandoff, squad: Squad) {
  if (handoff.skipped) return input;
  return {
    ...input,
    squad,
    startQuest: "tower-moss-removal",
    mossFinalizing: !input.squad.run,
    storybookHeroes: true,
  };
}

function townVisualInput(input: AdventureInput, handoff: VisualHandoff, squad: Squad) {
  if (handoff.skipped) return input;
  return {
    ...input,
    squad,
    startQuest: "town-deliveries",
    townFinalizing: !input.squad.run,
    storybookHeroes: true,
  };
}

function confrontationVisualInput(
  input: AdventureInput,
  handoff: VisualHandoff,
  squad: Squad,
): AdventureInput | undefined {
  if (handoff.quest === "merrill-seedlings")
    return {
      ...input,
      squad,
      startQuest: handoff.quest,
      storybookHeroes: true,
      seedlingsClosing: !!handoff.waiting || !input.squad.run,
    };
  if (handoff.quest === "lico-records")
    return {
      ...input,
      squad:
        handoff.waiting || handoff.recordsClosing ? squad : (handoff.recordsSquad ?? input.squad),
      startQuest: handoff.quest,
      storybookHeroes: true,
      recordsClosing: handoff.recordsClosing,
    };
}

const chapterFourBanks: Record<string, string> = {
  "linde-requests": lindeDeliveryAssets.bank,
  "lantern-detour": lanternRoadAssets.bank,
  "brekka-arrival": BREKKA_VISIT_BANK,
  "glowing-moss-trail": mossTrailAssets.bank,
  "glowing-moss-trail-next-day": mossTrailAssets.bank,
  "starlit-guild-founding": foundingRoadBackground,
};
function chapterFourVisualInput(input: AdventureInput, handoff: VisualHandoff, squad: Squad) {
  const finished = handoff.skipped || !input.squad.run;
  const clearRun =
    handoff.skipped ||
    (finished &&
      ![
        "brekka-arrival",
        "glowing-moss-trail",
        "glowing-moss-trail-next-day",
        "starlit-guild-founding",
      ].includes(handoff.quest ?? ""));
  return {
    ...input,
    squad: clearRun ? { ...squad, run: null } : squad,
    startQuest: handoff.quest ?? input.startQuest,
    questComplete: finished,
    skipVisual: handoff.skipped,
    backgroundOverride: chapterFourBanks[handoff.quest ?? ""],
    storybookHeroes: true,
    mossTrailNote: handoff.mossTrailNote,
  };
}
