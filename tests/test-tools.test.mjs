import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import * as React from 'react';

function load(file,modules){
 const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};
 vm.runInNewContext(code,{exports,require:id=>{
  assert.ok(id in modules,`Unexpected import ${id}`);return modules[id];
 }});
 return exports;
}

test('page reads the runtime flag on each request and enables only the exact string true',()=>{
 const env={},Game=()=>null;
 const {default:Home,dynamic}=load('../app/page.tsx',{'cloudflare:workers':{env},'./game':{default:Game},'react/jsx-runtime':jsx});
 assert.equal(dynamic,'force-dynamic');
 for(const value of [undefined,'','false','TRUE','1',' true','true ',true,'true','false']){
  env.ENABLE_TEST_TOOLS=value;
  const element=Home();assert.equal(element.type,Game);
  assert.equal(element.props.testToolsEnabled,value==='true');
 }
});

test('game passes the server capability to local game operations and defaults to disabled',()=>{
 let received;
 const {default:Game}=load('../app/game.tsx',{
  react:{useState:()=>[false,()=>{}]},'react/jsx-runtime':jsx,
  './use-local-game':{useLocalGame:enabled=>{received=enabled;return {}; }},
  './phone-game':{PhoneGame:()=>null},'./start-screen':{StartScreen:()=>null},
  './use-game-viewport':{useGameViewport:()=>{}},
 });
 for(const enabled of [undefined,false,true]){
  Game({testToolsEnabled:enabled});assert.equal(received,enabled===true);
 }
});

// Inspect the actual React element tree without opening a browser or touching storage.
function elements(node){
 if(Array.isArray(node))return node.flatMap(elements);
 if(React.isValidElement(node)&&typeof node.type==='function')return elements(node.type(node.props));
 return React.isValidElement(node)?[node,...elements(node.props.children)]:[];
}
test('save panel hides test creation and adjustment when disabled, including existing test profiles',()=>{
 const ui=new Proxy({},{get:(_target,name)=>name});
 const modules={react:{useState:v=>[v,()=>{}],useRef:v=>({current:v})},'react/jsx-runtime':jsx,
  'lucide-react':ui,sonner:{toast:{}},'./music-settings':ui,'./quest-progression-setting':ui,'@/lib/external-input':{},
 };
 for(const name of ['dialog','alert-dialog','select','tabs','input','switch'])modules[`@/components/ui/${name}`]=ui;
 const {SavePanel,TestControls}=load('../app/save-panel.tsx',modules);
 for(const enabled of [false,true]){
  const profile={id:'test',test:true,name:'test',state:{clears:0}},calls=[];
  const game={s:profile.state,testToolsEnabled:enabled,bundle:{active:'test',profiles:[profile]},profile,createProfile:v=>calls.push(v)};
  const tree=elements(SavePanel({game}));
  const buttons=tree.filter(e=>e.type==='button'&&elements(e.props.children).some(c=>c.type==='FlaskConical'));
  assert.equal(buttons.length,enabled?1:0);
  if(enabled){buttons[0].props.onClick();assert.deepEqual(calls,[true]);}
  assert.equal(TestControls({game,onAdjust:()=>{}})!==null,enabled);
  assert.equal(TestControls({game:{...game,profile:{...profile,test:false}},onAdjust:()=>{}}),null);
 }
});

test('save panel offers deletion for every record and disables it for the last record',()=>{
 const ui=new Proxy({},{get:(_target,name)=>name}),calls=[];
 const modules={react:{useState:v=>[v,()=>{}],useRef:v=>({current:v})},'react/jsx-runtime':jsx,
  'lucide-react':ui,sonner:{toast:{}},'./music-settings':ui,'./quest-progression-setting':ui,'@/lib/external-input':{},
 };
 for(const name of ['dialog','alert-dialog','select','tabs','input','switch'])modules[`@/components/ui/${name}`]=ui;
 const {SavePanel}=load('../app/save-panel.tsx',modules);
 const profiles=[
  {id:'first',test:false,name:'最初の冒険',state:{clears:3}},
  {id:'second',test:false,name:'読み込んだ冒険',state:{clears:8}},
 ];
 const makeGame=list=>({s:list[0].state,testToolsEnabled:false,bundle:{active:list[0].id,profiles:list},profile:list[0],otherTab:false,copies:[],deleteProfile:id=>{calls.push(id);return true;}});
 const tree=elements(SavePanel({game:makeGame(profiles),music:{}}));
 const deletes=tree.filter(e=>e.type==='button'&&String(e.props['aria-label']||'').endsWith('を削除'));
 assert.equal(deletes.length,2);assert.ok(deletes.every(button=>button.props.disabled===false));
 const actions=tree.filter(e=>e.type==='AlertDialogAction'&&e.props.children==='削除する');
 actions[1].props.onClick();assert.deepEqual(calls,['second']);
 const only=elements(SavePanel({game:makeGame(profiles.slice(0,1)),music:{}})).find(e=>e.type==='button'&&String(e.props['aria-label']||'').endsWith('を削除'));
 assert.equal(only.props.disabled,true);
});
