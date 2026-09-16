import type {Enemy} from './combat.ts';

export type PuppetRole='puppet'|'golem'|'sweeper'|'puppeteer';
export const puppetRoles=['puppet','golem','sweeper','puppeteer'] as const;
export function questNodes(id:string){
 if(id==='spinning-signpost')return 9;
 return ['begging-golem','sweet-blockade'].includes(id)?3:15;
}
export function puppetFormation(id:string,node:number):PuppetRole[]|null{
 if(id==='spinning-signpost')return node===7?['puppet','puppet']:['puppet'];
 if(id==='begging-golem')return ([['puppet'],['golem'],['puppet','golem']] as PuppetRole[][])[node];
 if(id==='sweet-blockade')return ([['puppet','puppet'],['puppet','sweeper'],['puppet','sweeper','puppeteer']] as PuppetRole[][])[node];
 return null;
}
export function puppetStats(role:PuppetRole,rank:number){
 const hp=36+rank*3,attack=4+rank*.45;
 const tuning={puppet:{hp:1.15,attack:.48,period:950},golem:{hp:2.8,attack:2.5,period:3300},sweeper:{hp:3.2,attack:1.6,period:3600},puppeteer:{hp:.7,attack:0,period:4800}}[role];
 return {maxHp:Math.round(hp*tuning.hp),attack:attack*tuning.attack,period:tuning.period};
}
export function puppetLook(role:PuppetRole){
 if(role==='puppeteer')return {name:'カボチャ頭の少女',asset:'/enemies/masked-pumpety.png',scale:.82};
 if(role==='puppet')return {name:'小さな人形',asset:'/enemies/mountain-puppet.png',scale:.72};
 return {name:'運搬用ゴーレム',asset:'/enemies/cargo-golem.png',scale:1.3};
}
export function puppetCue(enemy:Enemy,now:number){
 if(enemy.hp<=0||!enemy.role||enemy.nextAt-now>1000||enemy.nextAt<now)return '';
 if(enemy.role==='puppeteer')return 'もう一回なのよ！';
 if(enemy.role==='golem')return '腕を振り上げる…';
 return enemy.role==='sweeper'?'両腕を広げる…':'';
}
// Once the actors stop, their master withdraws; she is not killed or recruited.
export function withdrawPuppeteer(enemies:Enemy[]){
 const master=enemies.find(enemy=>enemy.role==='puppeteer');
 if(master&&!enemies.some(enemy=>enemy.role!=='puppeteer'&&enemy.hp>0))master.hp=0;
}

export function puppetBattleName(id:string,node:number,nodes:number){
 if(nodes!==3)return null;
 if(id==='begging-golem')return ['荷物へ忍び寄る人形','おねだりする運搬用ゴーレム','大小の人形'][node];
 if(id==='sweet-blockade')return ['荷物を囲む二体の人形','通せんぼする大小の人形','カボチャ頭の少女と大小の人形'][node];
 return null;
}
