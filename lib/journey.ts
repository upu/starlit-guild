import {recruitments,met,prepared,canPrepare,rareProgress,recruitmentHint,recruitmentRun} from './recruitment.ts';
import {inPrologue,isPrologueQuest,nextStage,stageEndingPending,prologueStages} from './prologue.ts';
import {storyProgress,availableStories} from './stories.ts';
import {heroes,quests,level,stats,power,activeBonds,estimate,squadLimit,type State,type Squad,type Quest} from './game.ts';

export type Destination='adventure'|'quests'|'recruit'|'build'|'companions'|'party';
export type JourneyGoal={hintId?:string;title:string;detail:string;action:string;destination:Destination;questId?:string};
export function journeyHintKey(goal:JourneyGoal){return goal.hintId||[goal.destination,goal.questId||'',goal.title].join(':');}
export function buildingCost(town:number){return town===0?{gold:120,wood:12,ore:0,herbs:0,clears:1}:{gold:600,wood:60,ore:12,herbs:20,clears:3};}
export function buildingNeeds(s:State){const cost=buildingCost(s.town);return ([['gold','G'],['wood','木材'],['ore','鉱石'],['herbs','薬草']] as const).filter(([key])=>s[key]<cost[key]).map(([key,label])=>key==='gold'?`${String(cost[key]-s[key])} G`:`${label} ${String(cost[key]-s[key])}個`);}
export function canBuild(s:State){return s.town<2&&s.clears>=buildingCost(s.town).clears&&!buildingNeeds(s).length;}

function prologueGoal(s:State,sq:Squad):JourneyGoal{
 if(sq.run)return {title:'タップでふたりを手助け',detail:'道や荷物・魔物をタップすると手助けできます。仲間をタップすると回復。見守っていても進みます。',action:'冒険を見守る',destination:'adventure'};
 if(stageEndingPending(s))return {title:'達成後のひと幕',detail:'クエストクリアの表示から、ふたりの話の続きを読みましょう。',action:'物語へ',destination:'adventure'};
 const stage=nextStage(s),complete=!!s.done[stage.quest];
 return {title:complete?'第一部 完 · ふたりの旅を振り返ろう':stage.label+' · '+stage.title,detail:complete?'塔の灯りが、いつもの道に戻りました。ここまでの道をもう一度歩いたり、手帳で思い出や絵を振り返れます。':'画面上部の巻物から行先を選び、待機画面の「出発」で出かけましょう。',action:'クエストを開く',destination:'quests',questId:stage.quest};
}
function firstGoal(sq:Squad):JourneyGoal{
 if(!sq.run)return {title:'ふたりの冒険を始めよう',detail:'「クエスト」から依頼を選ぶと、アリアとレオンが歩き始めます。操作しなくても冒険は進みます。まずは最初の依頼を1件達成しましょう。',action:'クエストを開く',destination:'quests'};
 if(sq.run.phase==='rest')return {title:'回復で、もう一度出発',detail:'体力がなくなると休憩します。マップをタップすると回復して立て直せます。見守っていても自動で再挑戦します。',action:'冒険を見守る',destination:'adventure'};
 if(sq.run.node>=3)return {title:'最初の報酬を確保！ 次は酒場へ',detail:'3地点ごとの報酬は、途中で帰還しても残ります。15地点を進んで依頼を達成すると、集めた木材とお金で酒場を建てられます。',action:'冒険を見守る',destination:'adventure'};
 if(sq.run.cheer>0||sq.run.scene?.kind==='burst')return {title:'応援が届いた！ あとは見守っても大丈夫',detail:'応援が100になると全員必殺技。光る寄り道も仲間が自動で調べます。3地点進むと最初の区間報酬を持ち帰れます。',action:'冒険を見守る',destination:'adventure'};
 return {title:'マップをタップして手助けしよう',detail:'マップの空いているところや敵・素材をタップすると手助け、仲間やHP表示をタップすると回復できます。回数制限はありません。何も押さずに見守っても、報酬を集められます。',action:'冒険を見守る',destination:'adventure'};
}
function recruitTitle(s:State,recruit:(typeof recruitments)[number]){
 if(recruitmentRun(s,recruit.hero))return recruit.name+'との専用クエストを冒険中';
 if(prepared(s,recruit.hero))return recruit.name+'と専用クエストへ';
 if(canPrepare(s,recruit))return recruit.name+'の支度がそろいました';
 return recruit.name+'の話を聞いてみよう';
}
function activeRecruitGoal(s:State,recruit:(typeof recruitments)[number]):JourneyGoal|null{
 const unread=!storyProgress(s).read.includes('recruit-'+recruit.hero+'-meeting');
 if(!prepared(s,recruit.hero)&&!canPrepare(s,recruit)&&!unread)return null;
 return {title:recruitTitle(s,recruit),detail:recruitmentHint(s,recruit)+'。'+recruit.purpose,action:'出会いを見る',destination:'recruit'};
}
function progressRecruitGoal(s:State,recruit:(typeof recruitments)[number]):JourneyGoal|null{
 const progressId='recruit-'+recruit.hero+'-progress';
 if(!availableStories(s).some(story=>story.id===progressId)||storyProgress(s).read.includes(progressId))return null;
 return {title:recruit.name+'から、支度の途中の話',detail:'集めているものを届けるうちに、少し違う一面が見えてきました。',action:'話を読む',destination:'recruit'};
}
function unlockGoal(s:State):JourneyGoal|null{
 const nextQuest=quests.find(quest=>quest.unlock>s.clears),nextHero=heroes.find(hero=>!s.owned.includes(hero.id)&&hero.unlock>s.clears);
 if(nextHero&&(!nextQuest||nextHero.unlock<nextQuest.unlock))return {hintId:'next-hero-'+nextHero.id,title:`あと ${String(nextHero.unlock-s.clears)} 件で${nextHero.name}と出会えます`,detail:'依頼を最後まで達成すると、新しい出会いに近づきます。自動周回でも進められます。',action:'依頼を見る',destination:'quests'};
 if(nextQuest)return {hintId:'next-quest-'+nextQuest.id,title:`あと ${String(nextQuest.unlock-s.clears)} 件で新しい依頼`,detail:`次の行き先は${nextQuest.region}。仲間の得意分野に合う依頼で支度を進めましょう。`,action:'依頼を見る',destination:'quests'};
 return null;
}
function recruitmentGoal(s:State,recruit:(typeof recruitments)[number]|undefined){
 if(!recruit)return null;
 return activeRecruitGoal(s,recruit)??progressRecruitGoal(s,recruit);
}
function establishedGoal(s:State):JourneyGoal{
 const recruit=recruitments.find(item=>!s.owned.includes(item.hero)&&met(s,item));
 const recruitGoal=recruitmentGoal(s,recruit);if(recruitGoal)return recruitGoal;
 const freshQuest=quests.find(quest=>!isPrologueQuest(quest.id)&&quest.unlock<=s.clears&&!s.done[quest.id]);
 if(squadLimit(s)>s.squads.length)return {title:'もうひとつの隊を作れます',detail:'待機中の仲間で新しい隊を作り、別の素材を並行して探せます。同じ仲間は1つの隊に所属します。',action:'隊を編成する',destination:'party'};
 if(freshQuest)return {title:`新しい冒険「${freshQuest.name}」`,detail:`${freshQuest.region}へ出かけましょう。冒険中の隊は「帰還」でいつでも戻れます。`,action:'依頼を見る',destination:'quests',questId:freshQuest.id};
 if(recruit)return {title:recruit.name+'と冒険する支度をしよう',detail:recruitmentHint(s,recruit)+'。対象の依頼は出会いの画面で確認できます。',action:'素材と出会いを見る',destination:'recruit'};
 if(s.town<2&&s.clears>=buildingCost(s.town).clears)return {hintId:'building-materials-'+String(s.town),title:`${s.town===0?'酒場':'小さな村'}まで、あと${buildingNeeds(s).join('・')}`,detail:'木材は区間報酬と寄り道から。鉱石は護衛や討伐の依頼でも集まります。建設画面で必要な材料を確認できます。',action:'建設を見る',destination:'build'};
 return unlockGoal(s)??{title:'お気に入りのふたりの絆を育てよう',detail:'相性のよい仲間と区間を進むと、絆が育ち、連携技と会話が変わります。',action:'編成を考える',destination:'companions'};
}

export function nextGoal(s:State,sq:Squad=s.squads[0]):JourneyGoal{
 if(inPrologue(s))return prologueGoal(s,sq);
 if(s.clears===0)return firstGoal(sq);
 if(canBuild(s))return {title:s.town===0?'酒場を建てられます':'鍛冶場と薬草園を作れます',detail:s.town===0?'最初の冒険で集めた素材を、みんなの帰る場所に。出発時の体力と絆の育ち方が変わります。':'全員の能力が上がり、薬草の収穫と回復も増えます。',action:'建設へ',destination:'build'};
 return establishedGoal(s);
}

export function partyPreview(s:State,sq:Squad,members:string[],q:Quest){
 const draft={...sq,members};return {before:stats(s,sq),after:stats(s,draft),secondsBefore:estimate(s,sq,q),secondsAfter:estimate(s,draft,q),bonds:activeBonds(members),healing:members.includes('mira')||members.includes('poppy'),guarding:members.includes('garr')||members.includes('noel'),exploring:members.some(id=>['aria','finn','poppy'].includes(id))};
}
export function questAdvice(s:State,sq:Squad,q:Quest){
 if(power(s,sq,q)>=q.need)return 'この隊が得意な依頼です。見守りながら報酬を集めましょう。';
 const strong=[...heroes].filter(h=>s.owned.includes(h.id)&&!sq.members.includes(h.id)&&!s.squads.some(p=>p.id!==sq.id&&p.members.includes(h.id))).sort((a,b)=>b.stats[['採取','護衛','討伐'].indexOf(q.kind)]-a.stats[['採取','護衛','討伐'].indexOf(q.kind)]).at(0);
 return `${q.kind}の力が目安より${String(q.need-power(s,sq,q))}低めです。${strong?`${strong.name}を含む編成を比べるか、`:''}${s.clears>=3?'装備を強化するか、':''}手助け・回復で支えましょう。条件を満たさなくても出発できます。`;
}
export type JourneyNotice={title:string;description:string};
function prologueNotice(before:State,after:State):JourneyNotice|null{
 const stage=prologueStages.find(({quest})=>(after.done[quest]||0)>(before.done[quest]||0));return stage?{title:stage.arrival,description:stage.detail}:null;
}
function recruitmentNotice(before:State,after:State):JourneyNotice|null{
 const joined=heroes.find(hero=>after.owned.includes(hero.id)&&!before.owned.includes(hero.id));
 if(joined)return {title:`${joined.name}が旅団に加入！`,description:'一緒に冒険を終え、新しい仲間になりました。「旅の思い出」で加入の話を読めます。'};
 const preparedNow=recruitments.find(item=>prepared(after,item.hero)&&!prepared(before,item.hero));
 if(preparedNow)return {title:preparedNow.name+'の支度が整いました',description:'専用クエスト「'+preparedNow.mission.name+'」が開きました。'};
 const found=recruitments.find(item=>!prepared(after,item.hero)&&rareProgress(after,item).found>rareProgress(before,item).found);
 return found?{title:found.rare.name+'を見つけました',description:found.name+'との冒険の支度に使えます。'}:null;
}
function progressionNotice(before:State,after:State):JourneyNotice|null{
 if(before.clears===0&&after.clears>0)return {title:'はじめての依頼、達成！',description:'集めたお金と木材で酒場を建てましょう。自動周回をオンにすると、冒険が続きます。'};
 const unlocked=quests.filter(quest=>quest.unlock>before.clears&&quest.unlock<=after.clears);
 if(unlocked.length)return {title:'新しい依頼が届きました',description:unlocked.map(quest=>quest.name).join('・')+'。依頼画面で確認できます。'};
 const grown=heroes.filter(hero=>level(after.xp[hero.id]||0)>level(before.xp[hero.id]||0));
 if(grown.length)return {title:'仲間がレベルアップ！',description:grown.map(hero=>`${hero.name} Lv.${String(level(after.xp[hero.id]||0))}`).join('・')+'。全能力が上がりました。'};
 if(after.gear>before.gear)return {title:`みんなの装備 Lv.${String(after.gear)}`,description:'全員の採取・護衛・討伐の力が上がりました。'};
 if(after.camp>before.camp)return {title:`野営地 Lv.${String(after.camp)}`,description:'次に移動を始める地点から、仲間の行動間隔が短くなります。'};
 return null;
}
function rewardNotice(before:State,after:State):JourneyNotice|null{
 const xpBefore=Object.values(before.xp).reduce((total,value)=>total+value,0),xpAfter=Object.values(after.xp).reduce((total,value)=>total+value,0);
 if(after.gold<=before.gold||xpAfter<=xpBefore)return null;
 return {title:after.clears>before.clears?'依頼達成！':'区間報酬を確保',description:`+${String(after.gold-before.gold)} G · 薬草 +${String(after.herbs-before.herbs)} · 鉱石 +${String(after.ore-before.ore)} · 木材 +${String(after.wood-before.wood)}`};
}
export function journeyNotice(before:State,after:State):JourneyNotice|null{
 if(inPrologue(after))return prologueNotice(before,after);
 if(after.town>before.town)return {title:after.town===1?'星灯りの酒場が完成！':'星灯りの小さな村が完成！',description:after.town===1?'ふたりの焚き火から、みんなの帰る場所へ。出発時HP +10%・絆の成長2倍。':'鍛冶場と薬草園に灯りがともりました。全能力 +8%・薬草の収穫と回復が増えます。'};
 return recruitmentNotice(before,after)??progressionNotice(before,after)??rewardNotice(before,after);
}
