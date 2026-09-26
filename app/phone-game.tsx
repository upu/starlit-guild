"use client";
import { useState } from "react";
import { useGameMusic } from "./use-game-music";
import { useJourneyHints } from "./use-journey-hints";
import { useInstallPrompt } from "./install-guide";
import { PhoneFrame } from "./phone-game-frame";
import { nextGoal, type JourneyGoal } from "@/lib/journey";
import {
  availableStories,
  departureStory as storyDeparture,
  journeyBanter,
  stories,
  storyProgress,
  type Story,
} from "@/lib/stories";
import { isInterlude } from "@/lib/interludes";
import {
  TRADE_QUEST,
  isPrologueQuest,
  stageEndingPending,
  stageUnlocked,
  restingQuest,
} from "@/lib/prologue";
import { heroes, availableQuests, activeBonds } from "@/lib/game";
import type { Action, State, Squad } from "@/lib/game";
import type { Game, PhoneFrameModel, ReturnIntent, Sheet, SheetModel } from "./phone-game-types";

function startAction(action: Action) {
  return action.type === "start" ? { ...action, value: !isPrologueQuest(action.id || "") } : action;
}
function departureStory(state: State, action: Action) {
  const actionId = action.id;
  if (action.type !== "start" || !actionId) return null;
  const target = state.squads.find((party) => party.id === action.squad) || state.squads[0];
  return storyDeparture(state, target, actionId);
}
function departable(state: State, id: string) {
  return isInterlude(id) || (isPrologueQuest(id) && stageUnlocked(state, id));
}
// Auto-Next stops at rest only in front of an unseen departure conversation. The screen then
// acts as if the departure button were pressed and waits on that conversation.
function autoDeparture(state: State, squad: Squad, choice?: string) {
  const id = squad.lastQuest;
  if (!state.autoNextQuest || squad.run || !id || (choice && choice !== id)) return null;
  if (stageEndingPending(state) || !departable(state, id)) return null;
  const story = storyDeparture(state, squad, id);
  return story && { story, action: startAction({ type: "start", squad: squad.id, id }) };
}
function selectedDestination(state: State, squad: Squad, choice?: string) {
  return squad.run?.quest || choice || squad.lastQuest || restingQuest(state, squad);
}
function hasDestination(state: State, squad: Squad, choice?: string) {
  return !!choice || !!squad.lastQuest || !!state.done[restingQuest(state, squad)];
}

// A destination picked on screen lasts until the saved one moves (a departure or Auto-Next).
type QuestChoice = { id: string; saved?: string };
function currentChoice(squad: Squad, choices: Partial<Record<string, QuestChoice>>) {
  const choice = choices[squad.id];
  return choice && choice.saved === squad.lastQuest ? choice.id : undefined;
}
function phoneWorld(game: Game, questChoices: Record<string, QuestChoice>, heroIndex: number) {
  const { s, clock } = game,
    squad = s.squads[0],
    run = squad.run,
    ready = game.ready && !game.otherTab,
    choice = currentChoice(squad, questChoices);
  const questId = selectedDestination(s, squad, choice),
    unlocked = availableQuests(s),
    quest = unlocked.find((item) => item.id === questId) || unlocked[0];
  const roster = heroes.filter((hero) => s.owned.includes(hero.id)),
    hero = roster[Math.min(heroIndex, roster.length - 1)];
  const synergy = activeBonds(squad.members),
    lines = synergy.length
      ? synergy.flatMap((bond) => bond.lines)
      : squad.members.map(
          (id) => `${heroes.find((hero) => hero.id === id)?.name ?? "仲間"}「さあ、次の冒険へ！」`,
        );
  const pendingEnding = stageEndingPending(s);
  return {
    s,
    clock,
    squad,
    run,
    ready,
    unlocked,
    quest,
    roster,
    hero,
    quote: lines[Math.floor(clock / 8000) % lines.length],
    ending: pendingEnding
      ? (stories.find((story) => story.id === pendingEnding + "-return") ?? null)
      : null,
    destinationChosen: hasDestination(s, squad, choice),
    choice,
  };
}

function usePhoneContext(game: Game) {
  const installStatus = useInstallPrompt();
  const [pendingDeparture, setPendingDeparture] = useState<Action | null>(null),
    [reading, setReading] = useState<Story | null>(null);
  const [view, setView] = useState("adventure"),
    [sheet, setSheet] = useState<Sheet>(null),
    [questChoices, setQuestChoices] = useState<Record<string, QuestChoice>>({}),
    [heroIndex, setHeroIndex] = useState(0),
    [candidateQuest, setCandidateQuest] = useState(TRADE_QUEST),
    [returnIntent, setReturnIntent] = useState<ReturnIntent | null>(null);
  const world = phoneWorld(game, questChoices, heroIndex);
  const auto =
    !sheet && view === "adventure" && !returnIntent && world.ready
      ? autoDeparture(world.s, world.squad, world.choice)
      : null;
  const setQuest = (id: string) => {
    setQuestChoices((current) => ({
      ...current,
      [world.squad.id]: { id, saved: world.squad.lastQuest },
    }));
  };
  // Once saved, the destination follows the save, so a later Auto-Next move shows through.
  const clearQuest = () => {
    setQuestChoices((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => id !== world.squad.id)),
    );
  };
  const music = useGameMusic(world.run ? "journey" : "camp", world.ready),
    goal = nextGoal(world.s, world.squad),
    hints = useJourneyHints(game.profile?.id, goal),
    banter = journeyBanter(world.s, world.squad, world.clock),
    unread = availableStories(world.s).filter(
      (story) => !storyProgress(world.s).read.includes(story.id),
    ).length;
  return {
    ...world,
    game,
    installStatus,
    music,
    goal,
    hints,
    banter,
    unread,
    pendingDeparture: auto?.action ?? pendingDeparture,
    setPendingDeparture,
    reading: auto?.story ?? reading,
    setReading,
    view,
    setView,
    sheet: auto ? "story" : sheet,
    setSheet,
    setQuest,
    clearQuest,
    heroIndex,
    setHeroIndex,
    candidateQuest,
    setCandidateQuest,
    returnIntent,
    setReturnIntent,
  };
}
type PhoneContext = ReturnType<typeof usePhoneContext>;
type PhoneAct = (action: Action, onSuccess?: (state: State) => void, current?: State) => boolean;

function phoneStoryActions(context: PhoneContext) {
  const openStory = (story: Story) => {
    context.setReading(story);
    context.setSheet("story");
  };
  const act: PhoneAct = (input, onSuccess, current = context.s) => {
    const action = startAction(input),
      departure = departureStory(current, action);
    if (departure) {
      context.setPendingDeparture(action);
      openStory(departure);
      return true;
    }
    const ok = context.game.dispatch(action, (state) => {
      if (action.type === "start") context.clearQuest();
      onSuccess?.(state);
    });
    if (ok && action.type === "start" && action.id?.startsWith("join-")) {
      context.setView("adventure");
      context.setSheet(null);
    }
    return ok;
  };
  const readStory = (id: string) =>
    context.game.dispatch({ type: "readStory", id }, (current) => {
      const next = current.squads.find((party) => party.id === context.squad.id)?.lastQuest;
      if (next && next !== context.squad.lastQuest) context.clearQuest();
    });
  const finishStory = () => {
    if (!context.reading) return false;
    if (!context.pendingDeparture) return readStory(context.reading.id);
    const ok = context.game.dispatch(
      { ...context.pendingDeparture, readDeparture: true },
      context.clearQuest,
    );
    if (ok) context.setPendingDeparture(null);
    return ok;
  };
  const closeStory = () => {
    context.setPendingDeparture(null);
    context.setSheet(null);
  };
  return { openStory, act, readStory, finishStory, closeStory };
}

function phoneQuestActions(context: PhoneContext, act: PhoneAct) {
  const openQuests = (id = context.quest.id) => {
    context.setCandidateQuest(id);
    context.setView("adventure");
    context.setSheet("quests");
  };
  const selectQuest = (candidate = context.candidateQuest) => {
    if (!context.ready) return;
    const id = context.unlocked.find((item) => item.id === candidate)?.id;
    if (!id) return;
    const choose = () => {
      context.setQuest(id);
      context.setSheet(null);
      context.setView("adventure");
    };
    if (context.run && context.run.quest !== id) {
      context.game.dispatch({ type: "stop", squad: context.squad.id }, (current) => {
        choose();
        act({ type: "start", squad: context.squad.id, id }, undefined, current);
      });
      return;
    }
    choose();
  };
  return { openQuests, selectQuest };
}

function phoneNavigationActions(
  context: PhoneContext,
  act: PhoneAct,
  openQuests: (id?: string) => void,
) {
  const followGoal = (goal: JourneyGoal) => {
    if (goal.destination === "quests") {
      openQuests(goal.questId || context.quest.id);
      return;
    }
    context.setSheet(null);
    if (goal.questId) context.setQuest(goal.questId);
    context.setView(goal.destination);
  };
  const navigate = (view: string) => {
    context.setSheet(null);
    if (view !== context.view) context.setView(view);
  };
  const requestReturn = (destination: "adventure" | "companions", quest?: string) => {
    context.setReturnIntent({ squad: context.squad.id, destination, quest });
  };
  const confirmReturn = () => {
    const intent = context.returnIntent;
    if (!intent) return;
    const target = context.s.squads.find((party) => party.id === intent.squad);
    if (target && act({ type: "stop", squad: target.id })) {
      if (intent.quest) context.setQuest(intent.quest);
      context.setView(intent.destination);
      context.setSheet(null);
      context.setReturnIntent(null);
    }
  };
  return { followGoal, navigate, requestReturn, confirmReturn };
}

function usePhoneGameModel(game: Game): PhoneFrameModel {
  const context = usePhoneContext(game),
    story = phoneStoryActions(context),
    questActions = phoneQuestActions(context, story.act),
    navigation = phoneNavigationActions(context, story.act, questActions.openQuests);
  const sheetModel: SheetModel = {
    readStory: story.readStory,
    sheet: context.sheet,
    reading: context.reading,
    ready: context.ready,
    pendingDeparture: context.pendingDeparture,
    hero: context.hero,
    state: context.s,
    goal: context.goal,
    installStatus: context.installStatus,
    game,
    music: context.music,
    unread: context.unread,
    hints: context.hints,
    setSheet: context.setSheet,
    openStory: story.openStory,
    finishStory: story.finishStory,
    closeStory: story.closeStory,
    navigate: navigation.navigate,
    followGoal: navigation.followGoal,
    quest: context.quest,
    squad: context.squad,
    run: context.run,
    act: story.act,
    candidateQuest: context.candidateQuest,
    setCandidateQuest: context.setCandidateQuest,
    selectQuest: questActions.selectQuest,
    clock: context.clock,
    openQuests: questActions.openQuests,
    setView: context.setView,
  };
  return {
    ...sheetModel,
    view: context.view,
    returnIntent: context.returnIntent,
    ending: context.ending,
    banter: context.banter,
    quote: context.quote,
    destinationChosen: context.destinationChosen,
    roster: context.roster,
    setHeroIndex: context.setHeroIndex,
    requestReturn: navigation.requestReturn,
    confirmReturn: navigation.confirmReturn,
    setReturnIntent: context.setReturnIntent,
  };
}

export function PhoneGame({ game }: { game: Game }) {
  return <PhoneFrame model={usePhoneGameModel(game)} />;
}
