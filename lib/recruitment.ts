import type {State, Quest} from './game.ts';

export type RecruitmentProgress={prepared:string[]};
export type Recruitment={hero:string;name:string;unlock:number;requires?:string;request:string;purpose:string;cost:{gold:number;wood:number;herbs:number;ore:number};rare:{id:string;name:string;description:string;sources:string[];every:number;count:number};mission:Pick<Quest,'name'|'kind'|'region'|'desc'|'tier'|'need'|'enemy'>&{background:string;gatherTarget:string;escortTarget:string}};
export const recruitments:Recruitment[]=([
 {hero:'chacha',name:'チャチャ',unlock:6,request:'お茶が冷める前に',purpose:'山の茶屋へ茶葉を届ける支度。大剣は本人が持つ。茶器は割れないよう旅団が運ぶ。',cost:{gold:450,wood:60,herbs:100,ore:25},
  rare:{id:'tea-bud',name:'山霧の茶芽',description:'薬草の群生地や街道の茶畑で分けてもらえる、香りのよい茶芽。',sources:['herbs','cart'],every:3,count:4},
  mission:{name:'天使は岩を持ち上げる',kind:'護衛',region:'山の茶屋への坂道',desc:'茶器を守ってチャチャと山道へ。岩も魔物も大剣でどかすが、お茶の時間だけは急がない。',tier:1,need:52,enemy:8,background:'/valley.png',gatherTarget:'お茶に使う湧き水',escortTarget:'茶器を割らずに茶屋へ'}},
 {hero:'mira',name:'ミラ',unlock:3,request:'帰り道にも、お茶を',purpose:'夜の往診に使う薬と、山小屋へ運ぶ湯沸かし道具をそろえる。',cost:{gold:180,wood:40,herbs:80,ore:0},
  rare:{id:'moon-petal',name:'夜露の花弁',description:'月しずく草の群生地で少しずつ見つかる、熱を鎮める花弁。',sources:['herbs'],every:4,count:3},
  mission:{name:'夜明けを待つ往診',kind:'護衛',region:'薬灯りの山道',desc:'ひとりで往診を続けるミラと、山小屋の患者へ薬を届ける。帰り道は、彼女にも休んでもらおう。',tier:1,need:45,enemy:8,background:'/forest.png',gatherTarget:'煎じ薬の材料',escortTarget:'ミラと薬を山小屋へ'}},
 {hero:'finn',name:'フィン',unlock:8,requires:'mira',request:'売れない宝物',purpose:'古い鍵を直す道具と、崩れた街道を調べる足場を用意する。',cost:{gold:1800,wood:200,herbs:60,ore:120},
  rare:{id:'brass-tooth',name:'真鍮の鍵片',description:'街道や畑に散った、小さな宝箱の鍵の欠片。',sources:['cart','slime'],every:8,count:8},
  mission:{name:'小箱を持ち主のもとへ',kind:'討伐',region:'忘れ物の旧街道',desc:'フィンの探す宝箱は、村の子がなくしたオルゴールだった。魔物のいる旧街道を一緒に探す。',tier:1,need:65,enemy:8,background:'/forest.png',gatherTarget:'小箱の手がかり',escortTarget:'小箱を村へ届ける'}},
 {hero:'garr',name:'ガル',unlock:16,requires:'finn',request:'盾の向こうの手仕事',purpose:'壊れた橋を渡す木材と、避難した人たちの装備を直す道具をそろえる。',cost:{gold:24000,wood:2400,herbs:800,ore:2800},
  rare:{id:'silver-rivet',name:'銀鉄の留め具',description:'洞窟や渓谷で回収できる、橋の補強に耐える古い留め具。',sources:['crystal','wolf'],every:12,count:18},
  mission:{name:'最後のひとりが渡るまで',kind:'護衛',region:'渓谷の吊り橋',desc:'橋を守り続けるガルを手伝い、旅人を向こう岸へ。最後に渡る彼の荷物は、今度はこちらが持つ。',tier:2,need:100,enemy:9,background:'/valley.png',gatherTarget:'橋の補修材',escortTarget:'旅人を橋の向こうへ'}},
 {hero:'luna',name:'ルナ',unlock:24,requires:'garr',request:'星の話を、最後まで',purpose:'古い観測器を修理し、観測所で夜を明かすための支度をする。',cost:{gold:80000,wood:5000,herbs:4000,ore:12000},
  rare:{id:'star-prism',name:'星映しの結晶',description:'青晶石と山頂の祠に残る、かすかな星明かりを映す結晶。',sources:['crystal','pilgrim'],every:16,count:32},
  mission:{name:'消えた星座の観測所',kind:'採取',region:'星待ちの観測所',desc:'観測所に残った星図をルナと探す。観測が終わるまで、その話を聞く人がそばにいる。',tier:2,need:125,enemy:9,background:'/cave.png',gatherTarget:'散らばった星図',escortTarget:'観測器を運ぶ'}},
 {hero:'poppy',name:'ポピー',unlock:35,requires:'luna',request:'今度こそ、やさしい薬',purpose:'薬草園を立て直す土と木枠、試作を重ねる薬草をそろえる。',cost:{gold:320000,wood:18000,herbs:25000,ore:4000},
  rare:{id:'amber-seed',name:'琥珀の種',description:'千年樹の花のそばに眠る、荒れた土を癒やす種。',sources:['blossom'],every:20,count:36},
  mission:{name:'枯れない庭の作り方',kind:'採取',region:'樹海の小さな薬草園',desc:'失敗を笑い飛ばすポピーと、枯れた薬草園を再生する。仲間に渡す薬だけは、妥協できない。',tier:3,need:180,enemy:9,background:'/forest.png',gatherTarget:'庭を癒やす薬草',escortTarget:'苗を薬草園へ'}},
 {hero:'noel',name:'ノエル',unlock:50,requires:'poppy',request:'歌の中の、空いた席',purpose:'祭りで使う小さな舞台と、旅先で傷んだ楽器を修理する。',cost:{gold:800000,wood:30000,herbs:8000,ore:36000},
  rare:{id:'faded-score',name:'星祭りの古譜',description:'巡礼者や祭りの道に残された、忘れられた歌の譜面。',sources:['royal','pilgrim'],every:24,count:48},
  mission:{name:'まだ名前のない旅の歌',kind:'護衛',region:'灯りをつなぐ祭り道',desc:'古い歌をノエルと祭りへ届ける。旅団の歌に足りないのは、歌い手自身の名前だった。',tier:3,need:210,enemy:9,background:'/valley.png',gatherTarget:'歌の断片',escortTarget:'ノエルと楽器を祭りへ'}},
] satisfies Recruitment[]).sort((a,b)=>a.unlock-b.unlock);
export const recruitmentByHero=(id:string)=>recruitments.find(r=>r.hero===id);
export const recruitmentByQuest=(id:string)=>recruitments.find(r=>'join-'+r.hero===id);
export const prepared=(s:State,id:string)=>s.owned.includes(id)||!!s.recruitment?.prepared.includes(id);
export const met=(s:State,r:Recruitment)=>s.owned.includes(r.hero)||s.clears>=r.unlock&&(!r.requires||s.owned.includes(r.requires));

// Rare quest items have one purpose. Completed quests are the durable collection ledger;
// preparation records consumption once. This also credits earlier adventures and offline runs.
export function rareProgress(s:State,r:Recruitment){
 const visits=r.rare.sources.reduce((sum,id)=>sum+(s.done[id]||0),0),spent=prepared(s,r.hero);
 const found=Math.min(r.rare.count,Math.floor(visits/r.rare.every));
 return {visits,found,held:spent?0:found,spent,remaining:spent?0:Math.max(0,r.rare.count*r.rare.every-visits),next:spent||found>=r.rare.count?0:r.rare.every-visits%r.rare.every};
}
export function recruitmentNeeds(s:State,r:Recruitment){
 const items=([['gold','G'],['wood','木材'],['herbs','薬草'],['ore','鉱石']] as const).map(([key,label])=>({key,label,have:s[key],need:r.cost[key]})).filter(i=>i.need>0);
 return [...items,{key:r.rare.id,label:r.rare.name,have:rareProgress(s,r).held,need:r.rare.count}];
}
export const canPrepare=(s:State,r:Recruitment)=>met(s,r)&&!prepared(s,r.hero)&&recruitmentNeeds(s,r).every(i=>i.have>=i.need);
export const recruitmentRun=(s:State,id:string)=>s.squads.find(sq=>sq.run?.quest==='join-'+id);
export function recruitmentHint(s:State,r:Recruitment){
 if(s.owned.includes(r.hero))return '旅団の仲間になりました';
 if(r.requires&&!s.owned.includes(r.requires))return `${String(recruitmentByHero(r.requires)?.name)}が仲間になると、出会いがつながります`;
 if(s.clears<r.unlock)return `あと ${String(r.unlock-s.clears)} 件の依頼で出会えます`;
 if(recruitmentRun(s,r.hero))return '専用クエストを冒険中';
 if(prepared(s,r.hero))return '支度はできました。専用クエストへ出発できます';
 if(canPrepare(s,r))return '支度がそろいました。専用クエストを開けます';
 const rare=rareProgress(s,r);
 return rare.remaining?`${r.rare.name}を集めよう。対象の依頼をあと ${String(rare.remaining)} 回`:'希少素材はそろいました。残りの資材を集めよう';
}
