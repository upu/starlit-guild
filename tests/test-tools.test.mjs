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
  'lucide-react':ui,sonner:{toast:{}},'./music-settings':ui,'@/lib/external-input':{},
 };
 for(const name of ['dialog','select','tabs','input','switch'])modules[`@/components/ui/${name}`]=ui;
 const {SavePanel,TestControls}=load('../app/save-panel.tsx',modules);
 for(const enabled of [false,true]){
  const profile={id:'test',test:true,name:'test',state:{clears:0}},calls=[];
  const game={testToolsEnabled:enabled,bundle:{active:'test',profiles:[profile]},profile,createProfile:v=>calls.push(v)};
  const tree=elements(SavePanel({game}));
  const buttons=tree.filter(e=>e.type==='button'&&elements(e.props.children).some(c=>c.type==='FlaskConical'));
  assert.equal(buttons.length,enabled?1:0);
  if(enabled){buttons[0].props.onClick();assert.deepEqual(calls,[true]);}
  assert.equal(TestControls({game,onAdjust:()=>{}})!==null,enabled);
  assert.equal(TestControls({game:{...game,profile:{...profile,test:false}},onAdjust:()=>{}}),null);
 }
});
