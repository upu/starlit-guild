import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState,act,settle,heroes,quests,recruitmentQuests,allQuests,targetName} from '../lib/game.ts';
import {recruitments,met,prepared,rareProgress,canPrepare,recruitmentNeeds} from '../lib/recruitment.ts';
import {availableStories,journeyBanter} from '../lib/stories.ts';
import {parseBundle} from '../lib/save-format.ts';
import {nextGoal,journeyNotice} from '../lib/journey.ts';

function bundle(s){const id=crypto.randomUUID();return {format:4,deviceId:crypto.randomUUID(),active:id,profiles:[{id,name:'出会いの旅',test:false,state:s}],serial:1,sound:false,cloudAt:0,legacyImported:true};}
const restore=s=>parseBundle(JSON.parse(JSON.stringify(bundle(s)))).profiles[0].state;
function supplied(r){const s=initialState(1000);s.clears=Math.max(60,r.unlock);s.owned=heroes.filter(h=>h.id!==r.hero).map(h=>h.id);s.squads[0].members=['aria','leon'];s.xp.aria=s.xp.leon=30*19**2;s.gear=10;s.town=2;for(const key of ['gold','wood','herbs','ore'])s[key]=r.cost[key]+200;s.done[r.rare.sources[0]]=r.rare.every*r.rare.count;return s;}
function finish(s){let i=0;while(s.squads[0].run&&i++<20000)s=settle(s,s.squads[0].run.nextAt).state;assert.ok(i<20000,'expedition must finish');return s;}

test('seven distinct arcs each have an accessible material source and playable mission',()=>{
 assert.equal(recruitments.length,7);assert.equal(recruitmentQuests.length,7);assert.equal(quests.length,20);
 assert.equal(new Set(allQuests.map(q=>q.id)).size,27);
 for(const r of recruitments){assert.ok(r.rare.sources.some(id=>quests.find(q=>q.id===id).unlock<=r.unlock));assert.ok(allQuests.some(q=>q.companion===r.hero));const s=supplied(r);assert.ok(met(s,r));assert.ok(canPrepare(s,r));}
});

test('gold alone never buys a hero or skips their materials and encounter',()=>{
 const s=initialState(1000);s.gold=100000;
 assert.throws(()=>act(s,{type:'recruit',id:'mira'},1000),/専用クエスト/);
 assert.throws(()=>act(s,{type:'prepareRecruitment',id:'mira'},1000));
 s.clears=60;s.wood=s.herbs=s.ore=10000;
 assert.throws(()=>act(s,{type:'prepareRecruitment',id:'mira'},1000));
 assert.throws(()=>act(s,{type:'start',id:'join-mira'},1000));
 const finn=supplied(recruitments.find(r=>r.hero==='finn'));finn.owned=finn.owned.filter(id=>id!=='mira');
 assert.ok(!met(finn,recruitments.find(r=>r.hero==='finn')));assert.ok(!canPrepare(finn,recruitments.find(r=>r.hero==='finn')));
 assert.deepEqual(s.owned,['aria','leon']);
});

test('rare materials have guaranteed thresholds, combine sources, and survive old-save import',()=>{
 const r=recruitments.find(r=>r.hero==='finn'),s=initialState(1000);delete s.recruitment;
 s.done={cart:r.rare.every-2,slime:1,herbs:100};assert.equal(rareProgress(s,r).held,0);assert.equal(rareProgress(s,r).next,1);
 s.done.slime=2;assert.equal(rareProgress(s,r).held,1);
 s.done.slime=100;assert.equal(rareProgress(s,r).held,r.rare.count);assert.equal(rareProgress(s,r).remaining,0);
 const before=structuredClone(s);assert.deepEqual(rareProgress(restore(s),r),rareProgress(s,r));assert.deepEqual(s,before);
});

test('preparation consumes the exact recipe once without joining, and read/skipped stories cost nothing',()=>{
 const r=recruitments[0],s=supplied(r),before=structuredClone(s);
 const read=act(s,{type:'readStory',id:'recruit-mira-meeting'},1000);
 for(const key of ['gold','wood','herbs','ore'])assert.equal(read[key],s[key]);
 const p=act(read,{type:'prepareRecruitment',id:'mira'},1000);
 for(const key of ['gold','wood','herbs','ore'])assert.equal(p[key],s[key]-r.cost[key]);
 assert.deepEqual(s,before);assert.ok(!p.owned.includes('mira'));assert.ok(prepared(p,'mira'));assert.equal(rareProgress(p,r).held,0);
 assert.throws(()=>act(p,{type:'prepareRecruitment',id:'mira'},1000));
 assert.deepEqual(restore(p).recruitment,p.recruitment);
 assert.ok(availableStories(p).some(st=>st.id==='recruit-mira-prepared'));
 assert.ok(!availableStories(p).some(st=>st.id==='recruit-mira-joined'));
 assert.match(journeyNotice(read,p).title,/支度/);assert.match(nextGoal(p).title,/専用クエスト/);
});

test('insufficient materials reject atomically without partial payment',()=>{
 for(const r of recruitments)for(const need of recruitmentNeeds(supplied(r),r)){
  const s=supplied(r);if(need.key===r.rare.id)s.done[r.rare.sources[0]]=r.rare.every*r.rare.count-1;else s[need.key]=need.need-1;
  const before=structuredClone(s);assert.throws(()=>act(s,{type:'prepareRecruitment',id:r.hero},1000));assert.deepEqual(s,before);
 }
});

test('preparation reveals an interlude at the halfway milestone without spending items',()=>{
 const r=recruitments.find(r=>r.hero==='finn'),s=supplied(r),half=Math.ceil(r.rare.count/2)*r.rare.every;
 s.done[r.rare.sources[0]]=half-1;assert.ok(!availableStories(s).some(st=>st.id==='recruit-finn-progress'));
 s.done[r.rare.sources[0]]=half;const before=structuredClone(s);assert.ok(availableStories(s).some(st=>st.id==='recruit-finn-progress'));
 assert.deepEqual(s,before);assert.ok(!s.owned.includes('finn'));assert.ok(!prepared(s,'finn'));
});

test('every dedicated quest joins the intended hero once and returns despite repeat being enabled',()=>{
 for(const r of recruitments){
  let s=act(supplied(r),{type:'prepareRecruitment',id:r.hero},1000);
  s=act(s,{type:'start',id:'join-'+r.hero},1000);const start=structuredClone(s);assert.equal(s.squads[0].repeat,true);
  assert.ok(journeyBanter(s,s.squads[0],2000).some(line=>line.speaker===r.hero));
  s=finish(s);assert.equal(s.squads[0].run,null);assert.equal(s.squads[0].repeat,true);
  assert.equal(s.owned.filter(id=>id===r.hero).length,1);assert.equal(s.done['join-'+r.hero],1);
  assert.deepEqual(s.squads[0].members,start.squads[0].members);assert.equal(s.xp[r.hero],0);
  assert.ok(availableStories(s).some(st=>st.id==='recruit-'+r.hero+'-joined'));
  assert.deepEqual(restore(s),s);assert.throws(()=>act(s,{type:'start',id:'join-'+r.hero},s.updatedAt));
  assert.match(journeyNotice(start,s).title,new RegExp(r.name));
 }
});

test('retreat and retry keep the paid unlock, and checkpoints do not join the hero early',()=>{
 let s=act(supplied(recruitments[0]),{type:'prepareRecruitment',id:'mira'},1000);s=act(s,{type:'start',id:'join-mira'},1000);
 while(s.squads[0].run.node<3)s=settle(s,s.squads[0].run.nextAt).state;
 assert.ok(!s.owned.includes('mira'));assert.ok(!s.done['join-mira']);
 s=act(s,{type:'stop'},s.updatedAt);const saved=restore(s),resources=['gold','wood','ore','herbs'].map(key=>saved[key]);
 s=act(saved,{type:'start',id:'join-mira'},saved.updatedAt);assert.deepEqual(['gold','wood','ore','herbs'].map(key=>s[key]),resources);
 assert.ok(finish(s).owned.includes('mira'));
});

test('one mission cannot run in two squads, and malformed active missions cannot be imported',()=>{
 let s=act(supplied(recruitments[0]),{type:'prepareRecruitment',id:'mira'},1000);
 s.squads.push({id:'party-2',name:'もうひとつの隊',members:['garr','finn'],repeat:true,run:null});
 s=act(s,{type:'start',id:'join-mira'},1000);
 assert.throws(()=>act(s,{type:'start',id:'join-mira',squad:'party-2'},1000));assert.doesNotThrow(()=>restore(s));
 const bad=structuredClone(s);bad.recruitment.prepared=[];assert.throws(()=>restore(bad));
 const duplicate=structuredClone(s);duplicate.recruitment.prepared=['mira','mira'];assert.throws(()=>restore(duplicate));
});

test('offline completion, multiple squads and repeated settlement preserve one join and rare progress',()=>{
 let s=act(supplied(recruitments[0]),{type:'prepareRecruitment',id:'mira'},1000);
 s.squads.push({id:'party-2',name:'素材の隊',members:['garr','finn'],repeat:true,run:null});
 s=act(s,{type:'start',id:'join-mira'},1000);s=act(s,{type:'start',id:'cart',squad:'party-2'},1000);
 const bulk=settle(s,601000).state;let frames=s;
 for(let now=1200;now<=601000;now+=200)frames=settle(frames,now).state;
 for(const key of ['owned','done','gold','herbs','ore','wood','xp','friendship','recruitment','squads'])assert.deepEqual(bulk[key],frames[key],key);
 for(const r of recruitments)assert.deepEqual(rareProgress(bulk,r),rareProgress(frames,r));
 assert.equal(bulk.squads[0].run,null);assert.ok(bulk.squads[1].run);assert.equal(bulk.done['join-mira'],1);
 assert.deepEqual(settle(bulk,601000).state,bulk);assert.doesNotThrow(()=>restore(bulk));
});

test('older recruited heroes stay owned and new fields are optional',()=>{
 const s=initialState(1000);delete s.recruitment;delete s.story;s.owned=heroes.map(h=>h.id);s.done={herbs:12};s.clears=70;
 const restored=restore(s);assert.deepEqual(restored.owned,s.owned);assert.equal(restored.recruitment,undefined);
 assert.ok(availableStories(restored).some(st=>st.id==='recruit-noel-joined'));
 assert.throws(()=>act(restored,{type:'prepareRecruitment',id:'noel'},1000));
 const regular=act(restored,{type:'start',id:'herbs'},1000);assert.doesNotThrow(()=>restore(regular));
});

test('new mission targets and save clocks remain valid at every location including offline cap',()=>{
 for(const r of recruitments){let s=act(supplied(r),{type:'prepareRecruitment',id:r.hero},1000);s=act(s,{type:'start',id:'join-'+r.hero},1000);const visited=new Set();
  for(let i=0;s.squads[0].run&&i<20000;i++){const run=s.squads[0].run;if(!visited.has(run.node)){visited.add(run.node);assert.ok(targetName(allQuests.find(q=>q.id===run.quest),run.node));assert.doesNotThrow(()=>restore(s));}s=settle(s,run.nextAt).state;}
  assert.equal(visited.size,15);assert.ok(s.owned.includes(r.hero));assert.doesNotThrow(()=>restore(settle(s,s.updatedAt+86400000).state));
 }
});
