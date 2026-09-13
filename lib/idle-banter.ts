import type {StoryLine} from './stories.ts';

const a=(text:string):StoryLine=>({speaker:'aria',text});
const l=(text:string):StoryLine=>({speaker:'leon',text});
// These exchanges fit any departure and reveal no later story events.
const exchanges:StoryLine[][]=[
 [a('準備できた？'),l('ああ。アリアを待ってた。')],
 [l('靴の紐、片方だけ緩んでるぞ。'),a('あ、ほんとだ。ちょっと待ってて。すぐ結ぶ。')],
 [a('さっきから袋を確かめてない？'),l('水は入れた。布もある。……よし、もう閉じる。')],
 [a('今日はどっちが先を歩く？'),l('並んで歩けるところなら、隣でいいだろ。'),a('うん。じゃあ、広い道はそうしよう。')],
 [l('その髪、留め直さなくていいのか？'),a('風が出たら結ぶ。今は、このままがいいの。')],
 [a('帰りにお腹が空きそう。'),l('パンなら少し持ってきた。'),a('私も。じゃあ、違うほうを半分ずつね。')],
];

export function idleBanter(now:number):StoryLine[]{
 return exchanges[Math.floor(Math.max(0,now)/30000)%exchanges.length];
}
