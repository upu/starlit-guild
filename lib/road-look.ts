import type { roadWorkLook } from "./chapter-road-work-look.ts";
import type { WaterwayPhase } from "./road-waterway-layout.ts";

export type RoadLook = {
  foundingDraft?: {
    node: number;
    total: number;
    working: boolean;
    departureAge?: number;
    visualNode?: number;
    completed?: boolean;
    visualComplete?: boolean;
    arrivalScene?: boolean;
    fade?: number;
    actor?: import("./road-view.ts").TravellerId;
    openingGrip?: boolean;
    cue?:
      | "pickup"
      | "walk"
      | "give"
      | "return"
      | "recover"
      | "dropped"
      | "recipient-wait"
      | "recipient-shelter";
  };
  mossBeds?: {
    node: number;
    completed: boolean;
    records?: boolean;
    seedlings?: boolean;
    recordsClosing?: boolean;
    visualComplete?: boolean;
    recordsDialogue?: import("./adventure-presentation.ts").AdventureInput["recordsDialogue"];
    cue?: "water" | "label" | "around" | "other";
  };
  mossTrail?: {
    node: number;
    progress: number;
    paused: boolean;
    idle: boolean;
    writing?: boolean;
    secondDay?: boolean;
    completed?: boolean;
    visualComplete?: boolean;
    portrait?: boolean;
    fork?: boolean;
    fade?: number;
  };
  brekkaNotes?: { actor?: import("./road-view.ts").TravellerId; node: number; generation: number };
  brekkaLedger?: {
    active: boolean;
    actor?: import("./road-view.ts").TravellerId;
    paused?: boolean;
    portrait?: boolean;
    fade?: number;
  };
  brekkaJourney?: {
    node: number;
    completed: boolean;
    working: boolean;
    idle: boolean;
    paused: boolean;
    instant: boolean;
    fade?: number;
    visualComplete?: boolean;
    displayNode?: number;
    generation?: number;
    field?: boolean;
    arrival?: boolean;
  };
  lanternRoad?: {
    node: number;
    completed: boolean;
    working: boolean;
    instant?: boolean;
    visualComplete?: boolean;
    paused?: boolean;
    portrait?: boolean;
    fade?: number;
  };
  lindeDelivery?: {
    node: number;
    completed: boolean;
    instant?: boolean;
    paused?: boolean;
    portrait?: boolean;
    fade?: number;
    visualComplete?: boolean;
    pickupCourier?: import("./road-view.ts").TravellerId;
  };
  restoration?: {
    node: number;
    completed: boolean;
    installed?: boolean;
    fade?: number;
    installAge?: number;
    visualComplete?: boolean;
    dialogue?: "pending" | "guide" | "root" | "plan" | "other";
  };
  nightBridge?: {
    node: number;
    completed: boolean;
    instant?: boolean;
    wheel?: boolean;
    section?: number;
    fade?: number;
  };
  gardenReception?: { node: number; completed: boolean; arrived?: boolean; fade?: number };
  manorSurvey?: { node: number; completed: boolean; gathering?: boolean; fade?: number };
  stoneSelection?: { node: number; completed: boolean; sorted?: boolean; fade?: number };
  manorDelivery?: { node: number; completed: boolean; garden?: boolean; fade?: number };
  foundation?: {
    node: number;
    completed: boolean;
    finalizing?: boolean;
    exposed?: boolean;
    fade?: number;
    visualComplete?: boolean;
  };
  berneCalls?: { node: number; completed: boolean };
  housecalls?: { node: number; completed: boolean };
  blockade?: { node: number; completed: boolean };
  defense?: { node: number };
  signpost?: { node: number; completed: boolean };
  packing?: { node: number; completed: boolean };
  waterway?: { node: number; phase: WaterwayPhase; completed?: boolean };
  quest?: string;
  townFinalizing?: boolean;
  mossFinalizing?: boolean;
  forestFinalizing?: boolean;
  forestReturn?: { scene: boolean; fade: number };
  waterwaySearchFinalizing?: boolean;
  waterwaySearchReturn?: { scene: boolean; fade: number };
  sceneKey?: string;
  background: string;
  backgroundShade?: number;
  storybookHeroes?: boolean;
  night?: boolean;
  length: number;
  workers: string[];
  puller: string | null;
  frontCarriers: string[];
  urban: boolean;
  destination: boolean;
  work?: ReturnType<typeof roadWorkLook>;
  enemies: Record<number, { frame: string; label: string }>;
};
