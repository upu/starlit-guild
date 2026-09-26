import {
  isChapterThreeQuest,
  STONE_RETURN_QUEST,
  BERNE_RESTORATION_QUEST,
} from "./chapter-three.ts";
import type { Run } from "./game.ts";
import type { StoryLine } from "./stories.ts";
const a = (text: string, expression: StoryLine["expression"] = "neutral"): StoryLine => ({
  expression,
  speaker: "aria",
  text,
});
const l = (text: string, expression: StoryLine["expression"] = "neutral"): StoryLine => ({
  expression,
  speaker: "leon",
  text,
});
const m = (text: string, expression: StoryLine["expression"] = "neutral"): StoryLine => ({
  expression,
  speaker: "mira",
  text,
});
const f = (text: string, expression: StoryLine["expression"] = "neutral"): StoryLine => ({
  expression,
  speaker: "finn",
  text,
});
const routes: Record<string, StoryLine[][]> = {
  "berne-road": [
    [
      f("門が見えたら、左の荷車道へ入ろう。", "smile"),
      a("左ね。あの木の方？"),
      l("木は右だ。道しるべを見てから曲がろう。", "serious"),
    ],
    [
      m("薬の包み、重くないかしら。", "worried"),
      f("平気平気。先生は次の往診先を教えてくれ。", "smile"),
      l("俺も持ちます。揺らさないように行きましょう。", "smile"),
    ],
    [
      a("フィンは、塔の灯りが明るかった頃も知ってる？"),
      f("おう。門を閉めるまで、荷車が通ってた。最近は皆、帰りを急いでるね。", "worried"),
    ],
  ],
  "berne-house-calls": [
    [
      m("次のお家は、この角を曲がったところね。", "smile"),
      f("あの青い戸だ。段差があるから、包みは俺が先に持ってくよ。", "smile"),
    ],
    [
      a("ここだけ、石の色が違うね。"),
      l("新しく埋めた跡かもしれない。踏む前に確かめよう。", "serious"),
    ],
    [
      f("ミラ先生、湯はここに置くぞ。", "smile"),
      m("ありがとう。あら、隣のお宅にも顔を出せそうね。", "smile"),
      f("その前に一口飲もうや。湯が冷めちまう。", "smile"),
    ],
  ],
  "missing-keystone": [
    [a("根っこ、溝の奥まで入ってる。"), l("引っ張ると石まで動く。先に土を払おう。", "serious")],
    [
      f("控えなら、こっちにも一枚ある。", "mischievous"),
      l("どこから持ってきた紙ですか？", "serious"),
      f("石工に借りた分だよ。今度のは、ちゃんと。", "mischievous"),
    ],
    [
      m("こちらから灯りを当てるわね。", "smile"),
      a("見えた。図の線と、ここがつながってる。", "smile"),
      f("おう、印を頼む。俺には似た溝ばかりに見える。", "worried"),
    ],
  ],
  "riverside-manor": [
    [
      f("厨房はこっち。戸を開けるから、荷を頼む。", "serious"),
      l("ありがとうございます。敷居を越えますよ。", "smile"),
    ],
    [
      a("この鉢、葉っぱで前が見えない。", "worried"),
      l("右に一歩。そこで止まって、俺が台を寄せる。", "serious"),
    ],
    [
      m("荷札は、こちら向きでいいのかしら。"),
      f("おう。受け取る人に見せよう。中身を聞かれても困るしね。", "mischievous"),
    ],
  ],
  "matching-lantern-stone": [
    [
      l("この石は、持ち出してよい印がありますね。", "serious"),
      f("あるある。そこは、ちゃんと確かめてもらおう。", "smile"),
    ],
    [
      a("同じ色でも、布をかけると違って見えるね。"),
      m("同じ厚さの布で比べましょう。こちらを使って。", "serious"),
    ],
    [
      f("大きさは、これで足りるかい？"),
      l("幅は合っています。厚みも測ってからにしましょう。", "serious"),
      a("記録の方、私が押さえてるね。", "smile"),
    ],
  ],
  "manor-survey": [
    [
      a("フィン、その鍋、ぶつけないでね。", "worried"),
      f("分かってるって。借りるときより丁寧に運んでるよ。", "mischievous"),
      l("借りるときも丁寧にしてください。", "serious"),
    ],
    [
      m("この布は、どちらへ畳めばいいの？"),
      f("端を内側へ。ほどく人の手が引っかからないようにな。", "smile"),
    ],
    [
      l("出口から、作業場の戸が見えますね。", "serious"),
      a("あの植え込みを通るんだね。覚えた。", "mischievous"),
      l("似た形があるから、通路の札も見ておこう。", "serious"),
    ],
  ],
  "garden-reception": [
    [
      a("この先は鉢の跡が続いてる。今度は札も合ってるよ。", "smile"),
      l("ああ。荷車が通れる幅もある。進もう。", "smile"),
    ],
    [
      f("荷物が減ると、レオンくんの足も軽いねえ。", "mischievous"),
      l("予備は厨房にあります。必要になったら、そこへ戻ります。", "serious"),
    ],
    [
      m("包みの結び目、ほどけていないわ。", "smile"),
      f("助かる。客が来る前に、こっちを片付けようか。", "smile"),
    ],
  ],
  "keystone-night-road": [
    [
      l("荷車を止めよう。斜面に魔物がいる。", "serious"),
      a("私もこっちから射つ。荷物には近づけさせない。", "serious"),
      f("おう。片付いたら、また押そう。", "serious"),
    ],
    [
      m("フィンさん、その手、痛むでしょう。", "worried"),
      f("橋まで行ったら見せるよ。今はこいつを転がしちまおう。", "serious"),
      m("血がにじんだら、すぐ止まってね。", "serious"),
    ],
    [
      a("橋の欄干が見えた！", "smile"),
      l("最後の坂だ。車輪の横へ回る。", "serious"),
      f("まかせとけって。石も先生も、ちゃんと連れてく。", "smile"),
    ],
  ],
  "berne-restoration": [
    [
      f("こちら、お通りくださーい。足元の紐をまたいでな。", "smile"),
      m("その手で柵まで持ち上げないでね。", "worried"),
      f("おう。今日は声を張る役だ。", "smile"),
    ],
    [
      a("この根をよければ、溝の向きが見えるよ。", "serious"),
      l("土を受ける。石は、石工さんに確かめてもらおう。", "serious"),
    ],
    [
      f("ミラ先生、お茶の約束、覚えてるかい。", "smile"),
      m("ええ。こちらの方の手当てが済んだら……。"),
      f("なら、湯を頼んどくよ。四人分な。", "smile"),
    ],
  ],
};
const rests = [
  [
    m("ここで少し休みましょう。水も飲んでね。", "smile"),
    f("助かるねえ。ミラ先生も座りなよ、ここ空いてる。", "smile"),
  ],
  [
    l("荷は木陰へ寄せました。少し休みましょう。", "smile"),
    a("お菓子も出すね。フィン、一つずつだよ。", "smile"),
    f("まだ手も出してないんだがねえ。", "smile"),
  ],
  [
    f("急がば休め、ってね。", "smile"),
    m("手当てが要る方はいない？", "worried"),
    l("ミラさんも、一緒に休んでください。", "worried"),
  ],
  [
    a("ひと休みしよう。お茶、まだ温かいよ。", "smile"),
    f("こりゃいい。先生、一番に飲みなよ。", "smile"),
    m("ありがとう。……では、遠慮なく。", "shy"),
  ],
  [
    l("少し座りましょう。荷の紐も締め直します。", "smile"),
    f("レオンくんの荷、朝より増えてないか？", "mischievous"),
    l("増えていません。念のためです。", "serious"),
  ],
];
const injuredRests = [
  [
    m("手を見せて。包帯を替えたら、お茶にしましょう。", "serious"),
    f("ミラ先生の分も出しとくよ。今度は一緒に座ってくれ。", "smile"),
  ],
  [
    f("かすり傷だって。そんな顔しなさんな。", "mischievous"),
    m("言葉より、この包帯を見ているの。こちらへ手を出して。", "serious"),
  ],
];
export function chapterThreeBanter(run: Run): StoryLine[] | null {
  if (!isChapterThreeQuest(run.quest)) return null;
  const injured = [STONE_RETURN_QUEST, BERNE_RESTORATION_QUEST].includes(run.quest);
  const pool = run.phase === "rest" ? (injured ? injuredRests : rests) : routes[run.quest];
  return pool[Math.floor(run.node / 3) % pool.length];
}
