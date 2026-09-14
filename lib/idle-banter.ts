import type {StoryLine} from './stories.ts';

const a=(text:string,expression?:StoryLine['expression']):StoryLine=>({speaker:'aria',text,...(expression?{expression}:{})});
const l=(text:string,expression?:StoryLine['expression']):StoryLine=>({speaker:'leon',text,...(expression?{expression}:{})});
const m=(text:string):StoryLine=>({speaker:'mira',text});
// These exchanges fit any departure and reveal no later story events.
const exchanges:StoryLine[][]=[
 [a('準備できた？','smile'),l('ああ。アリアを待ってた。','smile')],
 [l('靴の紐、片方だけ緩んでるぞ。'),a('あ、ほんとだ。ちょっと待ってて。すぐ結ぶ。','surprised')],
 [a('さっきから袋を確かめてない？','mischievous'),l('水は入れた。布もある。……よし、もう閉じる。','serious')],
 [a('今日はどっちが先を歩く？'),l('並んで歩けるところなら、隣でいいだろ。','smile'),a('うん。じゃあ、広い道はそうしよう。','smile')],
 [l('その髪、留め直さなくていいのか？'),a('風が出たら結ぶ。今は、このままがいいの。','smile')],
 [a('帰りにお腹が空きそう。','worried'),l('パンなら少し持ってきた。'),a('私も。じゃあ、違うほうを半分ずつね。','smile')],
];

const trioExchanges:StoryLine[][]=[
 [m('その前に、ひとつだけ。レオン、手の擦り傷を見せてね。'),l('荷紐で少し擦れただけだ。'),m('痛いのは、我慢しなくていいのよ。')],
 [a('ミラ、カップが二つしか出てないよ。'),m('私は包帯を巻き直してからでいいわ。'),a('三つ目、ここに置くね。一緒に飲もう。','smile')],
 [l('包帯は予備もある。念のためだ。'),m('助かるわ。もう一巻き、入れてもいいかしら。'),a('二人とも、袋が閉まる分までね。','mischievous')],
 [m('急いでいても、ここは待ちましょう。あと少しで、いい香りになるわ。'),a('お茶の時間だけは、ミラも急がないんだね。','smile'),m('ええ。そこは譲れないの。')],
 [a('ね、いいこと思いついた！　次の休憩は私がお茶を淹れる。','smile'),m('それなら、その間に薬を小分けにできるわね。'),a('ミラが休むためのお茶だよ？')],
 [l('ミラの水袋は？　二人の分は見たけど。'),m('あら。自分のを、まだ満たしていなかったわ。'),l('ここに置いてくれ。一緒に汲んでくる。')],
 exchanges[3],exchanges[5],
];

export function idleBanter(now:number,members:readonly string[]=['aria','leon']):StoryLine[]{
 const pool=['aria','leon','mira'].every(id=>members.includes(id))?trioExchanges:exchanges;
 return pool[Math.floor(Math.max(0,now)/30000)%pool.length];
}
