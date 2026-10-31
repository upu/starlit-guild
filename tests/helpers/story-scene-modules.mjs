import * as questNavigation from "../../lib/quest-navigation.ts";
import * as storyStage from "../../lib/story-stage.ts";
import * as paintedStage from "../../lib/storybook/carry-cue.ts";
import * as paintedTravel from "../../lib/storybook/travel-packing.ts";
import * as adventureEntry from "../../lib/storybook/adventure-entry.ts";
import { compileSourceModule, evaluateSourceModule } from "./source-module.mjs";

export const storySceneCompilation = compileSourceModule(
  "../../app/story-scenes.tsx",
  import.meta.url,
);
const dependencies = [
  ["./story-stage-title", "../../app/story-stage-title.tsx"],
  ["./use-story-motion-advance", "../../app/use-story-motion-advance.ts"],
  ["./use-stage-exit", "../../app/use-stage-exit.ts"],
  ["./use-story-scroll", "../../app/use-story-scroll.ts"],
  ["@/lib/banter-exchange", "../../lib/banter-exchange.ts"],
  ["./use-banter-completion", "../../app/use-banter-completion.ts"],
  ["./use-banter-line", "../../app/use-banter-line.ts"],
  ["./story-viewers", "../../app/story-viewers.tsx"],
  ["./story-memory-groups", "../../app/story-memory-groups.ts"],
  ["./story-library", "../../app/story-library.tsx"],
  ["./story-gesture-handlers", "../../app/story-gesture-handlers.ts"],
  ["./use-banter-exchange", "../../app/use-banter-exchange.ts"],
  ["./banter-tail", "../../app/banter-tail.tsx"],
].map(([id, path]) => [id, compileSourceModule(path, import.meta.url)]);

export function loadStoryScenes(modules, globals = {}) {
  const registry = {
    "@/lib/quest-navigation": questNavigation,
    "@/lib/story-stage": storyStage,
    "@/lib/storybook/carry-cue": paintedStage,
    "@/lib/storybook/travel-packing": paintedTravel,
    "@/lib/storybook/adventure-entry": adventureEntry,
    "./storybook/stage": { StorybookStage: "StoryStage" },
    "./storybook/story-reader-stage": { StoryReaderStage: "StoryStage" },
    "./use-story-stage-images": {
      useStoryStageImages: () => ({ status: "ready", castFallback: {} }),
    },
    "./story-stage": { StoryStage: "StoryStage" },
    ...modules,
  };
  for (const [id, compiled] of dependencies) {
    registry[id] = evaluateSourceModule(compiled, registry, globals);
  }
  return evaluateSourceModule(storySceneCompilation, registry, globals);
}
