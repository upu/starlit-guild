import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsxRuntime from 'react/jsx-runtime';

const source=readFileSync(new URL('../app/use-story-advance.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;

test('outside primary clicks advance once and suppress dismissal; context clicks never advance',()=>{
 const exports={};
 vm.runInNewContext(code,{exports,require:()=>({useRef:()=>({current:null})})});
 const {readerRef,onPointerDownOutside}=exports.useStoryAdvance();
 let advanced=0,prevented=0;
 const click=(button=0,ctrlKey=false)=>onPointerDownOutside({preventDefault(){prevented++;},detail:{originalEvent:{button,ctrlKey}}});
 click();assert.equal(advanced,0,'no reader is a safe no-op');
 readerRef.current={advance(){advanced++;}};
 click();click();assert.equal(advanced,2);
 click(2);click(1);click(0,true);assert.equal(advanced,2);
 assert.equal(prevented,6);
});

test('story and banter dialogs wire outside clicks to their reader; ordinary sheets do not',()=>{
 const exports={},readerRef={current:null},onPointerDownOutside=()=>{};
 const modules={
  react:{},'react/jsx-runtime':jsxRuntime,
  './use-story-advance':{useStoryAdvance:()=>({readerRef,onPointerDownOutside})},
  './story-scenes':{StoryReader:'reader',ConversationReader:'reader'},
  '@/components/ui/dialog':{Dialog:'dialog',DialogContent:'content',DialogHeader:'header',DialogTitle:'title',DialogDescription:'description'},
 };
 const phoneSource=readFileSync(new URL('../app/phone-game.tsx',import.meta.url),'utf8');
 const phoneCode=ts.transpileModule(phoneSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(phoneCode+'\nexports.SheetDialog=SheetDialog;',{exports,require:id=>modules[id]??{}});
 for(const sheet of ['story','banter',null]){
  const model={sheet,reading:{id:'test',title:'test',place:'test'},setSheet(){throw Error('outside click must not close the conversation');}};
  const dialog=exports.SheetDialog({model}),content=dialog.props.children;
  assert.equal(content.props.onPointerDownOutside,sheet?onPointerDownOutside:undefined);
  let prevented=false;content.props.onInteractOutside({preventDefault(){prevented=true;}});
  assert.equal(prevented,!!sheet);
  if(sheet)assert.equal(content.props.children[1].props.advanceRef,readerRef);
 }
});
