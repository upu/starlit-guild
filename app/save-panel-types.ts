import type { useGameMusic } from "./use-game-music";
import type { useLocalGame } from "./use-local-game";

export type Game = ReturnType<typeof useLocalGame>;
export type Music = ReturnType<typeof useGameMusic>;
