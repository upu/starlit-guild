"use client";
import { initialState } from "@/lib/game";
import {
  SAVE_KEY,
  useBackup,
  useLocalAdvance,
  useLocalGameState,
  useLocalPersistence,
  useRefreshCopies,
} from "./local-game-state";
import { useLocalGameLifecycle } from "./local-game-lifecycle";
import {
  createAdjust,
  createDeleteProfile,
  createDownload,
  createGameDispatch,
  createImportFile,
  createProfileAction,
  createRestoreCopy,
  createSwitchProfile,
  createTakeOver,
  createToggleSound,
} from "./local-game-actions";

export { SAVE_KEY };

export function useLocalGame(testToolsEnabled = false) {
  const state = useLocalGameState(),
    persistence = useLocalPersistence(state),
    advance = useLocalAdvance(state, persistence.publish),
    context = { ...state, ...persistence, advance },
    backup = useBackup(state, persistence),
    refreshCopies = useRefreshCopies(state);
  useLocalGameLifecycle({ ...context, backup, refreshCopies });
  const restoreCopy = createRestoreCopy(context),
    profile = state.bundle?.profiles.find((item) => item.id === state.bundle?.active);
  return {
    testToolsEnabled,
    s: profile?.state || initialState(0),
    profile,
    bundle: state.bundle,
    clock: state.clock,
    ready: !!state.bundle,
    otherTab: state.otherTab,
    takeOver: createTakeOver(context),
    error: state.error,
    cloudError: state.cloudError,
    cloudBusy: state.cloudBusy,
    copies: state.copies,
    refreshCopies,
    backup,
    saved: state.saved,
    report: state.report,
    setReport: state.setReport,
    dispatch: createGameDispatch(context),
    switchProfile: createSwitchProfile(context),
    createProfile: createProfileAction(context, testToolsEnabled),
    deleteProfile: createDeleteProfile(context),
    adjust: createAdjust(context, testToolsEnabled),
    restoreCopy,
    importFile: createImportFile(context, restoreCopy),
    download: createDownload(context),
    toggleSound: createToggleSound(context),
  };
}
