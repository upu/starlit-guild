import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { JourneyGoal, nextGoal } from "@/lib/journey";
import type { Action, State, Squad } from "@/lib/game";
import type { Story, StoryLine } from "@/lib/stories";
import type { allQuests, heroes } from "@/lib/game";
import type { useGameMusic } from "./use-game-music";
import type { useInstallPrompt } from "./install-guide";
import type { useJourneyHints } from "./use-journey-hints";
import type { useLocalGame } from "./use-local-game";

export type Game = ReturnType<typeof useLocalGame>;
export type Sheet =
  | "book"
  | "quests"
  | "party"
  | "bag"
  | "shop"
  | "journal"
  | "build"
  | "upgrade"
  | "gift"
  | "recruit"
  | "help"
  | "goal"
  | "preview"
  | "advice"
  | "install"
  | "stories"
  | "album"
  | "story"
  | "banter"
  | "personality"
  | null;
export type ReturnIntent = {
  squad: string;
  destination: "adventure" | "companions";
  quest?: string;
};
export type SheetView = { title: string; description: string; content: ReactNode };
export type SheetModel = {
  sheet: Sheet;
  reading: Story | null;
  ready: boolean;
  pendingDeparture: Action | null;
  activeQuest: (typeof allQuests)[number] | undefined;
  banterSnapshot: StoryLine[];
  hero: (typeof heroes)[number];
  state: State;
  goal: ReturnType<typeof nextGoal>;
  installStatus: ReturnType<typeof useInstallPrompt>;
  game: Game;
  music: ReturnType<typeof useGameMusic>;
  unread: number;
  hints: ReturnType<typeof useJourneyHints>;
  setSheet: (sheet: Sheet) => void;
  openStory: (story: Story) => void;
  finishStory: () => boolean;
  closeStory: () => void;
  navigate: (view: string) => void;
  followGoal: (goal: JourneyGoal) => void;
  quest: (typeof allQuests)[number];
  squad: Squad;
  run: Squad["run"];
  act: (action: Action, onSuccess?: (state: State) => void) => boolean;
  candidateQuest: string;
  setCandidateQuest: (id: string) => void;
  selectQuest: (id?: string) => void;
  clock: number;
  openQuests: (id?: string) => void;
  readStory: (id: string) => boolean;
  setView: (view: string) => void;
};
export type PhoneFrameModel = SheetModel & {
  view: string;
  returnIntent: ReturnIntent | null;
  ending: Story | null;
  banter: StoryLine[];
  quote: string;
  destinationChosen: boolean;
  roster: (typeof heroes)[number][];
  setBanterSnapshot: Dispatch<SetStateAction<StoryLine[]>>;
  setHeroIndex: Dispatch<SetStateAction<number>>;
  requestReturn: (destination: "adventure" | "companions", quest?: string) => void;
  confirmReturn: () => void;
  setReturnIntent: Dispatch<SetStateAction<ReturnIntent | null>>;
};
