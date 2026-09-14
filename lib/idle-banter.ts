import type {StoryLine} from './stories.ts';

const a=(text:string,expression?:StoryLine['expression']):StoryLine=>({speaker:'aria',text,...(expression?{expression}:{})});
const l=(text:string,expression?:StoryLine['expression']):StoryLine=>({speaker:'leon',text,...(expression?{expression}:{})});
// These exchanges fit any departure and reveal no later story events.
const exchanges:StoryLine[][]=[
 [a('準備できた？','smile'),l('ああ。アリアを待ってた。','smile')],
 [l('靴の紐、片方だけ緩んでるぞ。'),a('あ、ほんとだ。ちょっと待ってて。すぐ結ぶ。','surprised')],
 [a('さっきから袋を確かめてない？','mischievous'),l('水は入れた。布もある。……よし、もう閉じる。','serious')],
 [a('今日はどっちが先を歩く？'),l('並んで歩けるところなら、隣でいいだろ。','smile'),a('うん。じゃあ、広い道はそうしよう。','smile')],
 [l('その髪、留め直さなくていいのか？'),a('風が出たら結ぶ。今は、このままがいいの。','smile')],
 [a('帰りにお腹が空きそう。','worried'),l('パンなら少し持ってきた。'),a('私も。じゃあ、違うほうを半分ずつね。','smile')],
];

export function idleBanter(now:number):StoryLine[]{
 return exchanges[Math.floor(Math.max(0,now)/30000)%exchanges.length];
}
