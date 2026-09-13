import {z} from 'zod';
import {parseBundle as parseV3} from './save-format-v3.ts';
import {heroes,allQuests as quests,migrate,type State} from './game.ts';
import {stories} from './stories.ts';
import {recruitments} from './recruitment.ts';
import {isRecord} from './external-input.ts';
import {equipmentById,validInventory} from './equipment.ts';
const n=z.number().finite().min(0).max(1e15),count=n.int(),id=z.string().uuid();
const hero=z.string().refine(v=>heroes.some(h=>h.id===v));
const uniqueHeroes=z.array(hero).min(1).max(heroes.length).refine(v=>new Set(v).size===v.length);
const event=z.object({id:z.string().max(180),at:n,kind:z.enum(['hit','gather','hurt','heal','clear','move','rest','assist','skill','combo','burst','discovery']),text:z.string().max(300),amount:n.optional(),hero:hero.optional(),target:hero.optional()});
const health=z.record(hero,z.object({hp:n,maxHp:n.min(1)}));
const run=z.object({serial:count,nodes:count.min(3).max(15),cheer:n.max(100),ward:n,comboAt:n,detour:z.object({node:count.max(14),kind:z.enum(['chest','herb','spirit']),hero,at:n,finishAt:n,claimed:z.boolean()}).nullable(),scene:z.object({title:z.string().max(100),lines:z.array(z.string().max(200)).max(8),at:n,kind:z.enum(['combo','burst'])}).nullable(),quest:z.string().refine(v=>quests.some(q=>q.id===v)),round:count.min(1),node:count.max(14),phase:z.enum(['move','work','rest']),phaseAt:n,nextAt:n,started:n,health,target:n,targetMax:n.min(1),hits:count,energy:n,energyAt:n,events:z.array(event).max(12),enemyAt:n,actors:z.array(z.object({hero,actions:count,arrivesAt:n,nextAt:n,period:n.min(200).max(5000)})).min(1).max(8)});
const keyedNumbers=z.record(z.string().regex(/^[a-z][a-z0-9_-]{0,40}$/),n);
const storyQuest=z.string().refine(v=>quests.some(q=>q.id===v));
const storyIds=z.array(z.string().refine(v=>stories.some(st=>st.id===v))).max(stories.length).refine(v=>new Set(v).size===v.length);
const storyQuests=z.array(storyQuest).max(quests.length).refine(v=>new Set(v).size===v.length);
const storySchema=z.object({departed:storyQuests,completed:storyQuests,read:storyIds}).refine(v=>v.completed.every(q=>v.departed.includes(q)));
const equipmentId=z.string().refine(id=>!!equipmentById(id));
const inventorySchema=z.object({items:z.record(equipmentId,count.max(9999)),equipped:z.record(hero,z.object({weapon:equipmentId.optional(),armor:equipmentId.optional()}).strict())});
type ParsedState=z.infer<typeof stateBase>;
type ParsedSquad=ParsedState['squads'][number];
function validActors(squad:ParsedSquad){
 const run=squad.run;if(!run)return true;
 if(run.actors.length!==squad.members.length)return false;
 if(new Set(run.actors.map(actor=>actor.hero)).size!==squad.members.length)return false;
 const healthIds=Object.keys(run.health);if(healthIds.length!==squad.members.length||healthIds.some(id=>!squad.members.includes(id)))return false;
 if(Object.values(run.health).some(value=>value.hp>value.maxHp))return false;
 return run.actors.every(actor=>squad.members.includes(actor.hero)&&(run.phase==='rest'||actor.nextAt>=run.nextAt));
}
function validTimeline(squad:ParsedSquad,updatedAt:number){
 const run=squad.run;if(!run)return true;
 if(run.node>=run.nodes||run.nextAt<updatedAt)return false;
 if(run.phase!=='rest'&&run.comboAt<run.nextAt)return false;
 if(run.phase!=='rest'&&run.detour&&!run.detour.claimed&&run.detour.finishAt<run.nextAt)return false;
 if(run.phase!=='rest'&&run.enemyAt<run.nextAt)return false;
 return validActors(squad);
}
function validateState(s:ParsedState,ctx:z.RefinementCtx){
 if(s.inventory&&!validInventory(s.inventory,s.owned))ctx.addIssue({code:'custom',message:'Invalid equipment ownership'});
 const members=s.squads.flatMap(squad=>squad.members),missions=s.squads.flatMap(squad=>squad.run?.quest.startsWith('join-')?[squad.run.quest]:[]);
 if(new Set(missions).size!==missions.length||missions.some(id=>!s.recruitment?.prepared.includes(id.slice(5))||s.owned.includes(id.slice(5))))ctx.addIssue({code:'custom',message:'Invalid recruitment expedition'});
 if(new Set(members).size!==members.length||members.some(member=>!s.owned.includes(member))||new Set(s.squads.map(squad=>squad.id)).size!==s.squads.length)ctx.addIssue({code:'custom',message:'Invalid party'});
 if(s.squads.some(squad=>!validTimeline(squad,s.updatedAt)))ctx.addIssue({code:'custom',message:'Invalid timeline'});
}
const stateBase=z.object({version:z.literal(4),prologue:z.boolean().optional(),inventory:inventorySchema.optional(),recruitment:z.object({prepared:z.array(z.string().refine(id=>recruitments.some(r=>r.hero===id))).max(recruitments.length).refine(ids=>new Set(ids).size===ids.length)}).optional(),story:storySchema.optional(),wood:n,town:count.max(2),friendship:keyedNumbers,discoveries:count,gold:n,herbs:n,ore:n,owned:uniqueHeroes,xp:keyedNumbers,gear:count.max(15),camp:count.max(10),clears:count,done:keyedNumbers,claimed:z.array(z.string().max(100)).max(100),lastDaily:z.string().max(10),updatedAt:n,squads:z.array(z.object({id:z.string().regex(/^party-[1-3]$/),name:z.string().min(1).max(40),members:uniqueHeroes,repeat:z.boolean(),run:run.nullable(),lastQuest:z.string().refine(id=>quests.some(q=>q.id===id)).optional()})).min(1).max(3),log:z.array(z.object({text:z.string().max(500),at:n})).max(40),receipts:z.array(z.string().max(100)).max(64)});
const stateSchema=stateBase.superRefine(validateState);
export type Profile={id:string;name:string;test:boolean;state:State};
export type SaveBundle={format:4;deviceId:string;active:string;profiles:Profile[];serial:number;sound:boolean;cloudAt:number;legacyImported:boolean};
export const bundleSchema=z.object({format:z.literal(4),deviceId:id,active:id,profiles:z.array(z.object({id,name:z.string().min(1).max(50),test:z.boolean(),state:stateSchema})).min(1).max(12),serial:count,sound:z.boolean(),cloudAt:n,legacyImported:z.boolean()}).refine(b=>new Set(b.profiles.map(p=>p.id)).size===b.profiles.length&&b.profiles.some(p=>p.id===b.active));
function upgradeCurrentBundle(raw:unknown):unknown{
 if(!isRecord(raw)||raw.format!==4||!Array.isArray(raw.profiles))return raw;
 const profiles:unknown[]=raw.profiles;
 return {...raw,profiles:profiles.map((profile:unknown):unknown=>{if(!isRecord(profile)||!isRecord(profile.state))return profile;const state=profile.state;if(state.version!==4||typeof state.updatedAt!=='number')return profile;try{return {...profile,state:migrate(state as Parameters<typeof migrate>[0],state.updatedAt)};}catch{return profile;}})};
}
export function parseBundle(raw:unknown):SaveBundle {if(raw&&typeof raw==='object'&&'format' in raw&&raw.format===3){const old=parseV3(raw);return {...old,format:4,profiles:old.profiles.map(p=>({...p,state:migrate(p.state,p.state.updatedAt)}))};}const result=bundleSchema.safeParse(upgradeCurrentBundle(raw));if(!result.success)throw Error('冒険の記録を読み取れません。STARLIT GUILD のセーブファイルを選んでください。');return result.data;}
