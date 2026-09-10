import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as game from '../lib/game.ts';
import * as format from '../lib/save-format.ts';
import * as journey from '../lib/journey.ts';

const code=ts.transpileModule(readFileSync(new URL('../app/use-local-game.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function harness(){
 let now=1000,writes=0,requests=0;const data=new Map(),timers=[],initializers=[],effects=[],docEvents=new Map(),winEvents=new Map();
 const exports={};
 const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>{writes++;data.set(key,value);},removeItem:key=>data.delete(key)};
 const doc={visibilityState:'visible',addEventListener:(k,v)=>docEvents.set(k,v),removeEventListener:k=>docEvents.delete(k)};
 const modules={react:{useState:v=>[v,()=>{}],useRef:v=>({current:v}),useCallback:fn=>fn,useEffect:fn=>effects.push(fn)},sonner:{toast:{success:()=>{},error:()=>{},info:()=>{}}},'@/lib/game':game,'@/lib/save-format':format,'@/lib/journey':journey,'@/lib/sound':{setSound:()=>{},sound:()=>{},unlockSound:()=>{}}};
 const context={exports,require:id=>{if(!(id in modules))throw Error(id);return modules[id];},structuredClone,crypto,AbortSignal,Date:class extends Date{static now(){return now;}},localStorage:storage,document:doc,window:{addEventListener:(k,v)=>winEvents.set(k,v),removeEventListener:k=>winEvents.delete(k)},setTimeout:fn=>{initializers.push(fn);return initializers.length;},clearTimeout:()=>{},setInterval:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearInterval:()=>{},fetch:()=>{requests++;return new Promise(()=>{});}};
 vm.runInNewContext(code,context);const hook=exports.useLocalGame();effects.forEach(fn=>fn());initializers.forEach(fn=>fn());
 const key=exports.SAVE_KEY;
 return {hook,key,data,timers,read:()=>JSON.parse(data.get(key)),writes:()=>writes,requests:()=>requests,setNow:value=>{now=value;},visibility:value=>{doc.visibilityState=value;docEvents.get('visibilitychange')();},pagehide:()=>winEvents.get('pagehide')()};
}

test('hidden game stops periodic writes, simulation and cloud requests',()=>{
 const h=harness();h.hook.dispatch({type:'start',id:'herbs'});h.setNow(2000);h.visibility('hidden');
 const writes=h.writes(),requests=h.requests(),save=h.data.get(h.key);
 h.setNow(400000);h.timers.forEach(t=>t.fn());
 assert.equal(h.writes(),writes);assert.equal(h.requests(),requests);assert.equal(h.data.get(h.key),save);
});
test('resuming after another tab expires reloads its latest save before writing',()=>{
 const h=harness();h.visibility('hidden');const newer=h.read();newer.serial+=100;newer.profiles[0].state.gold=54321;newer.profiles[0].name='別のタブで進めた冒険';
 h.data.set(h.key,JSON.stringify(newer));h.data.set(h.key+'-tab',JSON.stringify({id:'another-tab',until:9000}));h.setNow(10000);h.visibility('visible');
 const resumed=h.read();assert.equal(resumed.profiles[0].state.gold,54321);assert.equal(resumed.profiles[0].name,'別のタブで進めた冒険');assert.ok(resumed.serial>newer.serial);
});
test('a still active other tab prevents writes both on resume and pagehide',()=>{
 const h=harness();h.visibility('hidden');h.data.set(h.key+'-tab',JSON.stringify({id:'another-tab',until:999999}));
 const saved=h.data.get(h.key),writes=h.writes();h.setNow(5000);h.visibility('visible');h.pagehide();
 assert.equal(h.writes(),writes);assert.equal(h.data.get(h.key),saved);assert.equal(h.hook.dispatch({type:'start',id:'herbs'}),false);
});
test('returning from a screen lock settles earned progress once',()=>{
 const h=harness();h.hook.dispatch({type:'start',id:'herbs'});h.visibility('hidden');h.setNow(3601000);h.visibility('visible');
 const first=h.read();assert.ok(first.profiles[0].state.clears>0);h.visibility('visible');
 const second=h.read();assert.equal(second.profiles[0].state.gold,first.profiles[0].state.gold);assert.equal(second.profiles[0].state.clears,first.profiles[0].state.clears);
});
