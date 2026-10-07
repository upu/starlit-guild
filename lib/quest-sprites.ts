// Frame numbers in /sprites.png. A quest's `enemy` names the opponent frame, and the target
// figure of a gather or escort stretch uses the matching work frame.
export const ESCORT_SPRITE = 7;
export const SLIME_SPRITE = 8;
export const MIST_WOLF_SPRITE = 9;
export const DRAGON_SPRITE = 10;
export const GATHER_SPRITE = 11;
// From the dragon frame on, the opponent is a single strong one rather than a group.
export const singleOpponent = (enemy: number) => enemy >= DRAGON_SPRITE;
