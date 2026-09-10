import type {State, Squad} from './game.ts';
import {recruitments,met,prepared,rareProgress} from './recruitment.ts';
import {recruitmentStories} from './recruitment-stories.ts';

export type StoryLine = {speaker?: string; text: string};
export type Story = {id: string; title: string; place: string; lines: StoryLine[]; quest?: string; chapter: 'departure'|'return'|'camp'|'recruitment'; companion?:string; stage?:'meeting'|'progress'|'prepared'|'joined'; bond?: number; town?: number};
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
 ...recruitmentStories,
 ...pair('herbs','いつもの隣に','半分ずつの甘さ',[
  n('最初の依頼書を、アリアがふたりの間に広げた。'),a('月しずく草だって。匂いなら、すぐ分かるよ。'),l('道は俺が見ておく。'),a('……頼む前から？'),l('何年、一緒にいると思ってるんだ。'),n('アリアは笑って、地図の端を彼のほうへ寄せた。'),
 ],[
  n('薬師から、お礼に小さな包みをふたつもらった。'),a('蜂蜜のお菓子！ レオン、好きだったよね。'),l('お前もだろ。ほら、大きいほう。'),a('そうやって、いつも譲る。'),l('……じゃあ、半分ずつにするか。'),n('アリアはうなずいた。分けるあいだ、肩が触れていた。'),
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
  n('採掘を終え、持ち帰ってよいと言われた小さな欠片を選ぶ。'),a('これとこれ、同じ色。ひとつあげる。'),l('きれいなほう、お前が持てよ。'),a('同じだってば。ふたつで見つけたんだから。'),n('レオンは欠片を、落とさないよう内ポケットにしまった。'),
 ]),
 ...pair('pilgrim','差し出す手','今は、どこにも',[
  n('巡礼者たちが待つ山道に、細い崖道が続いている。'),l('ここ、滑るぞ。手を。'),a('子どもじゃないんだけど。'),l('分かってる。'),n('それでも差し出された手に、アリアは自分の手を重ねた。'),
 ],[
  n('帰り着いた焚き火の前で、アリアが口を開いた。'),a('……今日、手、離さなかったね。'),l('あの崖で離せるわけないだろ。'),a('崖、渡り終わってからも。'),l('……お前、すぐどっか行くから。'),a('ふうん。'),n('アリアは隣に腰を下ろす。いつもより、少しだけ近い。'),a('今は、どこにも行かないよ。'),l('……そうか。'),n('しばらく、ふたりとも焚き火を見ていた。'),
 ]),
 ...pair('wolf','霧の向こうの声','心配してもいい',[
  a('この霧じゃ、顔も見えなくなるね。'),l('離れたら、名前を呼べ。'),a('レオンは？'),l('お前が呼ぶ前に見つける。'),a('……そういうこと、さらっと言う。'),n('最後のひと言は、霧にまぎれるくらい小さかった。'),
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
  n('古塔へ向かう支度が、ひとつずつ整っていく。'),a('帰ったら、何食べたい？'),l('今、それを決めるのか。'),a('決めておけば、帰る楽しみが増えるでしょ。'),l('……お前が前に作った、あのスープ。'),a('うん。じゃあ、絶対帰ろうね。'),
 ],[
  n('取り戻した星の灯りが、帰り道を照らしていた。'),l('明日は休みにしよう。'),a('レオンがそんなこと言うなんて。'),l('お前と、ゆっくり飯を食うくらいは。'),a('……スープ、作りすぎちゃうかも。'),l('明後日も食べればいい。'),n('アリアは笑った。明日も明後日も、彼はそこにいるつもりなのだ。'),
 ]),
 {id:'camp-seat',title:'空けてある場所',place:'焚き火のそば',chapter:'camp',bond:1,lines:[n('アリアが戻ると、焚き火の隣に荷物ひとつ分の空間があった。'),a('ここ、誰か来るの？'),l('……お前が来るだろ。'),a('そっか。'),n('座る前に、彼女は少しだけ髪を直した。')]},
 {id:'camp-cup',title:'冷めないうちに',place:'酒場の片隅',chapter:'camp',bond:2,town:1,lines:[n('レオンの向かいには、まだ湯気の立つカップがある。'),a('待ってた？'),l('お茶が余っただけだ。'),a('私の好きな蜂蜜まで入ってる。'),l('……冷めるぞ。'),n('アリアは向かいの椅子を引きかけて、隣の椅子に座り直した。')]},
 {id:'camp-thread',title:'ほどけないように',place:'酒場の支度部屋',chapter:'camp',bond:2,town:1,lines:[n('結び直した髪紐を、アリアが鏡に映している。'),a('これ、まだ似合う？ 昔、レオンがくれたやつ。'),l('……まだ持ってたのか。'),a('質問に答えてよ。'),l('似合う。'),n('予想より早い返事に、アリアの手が止まった。'),a('……ありがと。')]},
 {id:'camp-quiet-tea',title:'ふたつのカップ',place:'酒場の夜',chapter:'camp',bond:2,town:1,lines:[n('ミラがふたつのカップを置く。いつもより小さなテーブルに。'),{speaker:'mira',text:'今夜は、こちらでどうぞ。'},a('向こうの席も空いてるよ？'),{speaker:'mira',text:'こっちのほうが、暖かいから。'},n('ミラはそれだけ言って、奥へ戻っていった。'),l('……座るか。'),a('うん。')]},
 {id:'camp-tomorrow',title:'ふたりで出かける日',place:'朝の支度',chapter:'camp',bond:3,town:1,lines:[a('明日、依頼がなくても出かけない？'),l('何か採るのか？'),a('何も。歩くだけ。……ふたりで。'),n('レオンは地図に伸ばしかけた手を止めた。'),l('分かった。朝、ここで待ってる。'),a('遅れても置いていかないでね。'),l('置いていったこと、ないだろ。'),n('アリアはうれしそうに、知ってる、と答えた。')]},
];

export const characterNotes:Record<string,{habit:string;private:string}>={
 aria:{habit:'気になるものを見つけると、考えるより先に足が動く。道を間違えても、つい強がってしまう。',private:'レオンが隣にいる未来は当たり前。でも、ふたりきりの約束をするのは、まだ少し勇気がいる。'},
 leon:{habit:'誰かの荷物や足元を、いつの間にか気にしている。自分の望みを聞かれると、言葉を選びすぎる。',private:'アリアの好物も昔の癖も覚えている。大切にする理由を「幼なじみだから」で済ませてしまう。'},
};
export const together=(ids:string[])=>ids.includes('aria')&&ids.includes('leon');
export const affection=(s:State)=>Math.min(3,1+Math.floor((s.friendship['aria-leon']||0)/12));
// Older saves have no scene history: cleared quests become readable memories, without replaying pop-ups.
export function storyProgress(s:State):StoryProgress {
 return s.story||{departed:Object.keys(s.done).filter(id=>s.done[id]>0&&stories.some(st=>st.quest===id)),completed:Object.keys(s.done).filter(id=>s.done[id]>0&&stories.some(st=>st.quest===id)),read:[]};
}
export function availableStories(s:State):Story[]{
 const p=storyProgress(s);
 return stories.filter(st=>st.chapter==='recruitment'?(() => {const r=recruitments.find(r=>r.hero===st.companion)!;return st.stage==='joined'?s.owned.includes(r.hero):st.stage==='prepared'?prepared(s,r.hero):st.stage==='progress'?met(s,r)&&(prepared(s,r.hero)||rareProgress(s,r).found>=Math.ceil(r.rare.count/2)):met(s,r);})():st.chapter==='departure'?p.departed.includes(st.quest!):st.chapter==='return'?p.completed.includes(st.quest!):
  p.completed.length>0&&affection(s)>=(st.bond||1)&&s.town>=(st.town||0)&&(st.id!=='camp-quiet-tea'||s.owned.includes('mira')));
}
export function campStories(s:State):Story[]{
 const home=s.owned.filter(id=>!s.squads.some(sq=>sq.run&&sq.members.includes(id)));
 if(!together(home))return [];
 return availableStories(s).filter(st=>st.chapter==='camp'&&(st.id!=='camp-quiet-tea'||home.includes('mira')));
}
export function coupleCombo(s:State,variant:number):string[]{
 const lines=[
  [['アリア「いつもの合図でね！」','レオン「ああ。お前の動きは分かってる。」'],['レオン「足元、気をつけろよ。」','アリア「見ててくれるんでしょ？」']],
  [['アリア「私が前に出たら、お願い。」','レオン「任せろ。ちゃんと見てる。」'],['レオン「無茶はするなよ。」','アリア「レオンがいると、ついね。」']],
  [['アリア「終わったら、一緒に帰ろうね。」','レオン「そのために、ここにいる。」'],['レオン「合図、いるか？」','アリア「いらない。もう分かるから。」']],
 ];
 return lines[affection(s)-1][variant%2];
}
export function journeyBanter(s:State,sq:Squad,now:number):StoryLine[]{
 const r=sq.run;
 if(r?.quest.startsWith('join-')){const hero=r.quest.slice(5);const replies:Record<string,StoryLine[]>={mira:[{speaker:'mira',text:'次の小屋まで、もう少し。みんなの歩幅で行きましょう。'}],finn:[{speaker:'finn',text:'この先だ。箱は小さいから、足元もよく見てね。'}],garr:[{speaker:'garr',text:'板を確かめながら、一人ずつ。俺はここにいる。'}],luna:[{speaker:'luna',text:'あの光、見える？ 同じ場所から、一緒に見て。'}],poppy:[{speaker:'poppy',text:'その芽は残しておいて。まだ、元気になる途中だから。'}],noel:[{speaker:'noel',text:'この道の音も、歌に残しておきたいな。'}]};return replies[hero]||[];}
 if(!together(sq.members))return [];
 const v=Math.floor(Math.max(0,now-(r?.started||0))/18000)%2,lv=affection(s);
 if(!r)return [a('準備できた？'),l('ああ。お前を待ってた。')];
 if(r.phase==='rest'||r.hp<r.maxHp*.3)return lv>=2?[a('大丈夫、もう少しなら。'),l('俺が休みたいんだ。……隣、空けてくれ。')]:[l('少し休もう。水、飲めるか？'),a('うん。レオンも、ちゃんと飲んでね。')];
 if(r.detour&&!r.detour.claimed&&now>=r.detour.at)return v?[l('また寄り道か？'),a('きれいなものだったら、半分あげる。')]:[a('ねえ、あそこ光ってる！'),l('分かった。……ひとりで走るなよ。')];
 if(['pilgrim','wolf','royal'].includes(r.quest))return lv>=2?[l('滑るぞ。つかまってろ。'),a('……もう平らな道だけど。')]:[a('霧で、先が見えないね。'),l('声の届くところにいてくれ。')];
 if(r.quest==='cart')return [a('帰りのパン、覚えてる？'),l('胡桃のやつだろ。忘れないよ。')];
 if(['crystal','dragon'].includes(r.quest))return [l('灯り、こっちに寄せるぞ。'),a('うん。……このくらい近いと、よく見える。')];
 if(lv===3)return v?[a('明日も晴れるかな。'),l('雨でも、約束は覚えてる。')]:[l('疲れてないか？'),a('もう少し歩きたい。レオンと。')];
 if(lv===2)return v?[a('帰ったら、隣の席取っておいて。'),l('……いつも空けてる。')]:[l('髪に葉っぱ、ついてるぞ。'),a('取って。……そんなにじっと見ないでよ。')];
 return v?[a('こっちが近道！ たぶん！'),l('その「たぶん」は何回目だ？')]:[l('少し歩くのが速くないか？'),a('レオンなら追いついてくれるでしょ。')];
}
