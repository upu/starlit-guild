import type { AdventureInput } from "../adventure-presentation.ts";
import { waterwayBackgrounds } from "../road-waterway-layout.ts";
import { mossRemovalAssets } from "../road-moss-removal-layout.ts";
import { waterwaySearchAssets } from "../road-waterway-search.ts";
import { medicinePackingAssets } from "../road-medicine-packing.ts";
import { signpostAssets } from "../road-signpost.ts";
import { golemDefenseAssets } from "../road-golem-defense.ts";
import { blockadeAssets } from "../road-blockade-layout.ts";
import { housecallsAssets } from "../road-housecalls-layout.ts";
import { berneJourneyAssets } from "../road-berne-journey.ts";
import { berneCallsAssets } from "../road-berne-calls.ts";
import { foundationAssets } from "../road-berne-foundation.ts";
import { manorDeliveryAssets } from "../road-manor-deliveries.ts";
import { stoneSelectionAssets } from "../road-stone-selection.ts";
import { manorSurveyAssets } from "../road-manor-survey.ts";
import { gardenReceptionAssets } from "../road-garden-reception.ts";
import { lindeDeliveryAssets } from "../road-linde-delivery.ts";
import { lanternRoadAssets } from "../road-lantern-layout.ts";
import { BREKKA_VISIT_BANK } from "../road-brekka-ledger.ts";
import { mossTrailAssets } from "../road-moss-trail.ts";
import { mossBedsAssets } from "../road-moss-beds.ts";
import { foundingRoadBackground } from "../road-journey-cart.ts";
import {
  STORYBOOK_ROAD,
  STORYBOOK_MOUNTAIN,
  STORYBOOK_TRANSPLANT,
  STORYBOOK_FOREST,
  STORYBOOK_DUSK_FOREST,
  STORYBOOK_MOON_FOREST,
  STORYBOOK_HILL,
  STORYBOOK_HILL_NIGHT,
} from "../road-scrolling-background.ts";

const backgrounds: Record<string, string> = {
  "town-deliveries": STORYBOOK_ROAD,
  "mountain-entrance": STORYBOOK_MOUNTAIN,
  "moss-transplant": STORYBOOK_TRANSPLANT,
  "forest-wetland": STORYBOOK_FOREST,
  "moonlit-herbs": STORYBOOK_MOON_FOREST,
  "medicine-road-home": STORYBOOK_MOUNTAIN,
  "tower-road": STORYBOOK_HILL,
  "moss-night-road": STORYBOOK_HILL_NIGHT,
  "village-trade": STORYBOOK_FOREST,
  "evening-trade-road": STORYBOOK_DUSK_FOREST,
  "tower-restoration": waterwayBackgrounds.blocked,
  "tower-moss-removal": mossRemovalAssets.bank,
  "old-waterway": waterwaySearchAssets.bank,
  "medicine-packing": medicinePackingAssets.bank,
  "hilltop-picnic": STORYBOOK_HILL,
  "spinning-signpost": signpostAssets.bank,
  "begging-golem": golemDefenseAssets.bank,
  "sweet-blockade": blockadeAssets.bank,
  "waiting-households": housecallsAssets.bank,
  "berne-road": berneJourneyAssets.road,
  "berne-house-calls": berneCallsAssets.bank,
  "missing-keystone": foundationAssets.bank,
  "riverside-manor": manorDeliveryAssets.bank,
  "matching-lantern-stone": stoneSelectionAssets.bank,
  "manor-survey": manorSurveyAssets.bank,
  "garden-reception": gardenReceptionAssets.bank,
  "linde-requests": lindeDeliveryAssets.bank,
  "lantern-detour": lanternRoadAssets.bank,
  "brekka-arrival": BREKKA_VISIT_BANK,
  "glowing-moss-trail": mossTrailAssets.bank,
  "glowing-moss-trail-next-day": mossTrailAssets.bank,
  "brekka-moss-beds": mossBedsAssets.bank,
  "lico-records": mossBedsAssets.bank,
  "merrill-seedlings": mossBedsAssets.yard,
  "starlit-guild-founding": foundingRoadBackground,
};

/** Render-only rollout. Explicit comparison choices take precedence over defaults. */
export function storybookAdventureInput(input: AdventureInput): AdventureInput {
  const quest = input.squad.run?.quest ?? input.startQuest;
  const background = backgrounds[quest];
  if (!background || input.storybookHeroes === false) return input;
  return {
    ...input,
    storybookHeroes: true,
    backgroundOverride: input.backgroundOverride ?? background,
  };
}
