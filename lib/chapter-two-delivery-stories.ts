import type { Story, StoryLine } from "./stories.ts";
import { DELIVERY_PREP_QUEST, MOUNTAIN_QUEST, SIGNPOST_QUEST, GOLEM_QUEST } from "./chapter-two.ts";
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
const n = (text: string): StoryLine => ({ text });
// Keep the caller unnamed and without an unmasked portrait. Before she is seen, only her voice speaks.
const v = (text: string) => n("木々の奥からの声「" + text + "」");
// Once the pumpkin-headed figure is visible, label what is seen rather than a name.
const h = (text: string): StoryLine => ({
  speaker: "masked-pumpety",
  expression: "mischievous",
  text,
});
// Named bystanders who speak more than once in a scene get a label.
const s = (who: string, text: string) => n(who + "「" + text + "」");
export const deliveryStories: Story[] = [
  {
    id: DELIVERY_PREP_QUEST + "-departure",
    quest: DELIVERY_PREP_QUEST,
    title: "瓶ごとに、ひと包み",
    place: "第二章 2-3 · ミラの仕事場",
    chapter: "departure",
    lines: [
      n(
        "翌朝、ミラの枕元に朝食の皿が置かれていた。アリアは机に残っていた受け取りの控えを拾い、椅子を寝台のそばへ寄せた。",
      ),
      a("瓶と布、もう頼んであるんだね。これを見せたら受け取れる？", "smile"),
      m("ええ。蜜も一緒にお願いできるかしら。", "smile"),
      a("これ、薬に混ぜると甘くなるんだね。", "smile"),
      m("ええ。それに、この蜜自体が喉の痛みを和らげてくれるの。", "smile"),
      l("じゃあ、これも薬の一つなんですね。"),
      m("山向こうの子たちに届ける分よ。瓶ごとに包んでもらえる？", "smile"),
      a("任せて！　包むほうも、ちゃんとね。", "mischievous"),
      l("薬瓶と蜜は別に包もう。一つ落としても、両方割れないように。", "serious"),
      n("レオンは控えの裏へ瓶と布の数を書き留めた。ミラが寝台から足を下ろそうとする。"),
      m("その前に、ひとつだけ――", "smile"),
      a("私たちは受け取りを、ミラは休息を。", "mischievous"),
      m("……言うことがなくなってしまったわ。", "shy"),
      n("ミラは足を戻し、朝食の匙を手に取った。二人は控えと空の袋を持って店へ向かった。"),
    ],
  },
  {
    id: DELIVERY_PREP_QUEST + "-return",
    quest: DELIVERY_PREP_QUEST,
    title: "三人で持つ薬箱",
    place: "第二章 2-3 · 配達の支度を終えた仕事場",
    chapter: "return",
    lines: [
      n(
        "薬瓶と蜜を別々の布に包み、配達先の荷札を結ぶ。アリアが出来上がった荷を持ち上げると、袋の底が床から少し浮いて止まった。",
      ),
      a("……レオン、布ってこんなに要る？", "worried"),
      l("替えと、その予備だ。念のためだ。", "mischievous"),
      a("包む前に、運ぶ私たちが包みに埋もれそう。", "worried"),
      n("レオンは予備の束を一つ机へ戻した。アリアはもう一度袋を持ち上げ、今度は肩へ掛けた。"),
      n(
        "荷造りが終わる頃には、日が暮れていた。二人は控えを机に置いて引き上げ、ミラは言われたとおりに食事を取って眠った。",
      ),
      n("――翌朝。仕事場の中を普段どおり歩くミラが、荷札を一枚ずつ確かめていた。"),
      m(
        "ありがとう。これなら、山向こうへ持っていけるわ。向こうでは診察も必要だから、私も一緒に。",
        "smile",
      ),
      l("道と荷物は俺たちが見ます。ミラさんは診察と手当てを、お願いできますか。", "serious"),
      m("ええ。私は治療を、二人は前を。", "smile"),
      a("任せて！　三人で行こう。", "smile"),
      n("ミラは自分の薬箱を三人の荷物の隣へ置いた。それから、窓辺の水差しへ手を伸ばす。"),
      m("出る前に、お隣の花にも水を――", "smile"),
      a("今、仕事が一つ増えたよね？", "surprised"),
      m("すぐそこだもの。その前に、ひとつだけ。", "smile"),
      l("薬箱はここで見ています。戻ったら、三人で出ましょう。", "serious"),
    ],
  },
  {
    id: MOUNTAIN_QUEST + "-departure",
    quest: MOUNTAIN_QUEST,
    title: "大小の山賊",
    place: "第二章 2-4 · 山道の入口",
    chapter: "departure",
    lines: [
      n("山から戻った運び手が、空になった菓子の袋を振った。"),
      s("運び手", "子どもほどの山賊でさ"),
      n("隣の運び手が首を振る。"),
      s("もう一人の運び手", "俺が見たのは、荷車より大きかったぞ"),
      a("小さいのと大きいの、二人いるんじゃない？", "surprised"),
      l("そうかもしれない。念のため、両方の場所を聞いておこう。", "serious"),
      m("その前に、ひとつだけ。あなた、その手を見せていただける？", "worried"),
      n("運び手は擦りむいた手を引っ込めかけた。"),
      s("運び手", "逃げたときに擦っただけだよ"),
      m("痛いのは、我慢しなくていいのよ。", "smile"),
      n(
        "ミラが手当てする間に、二人は地図を広げた。小さいほうは分かれ道、大きいほうはその先。荷車は今も通っているが、どちらも甘いものを狙ってくるという。",
      ),
      l("荷物は道の内側へ寄せよう。魔物が出たら、俺が間に入る。", "serious"),
      a("私は先の足場を見るね。ミラ、段差は知らせるから。", "smile"),
      m("ありがとう。包帯も、すぐ出せるところに入れたわ。", "smile"),
    ],
  },
  {
    id: MOUNTAIN_QUEST + "-return",
    quest: MOUNTAIN_QUEST,
    title: "ここは待ちましょう",
    place: "第二章 2-4 · 山道の休憩場所",
    chapter: "return",
    lines: [
      n(
        "道から少し離れた平らな場所へ荷を下ろした。ミラは二人を岩へ座らせると、自分は薬箱の蓋を開いた。",
      ),
      m("包帯を使った分だけ確かめておくわ。二人は休んでいてね。", "smile"),
      a("じゃあ、私はお湯。レオン、カップ出して。", "smile"),
      l("三つ、ここにあります。ミラさんも座ってください。", "smile"),
      n(
        "ミラは箱を閉め、差し出されたカップを受け取った。茶葉へ湯が注がれると、アリアが早くもポットに手を掛けた。",
      ),
      a("もういい？　いい匂いだよ。", "smile"),
      m("急いでいても、ここは待ちましょう。", "serious"),
      l("お茶を待つ時間は、削らないんですね。", "worried"),
      m("お茶には、ちゃんと休んでもらわないと。", "smile"),
      a("ミラにもね。", "mischievous"),
      n(
        "三人は湯気の向こうに続く山道を眺めた。アリアはポットから手を離し、菓子の包みを三人の間へ置いた。",
      ),
    ],
  },
  {
    id: SIGNPOST_QUEST + "-departure",
    quest: SIGNPOST_QUEST,
    title: "これはご挨拶なのよ",
    place: "第二章 2-5 · 山道の分かれ道",
    chapter: "departure",
    lines: [
      n(
        "分かれ道の道標は、地図にない細道を指していた。アリアが根元へしゃがみ、踏まれた草を指で分ける。",
      ),
      a("みんなの足跡、こっちへ続いてる。道標だけ違うよ。", "serious"),
      l("地図の道筋とも合ってるな。ミラさん、前の往診では？", "serious"),
      m("あの曲がった木を通ったわ。細道には入っていないはずよ。", "serious"),
      n(
        "道標がふらりと動いた。根元から小さな木の足が現れ、人形が道標を背負ったままお辞儀をする。木々の奥から声が響いた。",
      ),
      v("Trick or Treat！　お菓子をくれなきゃ、いたずらしちゃうよ！"),
      a("道標、もう持っていってるでしょ！", "serious"),
      v("これはご挨拶なのよ。いたずらは、ここからなのよ"),
      l("アリア、追いすぎるな。道へ戻すぞ。", "serious"),
      a("分かってる。任せて！　道標を持っていくほうを止めるね。", "mischievous"),
      n(
        "人形が木の根を跳び越えた。三人が道標を見上げる間に、もう一つの小さな影が荷物の陰へ回り込んだ。",
      ),
    ],
  },
  {
    id: SIGNPOST_QUEST + "-return",
    quest: SIGNPOST_QUEST,
    title: "ごちそうさまなのよ",
    place: "第二章 2-5 · 戻した道標のそば",
    chapter: "return",
    lines: [
      n(
        "レオンが道標を元の穴へ戻した。アリアは草の踏み跡と矢印を見比べ、ミラは道の先に見覚えのある木を確かめる。",
      ),
      a("これで、次に来た人も迷わないね。", "smile"),
      l("道標がなくても、アリアは足跡で分かるだろ。", "smile"),
      a("行きはね。", "shy"),
      l("……帰りは？", "worried"),
      a("……あれ？　お菓子の包み、開いてる。", "surprised"),
      l("数が減ってるな。", "worried"),
      v("ごちそうさまなのよ！"),
      a("いつの間に！", "surprised"),
      n("小さな人形が菓子を抱えて枝の間へ跳ねた。姿の見えない声だけが、その奥から続く。"),
      v("でも、まだもらってない子がいるのよ"),
      m("薬の包みも確かめましょう。蜜の瓶は……全部あるわ。", "smile"),
      l("荷物の後ろは……やられたな。菓子の包みが、もう一つ空だ。", "worried"),
      a("道標を戻したばかりなのに。今度は何が出てくるの？", "worried"),
      n("返事の代わりに、道の先で重い足音がした。"),
    ],
  },
  {
    id: GOLEM_QUEST + "-departure",
    quest: GOLEM_QUEST,
    title: "まだもらってない子",
    place: "第二章 2-6 · 古い作業場の手前",
    chapter: "departure",
    lines: [
      v("Trick or Treat！　お菓子をくれなきゃ、いたずらしちゃうよ！"),
      a("さっき取っていったでしょ！", "serious"),
      v("あれは小さい子のぶんなのよ。こっちの子、まだもらってないのよ"),
      n(
        "木々の向こうから、荷車より大きなゴーレムが姿を現した。カボチャや飾り紐を付けた大小の人形が、同じようにお辞儀して両手を差し出す。少し後ろでは、パンプキンヘッドをかぶった小柄な影が両手を動かしていた。",
      ),
      a("……一人分、大きすぎない？", "surprised"),
      m(
        "あれ、荷物を運ぶためのゴーレムだわ。でも、こんなおねだりの動きは見たことがないわね。",
        "surprised",
      ),
      l("小さいのと大きいの、どっちの話も本当だったな。アリア、荷物を後ろへ。", "serious"),
      m("薬箱はここに。怪我には手当てを、慌てには深い息を。", "serious"),
      n(
        "アリアが包みを寄せると、大きな手がその上へ伸びた。足元では人形が左右へ散り、袋の紐へ手を掛けようとしている。",
      ),
      a("こっちにも来てる！", "surprised"),
      l("大きい手は俺が押し戻す。小さいほうを頼む。", "serious"),
    ],
  },
  {
    id: GOLEM_QUEST + "-return",
    quest: GOLEM_QUEST,
    title: "それはお薬なの",
    place: "第二章 2-6 · 作業場へ続く脇道",
    chapter: "return",
    lines: [
      n("レオンが大きな手を道の外へ押し戻した。ミラは薬箱を抱え直す。蓋も留め金も外れていない。"),
      l("薬箱は無事ですか？", "worried"),
      m("ええ。二人の傷を見せて――", "worried"),
      a("待って、蜜の包みが！", "surprised"),
      n(
        "足元の人形が布を引き、蜜の瓶を脇道へ運んでいた。大きなゴーレムも後ずさりして、道を塞ぐように向きを変える。",
      ),
      m("待って。それは、喉を痛めている子たちのお薬なの。", "serious"),
      h("甘い匂いがするのよ。プティには分かるのよ！"),
      a("分かるなら、返して！", "serious"),
      n(
        "人形は包みを引いたまま、道脇の古い作業場へ入っていった。木戸の隙間に、見覚えのある布が見える。",
      ),
      l("あの作業場だ。まだ追いつける。", "serious"),
      m("待って。その手、血が出ているわ。アリアも腕を見せて。", "worried"),
      a("私は平気。先に――", "serious"),
      m("痛いのは、我慢しなくていいのよ。二人とも。", "smile"),
      n("レオンは剣を握り直しかけ、ミラへ手を差し出した。"),
      l("……お願いします。", "worried"),
      a("じゃあ、私はここから戸を見てる。出てきたら知らせるね。", "serious"),
      m("ええ。蜜も届けましょう。二人の傷も、そのままにはしないわ。", "smile"),
      n(
        "三人は作業場を見失わない場所へ荷を寄せた。ミラがレオンの手を治療し、続いてアリアの腕へ包帯を巻く。アリアは木戸の隙間を見張り、手当てを終えたレオンが薬箱の紐を結び直した。",
      ),
    ],
  },
];
