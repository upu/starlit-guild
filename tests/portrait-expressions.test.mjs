import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';
import * as jsxRuntime from 'react/jsx-runtime';
import * as portraits from '../lib/portrait-expressions.ts';
import * as originals from '../lib/original-characters.ts';
import {stories} from '../lib/stories.ts';
import {idleBanter} from '../lib/idle-banter.ts';

const code=ts.transpileModule(readFileSync(new URL('../app/portrait.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const exports={};
const modules={'react/jsx-runtime':jsxRuntime,'@/lib/original-characters':originals,'@/lib/portrait-expressions':portraits};
vm.runInNewContext(code,{exports,require:id=>{assert.ok(id in modules);return modules[id];}});

test('four reference characters use their own eight-cell atlas; other characters retain their art',async()=>{
 for(const [index,name] of [[0,'aria'],[1,'leon'],[2,'mira'],[13,'pumpety']]){
  const positions=new Set();
  for(const expression of portraits.portraitExpressions){
   const portrait=exports.Portrait({index,expression,size:72});
   assert.equal(portrait.props.style.backgroundImage,`url(/portraits/${name}-expressions.webp)`);
   assert.equal(portrait.props.style.backgroundSize,'400% 200%');
   positions.add(portrait.props.style.backgroundPosition);
  }
  assert.equal(positions.size,8);
  const meta=await sharp(readFileSync(new URL(`../public/portraits/${name}-expressions.webp`,import.meta.url))).metadata();
  assert.equal(meta.width,1024);assert.equal(meta.height,512);
  assert.equal(exports.Portrait({index}).props.style.backgroundPosition,'0% 0%');
 }
 for(const index of [3,4,5,6,7,12,14]){
  assert.equal(portraits.expressionPortrait(index,'smile'),null);
  assert.ok(exports.Portrait({index,expression:'smile'}).props.style.backgroundImage.includes('dialogue-atlas'));
 }
});

test('expressions are authored for narrative context, narration has none, and unspecified lines stay neutral',()=>{
 for(const story of stories)for(const line of story.lines){
  if(!line.speaker)assert.equal(line.expression,undefined);
  if(line.expression)assert.ok(portraits.portraitExpressions.includes(line.expression),`${story.id}: ${line.expression}`);
 }
 const opening=stories.find(s=>s.id==='village-trade-departure');
 assert.equal(opening.lines.find(l=>l.text==='待った？').expression,'smile');
 assert.equal(opening.lines.find(l=>l.text==='布、二枚？').expression,'surprised');
 const failure=stories.find(s=>s.id==='town-deliveries-departure');
 assert.equal(failure.lines.find(l=>l.text.startsWith('……ごめん。')).expression,'worried');
 const mira=stories.find(s=>s.id==='recruit-mira-meeting');
 assert.equal(mira.lines.find(l=>l.text.startsWith('私は大丈夫。')).expression,'tired');
 const pumpety=stories.find(s=>s.id==='puppet-midnight-departure');
 assert.equal(pumpety.lines.find(l=>l.text.startsWith('もう名前で')).expression,'mischievous');
 assert.ok(idleBanter(0).every(l=>l.expression==='smile'));
 assert.equal(portraits.expressionPortrait(0).position,'0% 0%');
});
