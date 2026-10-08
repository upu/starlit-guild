// Frame numbers in /sprites.png that a quest's `enemy` names: 8 is the slime.
export const MIST_WOLF_SPRITE = 9;
export const DRAGON_SPRITE = 10;
// From the dragon frame on, the opponent is a single strong one rather than a group.
export const singleOpponent = (enemy: number) => enemy >= DRAGON_SPRITE;
