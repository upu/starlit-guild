import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';
import * as game from '../lib/game.ts';
import * as story from '../lib/stories.ts';
import * as prologue from '../lib/prologue.ts';
import * as journey from '../lib/journey.ts';
import {adventureFrame} from '../lib/adventure-presentation.ts';

const source=readFileSync(new URL('../app/phone-game.tsx',import.meta.url),'utf8')+'\nexport {AdventureDestination};';
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function harness(initialState){
 const slots=[],exports={};let cursor=0,model;
 const api={s:initialState,clock:initialState.updatedAt,ready:true,otherTab:false,profile:{id:'flow-test'},dispatch(action){api.s=game.act(api.s,action,api.clock);return true;}};
 const modules={
  react:{useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];}},
  'react/jsx-runtime':jsxRuntime,'@/lib/game':game,'@/lib/stories':story,'@/lib/prologue':prologue,'@/lib/journey':journey,
  './install-guide':{useInstallPrompt:()=>({})},'./use-game-music':{useGameMusic:()=>({})},'./use-journey-hints':{useJourneyHints:()=>({})},
 };
 vm.runInNewContext(code,{exports,require:id=>modules[id]||new Proxy({},{get:(_,name)=>String(name)})});
 function render(){cursor=0;model=exports.PhoneGame({game:api}).props.model;return model;}
 function nodes(node){return !node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(nodes)];}
 function departButton(){return nodes(exports.AdventureDestination({model})).find(node=>node.type==='button'&&node.props.children==='出発');}
 render();return {render,api,departButton,get model(){return model;},background(){return adventureFrame({squad:model.squad,startQuest:model.quest.id,now:api.clock,ready:true,paused:!!model.sheet}).background;}};
}
function afterTrade(){
 let s=game.act(game.initialPrologueState(1000),{type:'start',id:prologue.TRADE_QUEST,readDeparture:true},1000);
 s=game.settle(s,3601000).state;return game.act(s,{type:'readStory',id:prologue.TRADE_QUEST+'-return'},s.updatedAt);
}

test('choosing a destination previews it without departing; the separate button opens its story on that background',()=>{
 const s=afterTrade(),before=structuredClone(s),h=harness(s);
 assert.equal(h.background(),'/forest.png');
 h.model.openQuests();h.render();h.model.setCandidateQuest(prologue.RETURN_QUEST);h.render();
 // Browsing a candidate does not commit the destination.
 assert.equal(h.background(),'/forest.png');
 h.model.selectQuest();h.render();
 assert.equal(h.model.sheet,null);assert.equal(h.model.pendingDeparture,null);assert.equal(h.model.run,null);
 assert.equal(h.background(),'/stages/evening-trade-road.png');assert.deepEqual(h.api.s,before);
 const depart=h.departButton();assert.ok(depart);assert.equal(depart.props.disabled,false);depart.props.onClick();h.render();
 assert.equal(h.model.reading.id,prologue.RETURN_QUEST+'-departure');assert.equal(h.model.sheet,'story');
 assert.equal(h.background(),'/stages/evening-trade-road.png');assert.equal(h.api.s.squads[0].run,null);
 h.model.closeStory();h.render();assert.deepEqual(h.api.s,before);assert.equal(h.background(),'/stages/evening-trade-road.png');
 h.departButton().props.onClick();h.render();assert.equal(h.model.finishStory(),true);h.model.closeStory();h.render();
 assert.equal(h.api.s.squads[0].run.quest,prologue.RETURN_QUEST);
 assert.ok(h.api.s.story.read.includes(prologue.RETURN_QUEST+'-departure'));assert.equal(h.departButton(),undefined);
});

test('changing a running destination keeps its scene until return is confirmed, then waits for departure',()=>{
 const s=game.act(afterTrade(),{type:'start',id:prologue.TRADE_QUEST,readDeparture:true},3601000),h=harness(s);
 h.model.setCandidateQuest(prologue.RETURN_QUEST);h.render();h.model.selectQuest();h.render();
 assert.equal(h.model.returnIntent.quest,prologue.RETURN_QUEST);assert.equal(h.background(),'/forest.png');
 assert.equal(h.api.s.squads[0].run.quest,prologue.TRADE_QUEST);
 h.model.setReturnIntent(null);h.render();assert.equal(h.api.s.squads[0].run.quest,prologue.TRADE_QUEST);
 h.model.selectQuest();h.render();h.model.confirmReturn();h.render();
 assert.equal(h.model.run,null);assert.equal(h.model.pendingDeparture,null);assert.equal(h.background(),'/stages/evening-trade-road.png');
 assert.ok(h.departButton());assert.equal(h.api.s.story.departed.includes(prologue.RETURN_QUEST),false);
});

test('fresh profiles choose first; selection respects the inactive-tab gate and is not saved as a departure',()=>{
 const s=game.initialPrologueState(1000),h=harness(s);assert.equal(h.departButton(),undefined);
 h.api.otherTab=true;h.render();h.model.selectQuest();h.render();assert.equal(h.departButton(),undefined);
 h.api.otherTab=false;h.render();h.model.selectQuest();h.render();assert.ok(h.departButton());
 assert.deepEqual(h.api.s,s);assert.equal(harness(h.api.s).departButton(),undefined);
 h.api.otherTab=true;h.render();assert.equal(h.departButton().props.disabled,true);
});

test('idle dialogue has six complete, distinct exchanges and never changes the save',()=>{
 const s=game.initialPrologueState(1000),before=structuredClone(s),exchanges=[];
 for(let i=0;i<6;i++){
  const lines=story.journeyBanter(s,s.squads[0],i*30000);
  assert.ok(lines.length>=2);assert.ok(lines.every(line=>['aria','leon'].includes(line.speaker)));
  assert.deepEqual(story.journeyBanter(s,s.squads[0],i*30000+29999),lines);exchanges.push(JSON.stringify(lines));
 }
 assert.equal(new Set(exchanges).size,6);assert.equal(JSON.stringify(story.journeyBanter(s,s.squads[0],180000)),exchanges[0]);assert.deepEqual(s,before);
});
