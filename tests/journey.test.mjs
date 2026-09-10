import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState,act,settle,quests,testState} from '../lib/game.ts';
import {nextGoal,canBuild,buildingNeeds,partyPreview,questAdvice,journeyNotice} from '../lib/journey.ts';

test('first adventure leads from departure through help and secured rewards to building without changing the save',()=>{
 let s=initialState(1000);const snapshot=structuredClone(s);
 assert.match(nextGoal(s).title,/始めよう/);assert.deepEqual(s,snapshot);
 s=act(s,{type:'repeat',value:false},1000);s=act(s,{type:'start',id:'herbs'},1000);
 assert.match(nextGoal(s).title,/手助け/);
 const auto=settle(s,5000).state;assert.match(nextGoal(auto).title,/手助け/);
 s=act(s,{type:'assist',mode:'strike'},1000);assert.match(nextGoal(s).title,/応援が届いた/);
 let checkpoint=false;
 while(s.squads[0].run){s=settle(s,s.squads[0].run.nextAt).state;if(s.squads[0].run?.node>=3&&!checkpoint){checkpoint=true;assert.match(nextGoal(s).title,/報酬を確保/);}}
 assert.ok(checkpoint);assert.equal(nextGoal(s).destination,'build');assert.ok(canBuild(s));
 const home=act(s,{type:'build'},s.updatedAt);assert.equal(home.town,1);assert.match(journeyNotice(s,home).title,/酒場が完成/);
 assert.match(journeyNotice(snapshot,s).title,/はじめて/);assert.equal(journeyNotice(s,s),null);
 assert.equal(s.version,4);
});
test('goals expose available recruitment, new quests and exact building shortages',()=>{
 let s=initialState(1000);s.clears=3;s.town=1;s.gold=200;
 assert.match(nextGoal(s).title,/ミラ/);assert.equal(nextGoal(s).destination,'recruit');
 // An existing save can already own Mira; recruitment completion is exercised separately.
 s.owned.push('mira');s.gold=100;s.done={herbs:2,cart:1};
 assert.equal(nextGoal(s).destination,'build');assert.ok(buildingNeeds(s).includes('500 G'));assert.equal(canBuild(s),false);
 s.clears=4;assert.equal(nextGoal(s).questId,'slime');
 s.squads[0].run=null;assert.equal(nextGoal(s).destination,'quests');
});
test('party preview includes real bonuses, support roles and does not mutate saved squads',()=>{
 const s=testState(1000,10,2,1000),sq=s.squads[0],before=structuredClone(s);
 const p=partyPreview(s,sq,['mira','finn'],quests[0]);
 assert.ok(p.healing);assert.ok(p.exploring);assert.equal(p.bonds[0].name,'お目付け役と悪戯っ子');assert.deepEqual(s,before);
 const empty=partyPreview(s,sq,[],quests[0]);assert.ok(Number.isFinite(empty.secondsAfter));assert.equal(empty.after[0],0);
 assert.match(questAdvice(s,sq,quests.at(-1)),/目安より/);
});
test('offline recovery can point to newly affordable building and recruitment without replaying notices',()=>{
 let s=act(initialState(1000),{type:'start',id:'herbs'},1000);
 const result=settle(s,1000+3600000);assert.ok(result.rewards.offline);assert.equal(nextGoal(result.state).destination,'build');
 assert.equal(journeyNotice(result.state,structuredClone(result.state)),null);
 const built=act(result.state,{type:'build'},result.state.updatedAt);assert.equal(nextGoal(built).destination,'recruit');
});
