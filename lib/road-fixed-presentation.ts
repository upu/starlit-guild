import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { presentWaterway } from "./road-waterway.ts";
import { presentMedicinePacking } from "./road-medicine-packing.ts";
import { presentSignpost } from "./road-signpost.ts";
import { presentGolemDefense } from "./road-golem-defense.ts";
import { presentBlockade } from "./road-blockade.ts";
import { presentHousecalls } from "./road-housecalls.ts";
import { presentBerneCalls } from "./road-berne-calls.ts";
import { presentBerneFoundation } from "./road-berne-foundation.ts";
import { presentManorDeliveries } from "./road-manor-deliveries.ts";
import { presentStoneSelection } from "./road-stone-selection.ts";
import { presentManorSurvey } from "./road-manor-survey.ts";
import { presentGardenReception } from "./road-garden-reception.ts";
import { presentNightBridge } from "./road-night-bridge.ts";
import { presentBerneRestoration } from "./road-berne-restoration.ts";
import { presentLindeDelivery } from "./road-linde-presentation.ts";
import { presentLanternRoad } from "./road-lantern-road.ts";
import { presentBrekkaLedger } from "./road-brekka-ledger.ts";
import { presentMossTrail } from "./road-moss-trail.ts";
import { presentMossBeds } from "./road-moss-beds.ts";
import { presentFoundingCartDraft } from "./road-journey-cart.ts";

/** Each registered fixed site owns its camera, ground and prop projection. */
export function presentFixedRoad(
  frame: { battle: RoadBattle; look: RoadLook },
  input: AdventureInput,
  view: RoadViewport,
) {
  presentWaterway(frame, input, view);
  presentMedicinePacking(frame, input, view);
  presentSignpost(frame, input, view);
  presentGolemDefense(frame, input, view);
  presentBlockade(frame, input, view);
  presentHousecalls(frame, input, view);
  presentBerneCalls(frame, input, view);
  presentBerneFoundation(frame, input, view);
  presentManorDeliveries(frame, input, view);
  presentStoneSelection(frame, input, view);
  presentManorSurvey(frame, input, view);
  presentGardenReception(frame, input, view);
  presentNightBridge(frame, input, view);
  presentBerneRestoration(frame, input, view);
  presentLindeDelivery(frame, input, view);
  presentLanternRoad(frame, input, view);
  presentBrekkaLedger(frame, input, view);
  presentMossTrail(frame, input, view);
  presentMossBeds(frame, input, view);
  presentFoundingCartDraft(frame, input);
}
