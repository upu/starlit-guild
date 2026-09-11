import type {State} from './game.ts';

export const TRADE_QUEST='village-trade';
// Absent in existing saves: those adventures keep their unlocked features.
export const inPrologue=(s:State)=>s.prologue===true;
export const tradeEndingPending=(s:State)=>!!s.done[TRADE_QUEST]&&!!s.story?.completed.includes(TRADE_QUEST)&&!s.story.read.includes(TRADE_QUEST+'-return');
