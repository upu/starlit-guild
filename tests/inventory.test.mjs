import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const phone=readFileSync(new URL('../app/phone-game.tsx',import.meta.url),'utf8');
const recruitment=readFileSync(new URL('../app/recruitment-board.tsx',import.meta.url),'utf8');
const panels=readFileSync(new URL('../app/equipment-panels.tsx',import.meta.url),'utf8');
const source=ts.createSourceFile('equipment-panels.tsx',panels,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const resources=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='ResourcesGrid');
const formatter=source.statements.find(node=>ts.isVariableStatement(node)&&node.declarationList.declarations.some(declaration=>declaration.name.getText(source)==='amount'));
assert.ok(resources&&formatter);
const compiled=ts.transpileModule(`${formatter.getText(source)}\n${resources.getText(source)}`,{
 fileName:'inventory.tsx',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React,jsxFactory:'element'},
}).outputText;
const exports={};
runInNewContext(compiled,{exports,element:(type,props,...children)=>({type,props,children:children.flat(Infinity)}),Coins:'coins',Leaf:'leaf',Gem:'gem',Logs:'logs'});
function balances(state){
 const content=exports.ResourcesGrid({state});
 assert.equal(content.type,'div');assert.equal(content.props.className,'inventory-grid');assert.equal(content.children.length,4);
 return Array.from(content.children,cell=>({icon:cell.children[0].type,label:cell.children[1].children.join(''),amount:cell.children[2].children.join('')}));
}
 test('bag keeps all normal resources with the existing formatting',()=>{
 const state=Object.freeze({prologue:true,gold:12345.9,herbs:8.7,ore:3,wood:0});
 assert.deepEqual(balances(state),[
  {icon:'coins',label:'お金',amount:'12,345'},
  {icon:'leaf',label:'薬草',amount:'8'},
  {icon:'gem',label:'鉱石',amount:'3'},
  {icon:'logs',label:'木材',amount:'0'},
 ]);
});

 test('empty inventory keeps all four resource counters visible',()=>{
 assert.deepEqual(balances({prologue:true,gold:0,herbs:0,ore:0,wood:0}).map(item=>item.amount),['0','0','0','0']);
});

 test('legacy recruitment progress is neither displayed nor changed by opening inventory',()=>{
 const state={gold:180,herbs:80,ore:5,wood:40,owned:['aria','leon','mira'],done:{herbs:12},recruitment:{prepared:['mira']}};
 const before=structuredClone(state);
 balances(state);
 assert.deepEqual(state,before);
});

 test('the rare-material inventory component and its import are removed, not just hidden in chapter one',()=>{
 assert.doesNotMatch(phone,/\bRareInventory\b/);
 assert.doesNotMatch(recruitment,/\bRareInventory\b|出会いをつなぐ希少素材|rare-inventory/);
 assert.match(recruitment,/export function RecruitmentBoard\b/);
 assert.match(recruitment,/function Preparation\b/);
 assert.match(recruitment,/function RareSearch\b/);
});

 test('rare-material notices no longer direct players to the removed inventory section',()=>{
 const journey=readFileSync(new URL('../lib/journey.ts',import.meta.url),'utf8');
 const source=ts.createSourceFile('journey.ts',journey,ts.ScriptTarget.Latest,true);
 const notice=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='recruitmentNotice');
 assert.ok(notice);
 assert.doesNotMatch(notice.getText(source),/持ちもの|持ち物/);
 assert.match(notice.getText(source),/との冒険の支度に使えます。/);
});
