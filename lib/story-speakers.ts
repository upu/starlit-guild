import { heroes } from "./game.ts";
import { originalCharacters } from "./original-characters.ts";
import type { PortraitCharacter } from "./portrait-expressions.ts";

// Dialogue-only characters do not become recruitable or appear in the party roster.
export const storySpeakers: { id: string; name: string; sprite: number | PortraitCharacter }[] = [
  ...heroes,
  ...originalCharacters.filter((character) => !heroes.some((hero) => hero.id === character.id)),
  { id: "finn", name: "フィン", sprite: "finn" },
];
