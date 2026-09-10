import {z} from 'zod';
import {heroes,quests,type State} from './game.ts';
const n=z.number().finite().min(0).max(1e15),count=n.int(),id=z.string().uuid();
const hero=z.string().refine(v=>heroes.some(h=>h.id===v));
const uniqueHeroes=z.array(hero).min(1).max(8).refine(v=>new Set(v).size===v.length);
const event=z.object({id:z.string().max(180),at:n,kind:z.enum(['hit','gather','hurt','heal','clear','move','rest','assist']),text:z.string().max(300),amount:n.optional(),hero:hero.optional()});
const run=z.object({quest:z.string().refine(v=>quests.some(q=>q.id===v)),round:count.min(1),node:count.max(2),phase:z.enum(['move','work','rest']),phaseAt:n,nextAt:n,started:n,hp:n,maxHp:n.min(1),target:n,targetMax:n.min(1),hits:count,energy:n,energyAt:n,events:z.array(event).max(12),enemyAt:n,actors:z.array(z.object({hero,arrivesAt:n,nextAt:n,period:n.min(200).max(5000)})).min(1).max(8)});
const keyedNumbers=z.record(z.string().regex(/^[a-z][a-z0-9_-]{0,40}$/),n);
const stateSchema=z.object({version:z.literal(3),gold:n,herbs:n,ore:n,owned:uniqueHeroes,xp:keyedNumbers,gear:count.max(15),camp:count.max(10),clears:count,done:keyedNumbers,claimed:z.array(z.string().max(100)).max(100),lastDaily:z.string().max(10),updatedAt:n,squads:z.array(z.object({id:z.string().regex(/^party-[1-3]$/),name:z.string().min(1).max(40),members:uniqueHeroes,repeat:z.boolean(),run:run.nullable()})).min(1).max(3),log:z.array(z.object({text:z.string().max(500),at:n})).max(40),receipts:z.array(z.string().max(100)).max(64)}).superRefine((s,ctx)=>{
 const members=s.squads.flatMap(q=>q.members);
 if(new Set(members).size!==members.length||members.some(v=>!s.owned.includes(v))||new Set(s.squads.map(q=>q.id)).size!==s.squads.length)ctx.addIssue({code:'custom',message:'Invalid party'});
 for(const sq of s.squads){const r=sq.run;if(r&&(r.nextAt<s.updatedAt||r.actors.length!==sq.members.length||new Set(r.actors.map(a=>a.hero)).size!==sq.members.length||r.actors.some(a=>!sq.members.includes(a.hero)||r.phase!=='rest'&&a.nextAt<r.nextAt)||r.enemyAt<r.nextAt&&r.phase!=='rest'))ctx.addIssue({code:'custom',message:'Invalid timeline'});}
});
export type Profile={id:string;name:string;test:boolean;state:State};
export type SaveBundle={format:3;deviceId:string;active:string;profiles:Profile[];serial:number;sound:boolean;cloudAt:number;legacyImported:boolean};
export const bundleSchema=z.object({format:z.literal(3),deviceId:id,active:id,profiles:z.array(z.object({id,name:z.string().min(1).max(50),test:z.boolean(),state:stateSchema})).min(1).max(12),serial:count,sound:z.boolean(),cloudAt:n,legacyImported:z.boolean()}).refine(b=>new Set(b.profiles.map(p=>p.id)).size===b.profiles.length&&b.profiles.some(p=>p.id===b.active));
export function parseBundle(raw:unknown):SaveBundle {const result=bundleSchema.safeParse(raw);if(!result.success)throw Error('冒険の記録を読み取れません。STARLIT GUILD のセーブファイルを選んでください。');return result.data;}
