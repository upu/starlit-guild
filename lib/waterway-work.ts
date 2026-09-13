import type {Encounter} from './game.ts';
import {WATERWAY_QUEST,RESTORATION_QUEST} from './prologue.ts';

type WorkSite={kind:Encounter;name:string};
// Each location advances the same job. Drainage precedes removal in the inner stonework.
const restorationSites:WorkSite[]=[
 {kind:'escort',name:'作業場所への足場を確かめる'},
 {kind:'battle',name:'草むらのスライムを追い払う'},
 {kind:'escort',name:'作業者へ道具を届ける'},
 {kind:'battle',name:'水路脇のスライムを追い払う'},
 {kind:'escort',name:'切り分け作業の周囲を見張る'},
 {kind:'escort',name:'作業者と水の行き先を確かめる'},
 {kind:'battle',name:'下流のスライムを追い払う'},
 {kind:'gather',name:'手の届く枝と小石を除く'},
 {kind:'escort',name:'排水の合図を待って足場を見守る'},
 {kind:'escort',name:'流れ出した水の通りを確かめる'},
 {kind:'gather',name:'水の引いた石の苔を除く'},
 {kind:'gather',name:'開いた点検口から奥の苔を除く'},
 {kind:'gather',name:'取り除いた苔を入れ物へ集める'},
 {kind:'escort',name:'管理人と石の隙間を見直す'},
 {kind:'escort',name:'下流まで水が通ることを確かめる'},
];
export function waterwayWork(id:string,node:number):WorkSite|undefined{
 if(id===RESTORATION_QUEST)return restorationSites[node];
 if(id!==WATERWAY_QUEST)return undefined;
 if(node%3===1)return {kind:'battle',name:'斜面のスライムを追い払う'};
 const names=['管理図と斜面の道筋を照らし合わせる','苔の多い湿った場所を追う','草に隠れた水路の出口を探す'];
 return {kind:'gather',name:names[Math.min(2,Math.floor(node/5))]};
}
