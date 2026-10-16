import * as questNavigation from "../../lib/quest-navigation.ts";
import * as storyStage from "../../lib/story-stage.ts";
import { compileSourceModule, evaluateSourceModule } from "./source-module.mjs";

export const storySceneCompilation = compileSourceModule(
  "../../app/story-scenes.tsx",
  import.meta.url,
);
const dependencies = [
  ["./use-banter-completion", "../../app/use-banter-completion.ts"],
  ["./story-viewers", "../../app/story-viewers.tsx"],
  ["./story-memory-groups", "../../app/story-memory-groups.ts"],
  ["./story-library", "../../app/story-library.tsx"],
  ["./story-gesture-handlers", "../../app/story-gesture-handlers.ts"],
  ["@/lib/banter-exchange", "../../lib/banter-exchange.ts"],
].map(([id, path]) => [id, compileSourceModule(path, import.meta.url)]);

export function loadStoryScenes(modules, globals = {}) {
  const registry = {
    "@/lib/quest-navigation": questNavigation,
    "@/lib/story-stage": storyStage,
    "./story-stage": { StoryStage: "StoryStage" },
    ...modules,
  };
  for (const [id, compiled] of dependencies) {
    registry[id] = evaluateSourceModule(compiled, registry, globals);
  }
  return evaluateSourceModule(storySceneCompilation, registry, globals);
}
