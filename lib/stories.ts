import type {State, Squad} from './game.ts';
import {recruitments,met,prepared,rareProgress} from './recruitment.ts';
import {recruitmentStories} from './recruitment-stories.ts';
import {madHalloweenStories} from './mad-halloween-stories.ts';
import {inPrologue,TRADE_QUEST,RETURN_QUEST,TOWN_QUEST,TOWER_QUEST,NIGHT_QUEST,WETLAND_QUEST,isPrologueQuest} from './prologue.ts';
import {prologueStories} from './prologue-stories.ts';
import {characterEncounters} from './character-encounters.ts';
import {idleBanter} from './idle-banter.ts';

export type StoryLine = {speaker?: string; text: string};
export type Story = {id: string; title: string; place: string; lines: StoryLine[]; quest?: string; chapter: 'departure'|'return'|'camp'|'recruitment'|'encounter'; companion?:string; stage?:'meeting'|'progress'|'prepared'|'joined'; bond?: number; town?: number; requiresHeroes?:string[]; requiresQuests?:string[]};
export type StoryProgress = {departed: string[]; completed: string[]; read: string[]};
const a=(text:string):StoryLine=>({speaker:'aria',text});
const l=(text:string):StoryLine=>({speaker:'leon',text});
const n=(text:string):StoryLine=>({text});
const pair=(quest:string,title:string,after:string,intro:StoryLine[],outro:StoryLine[]):Story[]=>[
 {id:quest+'-departure',quest,title,place:'出発のひと幕',chapter:'departure',lines:intro},
 {id:quest+'-return',quest,title:after,place:'冒険のあとで',chapter:'return',lines:outro},
];

// Their affection is mutual. Progress shows trust and small choices, never a forced confession.
export const stories:Story[]=[
 ...prologueStories,
 ...characterEncounters,
 ...madHalloweenStories,
 ...recruitmentStories,
 ...pair('herbs','いつもの隣に','半分ずつの甘さ',[
  n('最初の依頼書を、アリアがふたりの間に広げた。'),a('月しずく草だって。匂いなら、すぐ分かるよ。'),l('道は俺が見ておく。'),a('……頼む前から？'),l('何年、一緒にいると思ってるんだ。'),n('アリアは笑って、地図の端を彼のほうへ寄せた。'),
 ],[
  n('薬師から、お礼に小さな包みをふたつもらった。'),a('蜂蜜のお菓子！ レオン、好きだったよね。'),l('アリアもだろ。ほら、大きいほう。'),a('そうやって、いつも譲る。'),l('……じゃあ、半分ずつにするか。'),n('アリアはうなずいた。分けるあいだ、肩が触れていた。'),
 ]),
 ...pair('cart','つまみ食いは厳禁','取っておいたパン',[
  n('荷馬車から、焼きたてのパンの匂いがする。'),a('ひとつくらい減っても……。'),l('依頼書に、つまみ食い厳禁って書いてある。'),a('読んだよ。レオンならそう言うと思って。'),l('帰りに買おう。胡桃のやつ、まだ好きだろ。'),a('……うん。覚えてたんだ。'),
 ],[
  n('パン屋でもらった袋を、レオンがアリアに差し出す。'),l('胡桃のパン、最後のひとつだった。'),a('自分のは？'),l('俺は、別のでいい。'),a('じゃあ明日は私が選ぶ。レオンの好きなの。'),l('明日も行くのか？'),a('……嫌じゃなければ。'),l('嫌とは言ってない。'),
 ]),
 ...pair('slime','袖をつかむ理由','ほつれた言い訳',[
  n('村の畑の入り口で、アリアが剣士の袖をつかんだ。'),a('足元。苗、踏んじゃうよ。'),l('ああ、助かった。'),a('私だって、レオンのこと見てるんだから。'),l('……知ってる。'),n('なぜかふたりとも、それからしばらく苗の話をした。'),
 ],[
  a('袖、ほつれてる。私が引っ張ったところ？'),l('大したことない。あとで繕う。'),a('貸して。これくらいできるから。'),n('針を持つ手を、レオンは黙って見守った。'),l('昔も、こうしてくれたな。'),a('昔より上手でしょ。……ちゃんと見ててよ。'),
 ]),
 ...pair('crystal','青い灯りの届く距離','おそろいとは言わない',[
  n('洞窟の入り口で、ランタンの灯りを確かめる。'),l('暗いところは、俺の後ろを歩いてくれ。'),a('隣じゃだめ？ 石を探すのは私の役目。'),l('……足元が見えるなら。'),n('レオンはランタンを、ふたりの真ん中に持ち直した。'),
 ],[
  n('採掘を終え、持ち帰ってよいと言われた小さな欠片を選ぶ。'),a('これとこれ、同じ色。ひとつあげる。'),l('きれいなほう、アリアが持てよ。'),a('同じだってば。ふたつで見つけたんだから。'),n('レオンは欠片を、落とさないよう内ポケットにしまった。'),
 ]),
 ...pair('pilgrim','差し出す手','今は、どこにも',[
  n('巡礼者たちが待つ山道に、細い崖道が続いている。'),l('ここ、滑るぞ。手を。'),a('子どもじゃないんだけど。'),l('分かってる。'),n('それでも差し出された手に、アリアは自分の手を重ねた。'),
 ],[
  n('帰り着いた焚き火の前で、アリアが口を開いた。'),a('……今日、手、離さなかったね。'),l('あの崖で離せるわけないだろ。'),a('崖、渡り終わってからも。'),l('……アリア、すぐどっか行くから。'),a('ふうん。'),n('アリアは隣に腰を下ろす。いつもより、少しだけ近い。'),a('今は、どこにも行かないよ。'),l('……そうか。'),n('しばらく、ふたりとも焚き火を見ていた。'),
 ]),
 ...pair('wolf','霧の向こうの声','心配してもいい',[
  a('この霧じゃ、顔も見えなくなるね。'),l('離れたら、名前を呼べ。'),a('レオンは？'),l('アリアが呼ぶ前に見つける。'),a('……そういうこと、さらっと言う。'),n('最後のひと言は、霧にまぎれるくらい小さかった。'),
 ],[
  a('さっき、私の名前、すごい声で呼んだね。'),l('姿が見えなくなったから。'),a('すぐそこにいたのに。'),l('……心配くらい、させてくれ。'),n('アリアは言いかけた冗談を飲み込んだ。'),a('うん。私にも、させてね。'),
 ]),
 ...pair('blossom','見せたい景色','押し花の行き先',[
  n('千年樹の花の絵を、アリアが何度も見返している。'),l('そんなに見たいのか。'),a('うん。……レオンにも見せたい。'),l('俺も行くんだから、見られるだろ。'),a('そういう意味じゃ……まあ、いいや。'),n('彼女は依頼書を丁寧にたたんだ。'),
 ],[
  n('採取の許された花を届け、落ちていた花びらを旅の手帳にはさむ。'),a('次に咲くころ、私たちはどうしてるかな。'),l('千年後は、さすがにな。'),a('じゃあ、来年。この森、また来ようよ。'),l('花がなくても？'),a('……一緒なら、いいでしょ。'),l('ああ。'),
 ]),
 ...pair('royal','祭りの約束','護衛のあとの約束',[
  n('お忍びの王女を、星の祭りへ案内する依頼が届いた。'),a('祭りかあ。私たちは護衛だもんね。'),l('終わったあとなら、少し見られるだろ。'),a('ふたりで？'),l('……ほかに誰か、誘いたいのか？'),a('ううん。聞いただけ。'),
 ],[
  n('王女を送り届けると、遠くから祭りの音が聞こえた。'),l('まだ灯りがついてる。約束、覚えてるか。'),a('……仕事のついでじゃなかったの？'),l('もう仕事は終わった。'),n('アリアが、半歩近づいた。'),a('じゃあ、今日は私の行きたいところに付き合って。'),l('いつもそうだろ。'),a('今日は、いつもより。'),
 ]),
 ...pair('dragon','その先の予定','明日の話をしよう',[
  n('古塔へ向かう支度が、ひとつずつ整っていく。'),a('帰ったら、何食べたい？'),l('今、それを決めるのか。'),a('決めておけば、帰る楽しみが増えるでしょ。'),l('……アリアが前に作った、あのスープ。'),a('うん。じゃあ、絶対帰ろうね。'),
 ],[
  n('取り戻した星の灯りが、帰り道を照らしていた。'),l('明日は休みにしよう。'),a('レオンがそんなこと言うなんて。'),l('アリアと、ゆっくり飯を食うくらいは。'),a('……スープ、作りすぎちゃうかも。'),l('明後日も食べればいい。'),n('アリアは買い物のメモを開き、じゃがいもの数を書き足した。隣からのぞき込むレオンに、メモを少し傾ける。'),
 ]),
 {id:'camp-seat',title:'空けてある場所',place:'焚き火のそば',chapter:'camp',bond:1,lines:[n('アリアが戻ると、焚き火の隣に荷物ひとつ分の空間があった。'),a('ここ、誰か来るの？'),l('……アリアが来るだろ。'),a('そっか。'),n('座る前に、彼女は少しだけ髪を直した。')]},
 {id:'camp-cup',title:'冷めないうちに',place:'酒場の片隅',chapter:'camp',bond:2,town:1,lines:[n('レオンの向かいには、まだ湯気の立つカップがある。'),a('待ってた？'),l('お茶が余っただけだ。'),a('私の好きな蜂蜜まで入ってる。'),l('……冷めるぞ。'),n('アリアは向かいの椅子を引きかけて、隣の椅子に座り直した。')]},
 {id:'camp-thread',title:'ほどけないように',place:'酒場の支度部屋',chapter:'camp',bond:2,town:1,lines:[n('結び直した髪紐を、アリアが鏡に映している。'),a('これ、まだ似合う？ 昔、レオンがくれたやつ。'),l('……まだ持ってたのか。'),a('質問に答えてよ。'),l('似合う。'),n('予想より早い返事に、アリアの手が止まった。'),a('……ありがと。')]},
 {id:'camp-quiet-tea',title:'ふたつのカップ',place:'酒場の夜',chapter:'camp',bond:2,town:1,lines:[n('ミラがふたつのカップを置く。いつもより小さなテーブルに。'),{speaker:'mira',text:'今夜は、こちらでどうぞ。'},a('向こうの席も空いてるよ？'),{speaker:'mira',text:'こっちのほうが、暖かいから。'},n('ミラはそれだけ言って、奥へ戻っていった。'),l('……座るか。'),a('うん。')]},
 {id:'camp-tomorrow',title:'ふたりで出かける日',place:'朝の支度',chapter:'camp',bond:3,town:1,lines:[a('明日、依頼がなくても出かけない？'),l('何か採るのか？'),a('何も。歩くだけ。……ふたりで。'),n('レオンは地図に伸ばしかけた手を止めた。'),l('分かった。朝、ここで待ってる。'),a('遅れても置いていかないでね。'),l('置いていったこと、ないだろ。'),n('アリアはうれしそうに、知ってる、と答えた。')]},
];

export const characterNotes:Partial<Record<string,{habit:string}>>={
 aria:{habit:'気になるものを見つけると、考えるより先に足が動く。道を間違えても、つい強がってしまう。'},
 leon:{habit:'誰かの荷物や足元を、いつの間にか気にしている。自分の望みを聞かれると、言葉を選びすぎる。'},
};
export const together=(ids:string[])=>ids.includes('aria')&&ids.includes('leon');
export const affection=(s:State)=>Math.min(3,1+Math.floor((s.friendship['aria-leon']||0)/12));
// Older saves have no scene history: cleared quests become readable memories, without replaying pop-ups.
export function storyProgress(s:State):StoryProgress {
 return s.story||{departed:Object.keys(s.done).filter(id=>s.done[id]>0&&stories.some(st=>st.quest===id)),completed:Object.keys(s.done).filter(id=>s.done[id]>0&&stories.some(st=>st.quest===id)),read:[]};
}
function requirementsMet(s:State,story:Story){return !story.requiresHeroes?.some(id=>!s.owned.includes(id))&&!story.requiresQuests?.some(id=>!(s.done[id]>0));}
function recruitmentStoryAvailable(s:State,story:Story){
 const recruitment=recruitments.find(item=>item.hero===story.companion);if(!recruitment)throw Error(`物語「${story.id}」の加入情報が見つかりません。`);
 if(story.stage==='joined')return s.owned.includes(recruitment.hero);
 if(story.stage==='prepared')return prepared(s,recruitment.hero);
 if(story.stage==='progress')return met(s,recruitment)&&(prepared(s,recruitment.hero)||rareProgress(s,recruitment).found>=Math.ceil(recruitment.rare.count/2));
 return met(s,recruitment);
}
function questStoryAvailable(progress:StoryProgress,story:Story){
 if(!story.quest)throw Error(`物語「${story.id}」の依頼情報が見つかりません。`);
 return story.chapter==='departure'?progress.departed.includes(story.quest):progress.completed.includes(story.quest);
}
function storyAvailable(s:State,progress:StoryProgress,story:Story){
 if(inPrologue(s)&&!isPrologueQuest(story.quest||''))return false;
 if(!requirementsMet(s,story))return false;
 if(story.chapter==='encounter')return s.town>=(story.town||0);
 if(story.chapter==='recruitment')return recruitmentStoryAvailable(s,story);
 if(story.chapter==='departure'||story.chapter==='return')return questStoryAvailable(progress,story);
 return progress.completed.length>0&&affection(s)>=(story.bond||1)&&s.town>=(story.town||0)&&story.lines.every(line=>!line.speaker||s.owned.includes(line.speaker));
}
export function availableStories(s:State):Story[]{
 const p=storyProgress(s);
 return stories.filter(story=>storyAvailable(s,p,story));
}
export function campStories(s:State):Story[]{
 const home=s.owned.filter(id=>!s.squads.some(sq=>sq.run&&sq.members.includes(id)));
 return availableStories(s).filter(st=>st.chapter==='encounter'?(st.requiresHeroes||[]).every(id=>home.includes(id)):st.chapter==='camp'&&st.lines.every(line=>!line.speaker||home.includes(line.speaker)));
}
export function coupleCombo(s:State,variant:number):string[]{
 const lines=[
  [['アリア「いつもの合図でね！」','レオン「ああ。アリアの動きは分かってる。」'],['レオン「足元、気をつけろよ。」','アリア「見ててくれるんでしょ？」']],
  [['アリア「私が前に出たら、お願い。」','レオン「任せろ。ちゃんと見てる。」'],['レオン「無茶はするなよ。」','アリア「レオンがいると、ついね。」']],
  [['アリア「終わったら、一緒に帰ろうね。」','レオン「そのために、ここにいる。」'],['レオン「合図、いるか？」','アリア「いらない。もう分かるから。」']],
 ];
 return lines[affection(s)-1][variant%2];
}
function returnBanter(run:NonNullable<Squad['run']>):StoryLine[]{
 if(run.phase==='rest')return [a('荷物、私のほうへ寄せて。少し休もう。'),l('ああ。次の分かれ道までは一緒だ。')];
 return run.node%3===0?[a('帰りの包み、今度は軽いね。'),l('控えは内側にしまった。あとは村で渡せば終わりだ。')]:[a('また道の真ん中にいる。こんな時間なのに。'),l('荷物は端へ寄せよう。一匹ずつなら通れる。')];
}
function townBanter(run:NonNullable<Squad['run']>):StoryLine[]{
 if(run.phase==='rest')return [l('箱はここに置こう。手、痛くないか？'),a('平気。でも一息ついたら、持つ側を替えよう。')];
 if(run.node%3===0)return [a('この荷札、奥の倉庫じゃなくて店先だって。'),l('本当だ。先に確かめておいてよかった。')];
 return run.node%3===1?[l('次は角の店だ。荷車が通るから、少し待とう。'),a('今日はみんな、同じ時間に運んでるね。')]:[a('受け取りの控え、もらったよ。次の包みは？'),l('これで一区切りだ。荷札と順番を揃えよう。')];
}
function tradeBanter(run:NonNullable<Squad['run']>):StoryLine[]{
 if(run.phase==='rest')return [l('荷を下ろそう。木陰なら涼しい。'),a('うん。水、レオンの分も出すね。')];
 return run.node%3===1?[a('あ、頼まれた薬草。あの木の下にもある。'),l('包みはここに置くぞ。採れたら入れてくれ。')]:[l('薬草の包み、荷物の上に置いたか？'),a('うん。潰れないように、紐も掛け直したよ。')];
}
function towerBanter(run:NonNullable<Squad['run']>):StoryLine[]{
 if(run.phase==='rest')return [a('この石なら乾いてる。座ろう、レオン。'),l('助かる。水を飲んでから行こう。')];
 if(run.node<5)return [a('畑の向こうまで来ると、街の声が遠いね。'),l('あの林の先から登りになる。今のうちに紐を締めておこう。')];
 if(run.node<10)return [a('木陰の薬草、葉がきれい。少し採っていこう。'),l('入れ物を出す。俺は道のほうを見てるよ。')];
 return [l('坂の端はぬかるんでるな。真ん中を通ろう。'),a('あの石のところは乾いてるよ。塔も近くに見えてきた。')];
}
function nightBanter(run:NonNullable<Squad['run']>):StoryLine[]{
 if(run.phase==='rest')return [l('灯りを置くぞ。少し休もう。'),a('うん。入れ物は、こっちの平らなところに。')];
 if(run.node<5)return [a('小石の影まで見える。苔だけで、こんなに照らせるんだね。'),l('入れ物が揺れないように持っていこう。')];
 if(run.node<10)return [l('草が動いた。灯りはここへ置いて、少し離れよう。'),a('うん。通り道を確かめてからね。')];
 return [a('そろそろ分かれ道だね。苔灯、持つの替わろうか？'),l('ああ。包みは俺が持つから、両手を空けて。')];
}
function wetlandBanter(run:NonNullable<Squad['run']>):StoryLine[]{
 if(run.phase==='rest')return [a('布、ここに敷くね。少し座ろう。'),l('ああ。入れ物は平らなところに置いておこう。')];
 if(run.node<5)return [a('この先の木陰、薬草を採るときによく通るんだ。'),l('じゃあ、踏まないほうがいい場所も教えてくれ。')];
 if(run.node<10)return [l('石の横に水が残ってるな。'),a('うん。根の脇も見てみよう。葉の下に隠れてることがあるから。')];
 return [a('あの木の根、ちょっと見せて。草を分けるから。'),l('入れ物を出しておく。見つけても、まず生えてるところで比べよう。')];
}
function routeBanter(sq:Squad):StoryLine[]|null{
 const run=sq.run;if(!run)return null;
 if(run.quest===WETLAND_QUEST)return wetlandBanter(run);
 if(run.quest===TOWER_QUEST)return towerBanter(run);
 if(run.quest===NIGHT_QUEST)return nightBanter(run);
 if(run.quest===RETURN_QUEST)return returnBanter(run);
 if(run.quest===TOWN_QUEST)return townBanter(run);
 if(run.quest===TRADE_QUEST)return tradeBanter(run);
 return null;
}
function guestQuestBanter(sq:Squad):StoryLine[]|null{
 const run=sq.run;if(!run)return null;
 if(run.quest==='join-chacha')return [{speaker:'chacha',text:'茶器はお願いしますねぇ。岩のほうは、わたしが持ちますから。'}];
 if(run.quest==='midnight-snack'&&sq.members.includes('poppy'))return [{speaker:'merrill',text:'その薬、味見しようか？'},{speaker:'poppy',text:'瓶ごと食べそうな人には、頼まない！'}];
 if(run.quest==='puppet-midnight'&&sq.members.includes('finn'))return [{speaker:'pumpety',text:'ポケット、軽くなった？'},{speaker:'finn',text:'うん。代わりに人形のポケットを重くしておいたよ。'}];
 return null;
}
function chachaBanter(sq:Squad):StoryLine[]|null{
 const run=sq.run;if(!run||run.quest.startsWith('join-')||!sq.members.includes('chacha'))return null;
 if(sq.members.includes('mira'))return [{speaker:'chacha',text:run.phase==='rest'?'お湯が沸くまで、あと十回だけぇ。':'帰ったら、お茶をご一緒に。今日はわたしが淹れますねぇ。'},{speaker:'mira',text:run.phase==='rest'?'今は座るほうの休憩よ。あなたのカップも用意したわ。':'楽しみにしているわ。茶葉を選ぶ時間も残しておきましょう。'}];
 if(sq.members.includes('garr'))return [{speaker:'garr',text:'その剣の重さには、まだ慣れないな。'},{speaker:'chacha',text:'では、帰ったら一緒に素振りを。お茶付きですよぉ。'}];
 return null;
}
function genericChachaBanter(sq:Squad):StoryLine[]|null{
 const run=sq.run;if(!run||run.quest.startsWith('join-')||!sq.members.includes('chacha'))return null;
 return [{speaker:'chacha',text:run.phase==='rest'?'まず、お茶にしましょうねぇ。筋肉にも休憩が要りますから。':'道がなければ、どかせばいいんですよぉ。せーの。'}];
}
function halloweenPairBanter(sq:Squad,now:number):StoryLine[]|null{
 const run=sq.run;if(!run||!together(sq.members))return null;
 if(run.quest==='midnight-snack')return Math.floor((now-run.started)/18000)%2?[{speaker:'merrill',text:'一曲踊ったら、お腹が空いちゃった。'},{speaker:'aria',text:'さっき魔物を食べたばかりでしょ！'}]:[{speaker:'merrill',text:'そこの小動物、ひと口だけ……。'},{speaker:'leon',text:'琴を弾いたまま追いかけるな！'}];
 if(run.quest==='puppet-midnight')return [{speaker:'pumpety',text:'そっちはプティじゃないよ。お人形でしたぁ！'},{speaker:'aria',text:'本物も笑ってるから、場所は分かった。'}];
 return null;
}
function recruitmentBanter(sq:Squad):StoryLine[]{
 const hero=sq.run?.quest.slice(5);const replies:Partial<Record<string,StoryLine[]>>={mira:[{speaker:'mira',text:'次の小屋まで、もう少し。みんなの歩幅で行きましょう。'}],finn:[{speaker:'finn',text:'この先だ。箱は小さいから、足元もよく見てね。'}],garr:[{speaker:'garr',text:'板を確かめながら、一人ずつ。俺はここにいる。'}],luna:[{speaker:'luna',text:'あの光、見える？ 同じ場所から、一緒に見て。'}],poppy:[{speaker:'poppy',text:'その芽は残しておいて。まだ、元気になる途中だから。'}],noel:[{speaker:'noel',text:'この道の音も、歌に残しておきたいな。'}]};return hero?replies[hero]||[]:[];
}
function affectionBanter(level:number,variant:number):StoryLine[]{
 if(level===3)return variant?[a('明日も晴れるかな。'),l('雨でも、約束は覚えてる。')]:[l('疲れてないか？'),a('もう少し歩きたい。レオンと。')];
 if(level===2)return variant?[a('帰ったら、隣の席取っておいて。'),l('……いつも空けてる。')]:[l('髪に葉っぱ、ついてるぞ。'),a('取って。……そんなにじっと見ないでよ。')];
 return variant?[a('こっちが近道！ たぶん！'),l('その「たぶん」は何回目だ？')]:[l('少し歩くのが速くないか？'),a('レオンなら追いついてくれるでしょ。')];
}
function journeySituationBanter(run:NonNullable<Squad['run']>,level:number,variant:number,now:number):StoryLine[]|null{
 if(run.phase==='rest'||Object.values(run.health).some(health=>health.hp<health.maxHp*.3))return level>=2?[a('大丈夫、もう少しなら。'),l('俺が休みたいんだ。……隣、空けてくれ。')]:[l('少し休もう。水、飲めるか？'),a('うん。レオンも、ちゃんと飲んでね。')];
 if(run.detour&&!run.detour.claimed&&now>=run.detour.at)return variant?[l('また寄り道か？'),a('きれいなものだったら、半分あげる。')]:[a('ねえ、あそこ光ってる！'),l('分かった。……ひとりで走るなよ。')];
 return null;
}
function coupleBanter(s:State,sq:Squad,now:number):StoryLine[]{
 const run=sq.run,variant=Math.floor(Math.max(0,now-(run?.started||0))/18000)%2,level=affection(s);
 if(!run)return idleBanter(now);
 const situation=journeySituationBanter(run,level,variant,now);if(situation)return situation;
 if(['pilgrim','wolf','royal'].includes(run.quest))return level>=2?[l('滑るぞ。つかまってろ。'),a('……もう平らな道だけど。')]:[a('霧で、先が見えないね。'),l('声の届くところにいてくれ。')];
 if(run.quest==='cart')return [a('帰りのパン、覚えてる？'),l('胡桃のやつだろ。忘れないよ。')];
 if(['crystal','dragon'].includes(run.quest))return [l('灯り、こっちに寄せるぞ。'),a('うん。……このくらい近いと、よく見える。')];
 return affectionBanter(level,variant);
}
export function journeyBanter(s:State,sq:Squad,now:number):StoryLine[]{
 const r=sq.run;
 const route=routeBanter(sq);if(route)return route;
 const guest=guestQuestBanter(sq);if(guest)return guest;
 const chacha=chachaBanter(sq);if(chacha)return chacha;
 const halloween=halloweenPairBanter(sq,now);if(halloween)return halloween;
 const genericChacha=genericChachaBanter(sq);if(genericChacha)return genericChacha;
 if(r?.quest.startsWith('join-'))return recruitmentBanter(sq);
 if(!together(sq.members))return [];
 return coupleBanter(s,sq,now);
}
