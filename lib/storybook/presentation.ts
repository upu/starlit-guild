import { basketStories } from "./basket-cue.ts";
import { householdStories } from "./households-cue.ts";
/** Scenes whose painted assets and contact positions have been reviewed together. */
export function storybookPresentation(id: string, background?: string, line = 1) {
  const completion = completionPlace(id, line, background);
  if (completion) return completion;
  const lateChapterFour = finalChapterFourPlace(id, background);
  if (lateChapterFour) return lateChapterFour;
  const dynamic = dynamicScenePresentation(id, background, line);
  if (dynamic) return dynamic;
  if (background === "medicine-room") return { mode: "indoor", art: "medicine-room-v1" };
  if (id === "tower-moss-removal-departure")
    return {
      mode: "outdoor",
      art: "drain-inspection-bare-v1",
    };
  const fixed = sceneArt[id];
  if (fixed) return fixed;
  if (id === "village-trade-departure" || background === "meeting-path")
    return { mode: "outdoor", art: "meeting-path-v1" };
  const art = background && outdoorArt[background];
  return art ? { mode: "outdoor", art } : undefined;
}

function finalChapterFourPlace(id: string, background?: string) {
  if (householdStories.includes(id) && background !== "mountain-road")
    return householdPlace(background);
  if (id.startsWith("moss-transplant-")) return transplantPlace(id, background);
  if (id === "starlit-guild-founding-departure")
    return {
      mode: "outdoor" as const,
      art: background === "hill-path" ? "founding-return-path-v1" : "founding-tower-yard-v1",
    };
  return undefined;
}
function dynamicScenePresentation(id: string, background?: string, line = 1) {
  if (id.startsWith("merrill-seedlings-")) return { mode: "outdoor", art: "tower-loading-yard-v1" };
  if (id === "lico-records-departure") return recordsPlace(background);
  if (id === "brekka-arrival-return") return visitPlace(background);
  if (id === "lantern-detour-return") return lanternTime(line);
  if (id === "berne-restoration-return") return restorationPlace(background);
  if (id === "manor-survey-departure")
    return { mode: "outdoor", art: surveyDoorArt[background ?? ""] ?? "berne-paving-v1" };
  if (id === "riverside-manor-departure")
    return {
      mode: "outdoor",
      art: background === "manor-kitchen-open" ? "manor-kitchen-open-v1" : "manor-kitchen-v1",
    };
  if (id === "matching-lantern-stone-return") return stoneRestPlace(background);
  return undefined;
}

function completionPlace(id: string, line: number, background?: string) {
  if (id !== "tower-moss-removal-return" || line >= 6) return undefined;
  return {
    mode: "outdoor",
    art:
      line === 0 && background !== "tower-foot"
        ? "drain-inspection-empty-dusk-v1"
        : "tower-front-dusk-v1",
  };
}
function householdPlace(background?: string) {
  return background === "patient-room"
    ? { mode: "indoor" as const, art: "settlement-patient-room-v1" }
    : { mode: "outdoor" as const, art: "settlement-house-v1" };
}
function transplantPlace(id: string, background?: string) {
  if (id.endsWith("return")) return transplantReturnPlace(background);
  return background === "moss-beds"
    ? { mode: "outdoor" as const, art: "tower-loading-yard-v1" }
    : background === "transplant-path"
      ? { mode: "outdoor" as const, art: "transplant-night-path-v1" }
      : undefined;
}
function transplantReturnPlace(background?: string) {
  const arts: Record<string, string> = {
    "new-moss-beds": "new-moss-beds-v1",
    "tower-foot": "brekka-tower-drain-v1",
    "patient-room": "patient-room-v1",
    "village-house": "brekka-homes-v1",
  };
  const art = arts[background ?? ""];
  return art
    ? { mode: background === "patient-room" ? ("indoor" as const) : ("outdoor" as const), art }
    : undefined;
}
function recordsPlace(background?: string) {
  return background === "registry" ? { mode: "indoor", art: "tower-registry-v1" } : undefined;
}
function stoneRestPlace(background?: string) {
  return background === "stone-storeroom"
    ? { mode: "indoor", art: "stone-storeroom-v1" }
    : { mode: "outdoor", art: "stone-yard-v1" };
}
function lanternTime(line: number) {
  return { mode: "outdoor", art: line >= 7 ? "hill-path-dusk-v1" : "hill-path-v1" };
}
function visitPlace(background?: string) {
  return background === "brekka-homes"
    ? { mode: "outdoor", art: "brekka-homes-v1" }
    : { mode: "indoor", art: "patient-room-v1" };
}
function restorationPlace(background?: string) {
  return background === "dining-room"
    ? { mode: "indoor", art: "roadside-dining-v1" }
    : { mode: "outdoor", art: "berne-foundation-restored-v1" };
}

const surveyDoorArt: Record<string, string> = {
  "manor-gate": "manor-gate-v1",
  "manor-kitchen-open": "manor-kitchen-open-v1",
};

const sceneArt: Partial<Record<string, { mode: "indoor" | "outdoor"; art: string }>> = {
  "tower-restoration-return": { mode: "outdoor", art: "drain-inspection-dusk-v1" },
  "berne-road-return": { mode: "outdoor", art: "berne-overlook-v1" },
  "interlude-promised-walnuts": { mode: "outdoor", art: "walnut-rest-v1" },
  "interlude-walnut-lunch": { mode: "outdoor", art: "picnic-hill-v1" },
  "hilltop-picnic-return": { mode: "outdoor", art: "picnic-hill-v1" },
  "glowing-moss-trail-next-day-departure": { mode: "outdoor", art: "brekka-alley-v1" },
  "glowing-moss-trail-departure": { mode: "indoor", art: "brekka-foyer-v1" },
  "glowing-moss-trail-return": { mode: "outdoor", art: "brekka-fork-v1" },
  "brekka-arrival-departure": { mode: "indoor", art: "brekka-dining-v1" },
  "lantern-detour-departure": { mode: "outdoor", art: "hill-path-v1" },
  "lantern-detour-return": { mode: "outdoor", art: "hill-path-v1" },
  "linde-requests-departure": { mode: "indoor", art: "linde-dining-v1" },
  "linde-requests-return": { mode: "indoor", art: "linde-dining-dusk-v1" },
  "berne-restoration-departure": { mode: "outdoor", art: "berne-foundation-open-v2" },
  "keystone-night-road-departure": { mode: "outdoor", art: "manor-display-dusk-v1" },
  "keystone-night-road-return": { mode: "outdoor", art: "bridge-night-v1" },
  "garden-reception-return": { mode: "outdoor", art: "manor-display-back-v1" },
  "garden-reception-departure": { mode: "outdoor", art: "manor-well-v1" },
  "manor-survey-return": { mode: "outdoor", art: "manor-back-paths-v1" },
  "town-deliveries-departure": { mode: "outdoor", art: "warehouse-v1" },
  "town-deliveries-return": { mode: "outdoor", art: "warehouse-v1" },
  "starlit-guild-founding-return": { mode: "indoor", art: "founding-office-v2" },
  "tower-road-return": { mode: "outdoor", art: "tower-base-v1" },
  "spinning-signpost-departure": { mode: "outdoor", art: "mountain-fork-v1" },
  "spinning-signpost-return": { mode: "outdoor", art: "mountain-fork-v1" },
  "begging-golem-departure": { mode: "outdoor", art: "workshop-yard-v1" },
  "berne-road-departure": { mode: "indoor", art: "roadside-dining-v1" },
  "missing-keystone-departure": { mode: "outdoor", art: "berne-foundation-grass-v2" },
  "missing-keystone-return": { mode: "outdoor", art: "berne-foundation-open-v2" },
  "riverside-manor-return": { mode: "outdoor", art: "manor-garden-v1" },
  "matching-lantern-stone-departure": { mode: "outdoor", art: "stone-yard-v1" },
};

const outdoorArt: Record<string, string> = {
  "mountain-fork-empty": "mountain-fork-v1",
  "moss-beds": "moss-beds-v1",
  "brekka-fork": "brekka-fork-v1",
  "brekka-tower-path": "brekka-tower-path-v2",
  "berne-paving": "berne-paving-v1",
  "berne-porch": "berne-porch-v2",
  "workshop-yard": "workshop-yard-v1",
  "mountain-road": "mountain-road-v1",
  "hill-path": "hill-path-v1",
  "town-exit": "town-exit-v1",
  "meeting-dusk": "meeting-dusk-v1",
  "hill-night": "hill-night-v1",
  "meeting-night": "meeting-night-v1",
  "forest-floor": "forest-floor-v1",
  "tower-foot": "tower-base-v1",
  "drain-blocked": "drain-blocked-v1",
  "drain-cleared": "drain-cleared-v1",
};
function usesPaintedCarry(id: string, line: number) {
  return (
    (id === "town-deliveries-departure" && [3, 4, 5, 6, 7, 13, 14].includes(line)) ||
    (id === "town-deliveries-return" && line === 0) ||
    (id === "tower-road-return" && line >= 19) ||
    id.startsWith("moss-night-road-") ||
    id === "forest-wetland-departure"
  );
}

export function storybookStageAttributes(id: string, line: number, painted = true) {
  const basket = usesRegisteredCarry(id);
  const carry = painted && (usesPaintedCarry(id, line) || basket);
  return {
    "data-painted": painted,
    "data-inspection-open": inspectionOpen(id, line, painted),
    "data-repair-basket-place": painted && repairBasketMotion(id, line),
    "data-forest-study": painted && id.startsWith("forest-wetland-"),
    "data-night-study": painted && id.startsWith("moss-night-road-"),
    "data-transplant-moss-light": transplantMossLight(id, line, painted),
    "data-paper-study": painted && usesPaperStudy(id, line, basket),
    "data-carry-study": carry,
    "data-shared-pickup": carry && id === "town-deliveries-departure" && line === 14,
    "data-carry-raised": carry && id === "town-deliveries-departure" && line >= 5 && line <= 7,
  };
}

function repairBasketMotion(id: string, line: number) {
  return (
    (id === "tower-restoration-departure" && line === 9) ||
    (id === "tower-restoration-return" && line === 16)
  );
}

function usesPaperStudy(id: string, line: number, basket: boolean) {
  return (
    (id === "starlit-guild-founding-return" && (line === 35 || line === 64)) ||
    id === "forest-wetland-departure" ||
    basket
  );
}

function transplantMossLight(id: string, line: number, painted: boolean) {
  return painted && id === "moss-transplant-departure" && line >= 16 && line < 20;
}

function inspectionOpen(id: string, line: number, painted: boolean) {
  return painted && id === "tower-moss-removal-departure" && line > 0;
}

function usesRegisteredCarry(id: string) {
  if (householdStories.includes(id)) return true;
  if (id === "interlude-promised-walnuts") return true;
  if (id === "interlude-walnut-lunch") return true;
  if (id.startsWith("starlit-guild-founding-")) return true;
  if (id.startsWith("moss-transplant-")) return true;
  if (
    [
      "merrill-seedlings-",
      "lico-records-",
      "brekka-moss-beds-",
      "brekka-arrival-",
      "lantern-detour-",
      "linde-requests-",
      "berne-restoration-",
      "keystone-night-road-",
      "garden-reception-",
      "manor-survey-",
    ].some((prefix) => id.startsWith(prefix))
  )
    return true;
  return (
    basketStories.includes(id) ||
    id.startsWith("moonlit-herbs-") ||
    [
      "hilltop-picnic-departure",
      "hilltop-picnic-return",
      "medicine-packing-departure",
      "medicine-packing-return",
      "mountain-entrance-departure",
      "tower-road-return",
      "old-waterway-departure",
      "medicine-road-home-return",
      "begging-golem-return",
      "berne-road-return",
      "sweet-blockade-departure",
      "sweet-blockade-return",
      "berne-house-calls-departure",
      "berne-house-calls-return",
      "missing-keystone-return",
      "riverside-manor-return",
      "matching-lantern-stone-departure",
      "matching-lantern-stone-return",
      "tower-moss-removal-return",
    ].includes(id)
  );
}
