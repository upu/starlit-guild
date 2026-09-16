import {pathToFileURL} from 'node:url';
import {initialPrologueState,level,memberStats,memberMaxHp} from '../lib/game.ts';
import {inventoryOf} from '../lib/equipment.ts';
import {equippedTechnique} from '../lib/techniques.ts';
import {trainedChapter} from './check-combat-balance.mjs';
import {chapterRoute} from './check-chapter-two-balance.mjs';

export function checkpoint(state){
 return {
  members:state.owned.map(id=>({id,level:level(state.xp[id]||0),xp:state.xp[id]||0,
   stats:memberStats(state,id),maxHp:memberMaxHp(state,id),equipment:inventoryOf(state).equipped[id]||{},
   active:equippedTechnique(state,id,'active'),passive:equippedTechnique(state,id,'passive')})),
  gold:state.gold,gear:state.gear,camp:state.camp,town:state.town,friendship:state.friendship,
  learned:state.techniques?.learned||[],storyRead:state.story?.read||[],
 };
}
// Carry the complete earned state across chapters, not a reconstructed level preset.
export function progressionRoute(){
 const first=trainedChapter(true);
 if(first.records.length!==9||!first.records.every(r=>r.cleared))throw Error('第一章を完走できませんでした。');
 const handoff=checkpoint(first.state),second=chapterRoute('standard',first.state);
 if(second.records.length!==9||!second.records.every(r=>r.cleared))throw Error('第二章を完走できませんでした。');
 return {
  measurement:'Game simulation elapsed time; not human playtime. Dialog reading and user decisions excluded.',
  chapters:[
   {chapter:1,start:checkpoint(initialPrologueState(1000)),end:handoff,trainingSeconds:first.trainingSeconds,
    totalSeconds:first.totalSeconds,cumulativeStartSeconds:0,cumulativeEndSeconds:first.totalSeconds},
   {chapter:2,start:handoff,end:checkpoint(second.state),trainingSeconds:second.trainingSeconds,
    totalSeconds:second.totalSeconds,cumulativeStartSeconds:first.totalSeconds,cumulativeEndSeconds:first.totalSeconds+second.totalSeconds},
  ],
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(progressionRoute(),null,2));
