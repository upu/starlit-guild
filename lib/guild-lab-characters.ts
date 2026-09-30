import { guildLabArt } from "./guild-lab-art.ts";
import { guildLabAriaArt } from "./guild-lab-aria-art.ts";
import { labRigs, type LabCharacterId } from "./guild-lab-rig.ts";

export const labArts = { leon: guildLabArt, aria: guildLabAriaArt } as const;
export const labCharacters = {
  leon: { art: labArts.leon, rig: labRigs.leon },
  aria: { art: labArts.aria, rig: labRigs.aria },
} as const;
export type LabCharacterArt = (typeof labArts)[LabCharacterId];
