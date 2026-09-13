import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';
import {initialPrologueState,act,settle} from '../lib/game.ts';
import {stories} from '../lib/stories.ts';
import {tradeEndingPending,TRADE_QUEST} from '../lib/prologue.ts';

const code=ts.transpileModule(readFileSync(new URL('../app/quest-completion.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function harness(state,ready=true){
 let reading=false,reads=0,closes=0;
 const exports={},readerRef={current:null},modules={react:{useState:()=>[reading,value=>{reading=value;}]},'react/jsx-runtime':jsxRuntime,'lucide-react':{BadgeCheck:'badge',ChevronRight:'arrow'},'./story-scenes':{StoryReader:'story-reader'},'./story-heading':{StoryHeading:'story-heading'},'./use-story-advance':{useStoryAdvance:()=>({readerRef,onPointerDownOutside:()=>{}})},'@/components/ui/dialog':Object.fromEntries(['Dialog','DialogContent','DialogHeader','DialogTitle','DialogDescription'].map(name=>[name,name]))};
 vm.runInNewContext(code,{exports,require:id=>{if(!(id in modules))throw Error(id);return modules[id];}});
 const props={story:stories.find(st=>st.id===TRADE_QUEST+'-return'),questName:'街への交易',ready,onRead(){reads++;if(!ready)return false;state=act(state,{type:'readStory',id:props.story.id},state.updatedAt);return true;},onClose(){closes++;}};
 function find(node,type){if(!node||typeof node!=='object')return;if(node.type===type)return node;return [node.props?.children].flat(Infinity).map(child=>find(child,type)).find(Boolean);}
 return {get:type=>find(exports.QuestCompletion(props),type),state:()=>state,reads:()=>reads,closes:()=>closes};
}
const arrive=()=>settle(act(initialPrologueState(1000),{type:'start',id:TRADE_QUEST,readDeparture:true},1000),3601000).state;

test('arrival shows a clear card first and reading starts only after pressing it',()=>{
 const state=arrive(),h=harness(state),gold=state.gold;
 assert.ok(h.get('button'));assert.equal(h.get('story-reader'),undefined);assert.equal(h.reads(),0);
 h.get('Dialog').props.onOpenChange(false);assert.equal(h.reads(),0);assert.equal(h.closes(),0);
 let prevented=false;h.get('DialogContent').props.onEscapeKeyDown({preventDefault(){prevented=true;}});assert.equal(prevented,true);
 h.get('button').props.onClick();assert.ok(h.get('story-reader'));assert.equal(h.reads(),0);assert.equal(tradeEndingPending(h.state()),true);
 assert.equal(h.get('story-heading').props.readerRef,h.get('story-reader').props.advanceRef);
 assert.ok(harness(structuredClone(h.state())).get('button'),'reopening an unread completion returns to the clear card');
 const reader=h.get('story-reader');if(reader.props.onRead())reader.props.onClose();
 assert.equal(h.closes(),1);assert.equal(tradeEndingPending(h.state()),false);assert.equal(h.state().gold,gold);
});

test('dialog dismissal never skips conversation; only its final control marks it read',()=>{
 const h=harness(arrive());h.get('button').props.onClick();h.get('Dialog').props.onOpenChange(false);
 assert.equal(tradeEndingPending(h.state()),true);assert.equal(h.closes(),0);assert.equal(h.reads(),0);
 assert.equal(h.get('DialogContent').props.showCloseButton,false);
 for(const eventName of ['onEscapeKeyDown','onInteractOutside']){let prevented=false;h.get('DialogContent').props[eventName]({preventDefault(){prevented=true;}});assert.equal(prevented,true);}
 const reader=h.get('story-reader');if(reader.props.onRead())reader.props.onClose();assert.equal(tradeEndingPending(h.state()),false);assert.equal(h.closes(),1);
 const unavailable=harness(arrive(),false);assert.equal(unavailable.get('button').props.disabled,true);unavailable.get('Dialog').props.onOpenChange(false);
 assert.equal(unavailable.reads(),0);assert.equal(tradeEndingPending(unavailable.state()),true);
});
