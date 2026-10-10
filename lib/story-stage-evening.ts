import { RETURN_QUEST } from "./prologue.ts";
import { stagePair as pair, type StoryStageCue } from "./story-stage-cues.ts";

export const eveningDepartureId = `${RETURN_QUEST}-departure`;
export const eveningReturnId = `${RETURN_QUEST}-return`;

function evening(background: StoryStageCue["background"], cues: StoryStageCue[]): StoryStageCue[] {
  return cues.map((cue) => ({
    background,
    cartArt: "return-cart",
    initial: { aria: 28, leon: 56 },
    bundleMode: "ground",
    ...cue,
  }));
}

const departure = evening("town-exit", [
  {
    description: "夕方の街の出口で、アリアが帰りの包みを結び直し、レオンが控えを確認する。",
    actors: pair(28, 56, { inspect: true }, { pose: "think" }),
    luggage: true,
  },
  {
    description: "アリアが帰りの買い物を確かめ、レオンへ声をかける。",
    actors: pair(28, 56, { pose: "offer" }),
    luggage: true,
  },
  {
    description: "レオンが村へ続く道を示して頷く。",
    actors: pair(28, 56, {}, { pose: "offer", reaction: "nod" }),
    luggage: true,
  },
  {
    description: "アリアが自分の荷を見て、布を預かったままでよいか尋ねる。",
    actors: pair(28, 56, { pose: "think" }),
    luggage: true,
  },
  {
    description: "レオンが包み直した帰りの荷を示す。",
    actors: pair(28, 56, { pose: "think" }, { pose: "offer" }),
    luggage: true,
  },
  {
    description: "膨らんだ袋を見て、アリアが得意げに言う。",
    actors: pair(28, 56, { pose: "tease" }, { pose: "think" }),
    luggage: true,
  },
  {
    description: "レオンが袋の持ち手を点検し、荷を持ったアリアが道へ進み出る。",
    actors: pair(42, 56, {}, { inspect: true, left: false }),
    luggage: false,
    bundleMode: "carried",
  },
  {
    description: "レオンがアリアに礼を言い、荷車の引き手へ回る。",
    actors: pair(42, 81, {}, { pose: "offer" }),
    luggage: false,
    bundleMode: "carried",
  },
  {
    description: "アリアが笑顔で請け合い、二人は出発を待つ。",
    actors: pair(42, 81, { pose: "tease" }, { pose: "tease" }),
    luggage: false,
    bundleMode: "carried",
  },
]);

const returning = evening("meeting-dusk", [
  {
    description: "村々への分かれ道で荷を下ろし、アリアが通ってきた道を振り返る。",
    actors: pair(28, 56, { left: true, pose: "think" }),
    luggage: true,
  },
  {
    description: "アリアが道中で見かけた魔物を思い出し、レオンに話す。",
    actors: pair(28, 56, { pose: "think" }, { pose: "think" }),
    luggage: true,
  },
  {
    description: "レオンもいつもの帰り道との違いを考え、頷く。",
    actors: pair(28, 56, { pose: "think" }, { pose: "think", reaction: "nod" }),
    luggage: true,
  },
  {
    description: "アリアが湿った草むらの方へ目を向ける。",
    actors: pair(28, 56, { left: true, pose: "think" }),
    luggage: true,
  },
  {
    description: "レオンが次も道の様子を確かめようと話す。",
    actors: pair(28, 56, { pose: "think" }, { pose: "offer" }),
    luggage: true,
  },
  {
    description: "アリアが近づいて畳んだ布を差し出し、レオンが受け取る。",
    actors: pair(40, 56, { pose: "offer" }, { pose: "offer" }),
    luggage: true,
  },
  {
    description: "レオンがアリアの荷の緩んだ紐を示す。",
    actors: pair(40, 56, { pose: "think" }, { pose: "offer" }),
    luggage: true,
  },
  {
    description: "アリアもレオンの袋から出た控えを指摘して笑う。",
    actors: pair(40, 56, { pose: "tease" }, { pose: "think" }),
    luggage: true,
  },
  {
    description: "二人がそれぞれ荷の紐と袋の口を直す。",
    actors: pair(40, 56, { inspect: true }, { inspect: true, left: false }),
    luggage: true,
  },
  {
    description: "アリアが少し離れ、次の交易もここで会おうと手を上げる。",
    actors: pair(32, 56, { wave: true }),
    luggage: true,
  },
  {
    description: "レオンが帰宅を気遣い、荷車の引き手へ回る。",
    actors: pair(32, 81, {}, { pose: "greet" }),
    luggage: true,
  },
  {
    description: "アリアが予備の包みを見て笑い、レオンも笑い返す。",
    actors: pair(32, 81, { pose: "tease" }, { pose: "tease" }),
    luggage: true,
  },
  {
    description: "二人はそれぞれの村へ帰る前に、もう一度手を上げて挨拶する。",
    actors: pair(32, 81, { wave: true }, { wave: true }),
    luggage: true,
  },
]);

const exits: Partial<Record<string, StoryStageCue>> = {
  [eveningDepartureId]: evening("town-exit", [
    {
      description: "アリアが荷を持って村への道を歩き、レオンが帰りの荷車を引いて続く。",
      actors: pair(107, 156, {}, { left: false, pull: true }),
      luggage: false,
      bundleMode: "carried",
      cartX: 139,
    },
  ])[0],
  [eveningReturnId]: evening("meeting-dusk", [
    {
      description: "アリアは自分の荷を持ち、レオンは荷車を引いて、それぞれ別の村への道を進む。",
      actors: pair(-14, 156, { left: true }, { left: false, pull: true }),
      luggage: false,
      bundleMode: "carried",
      cartX: 139,
    },
  ])[0],
};

export function eveningStageCue(storyId: string, line: number): StoryStageCue | null {
  const cues =
    storyId === eveningDepartureId ? departure : storyId === eveningReturnId ? returning : [];
  return cues[line] ?? null;
}
export function eveningExitCue(storyId: string): StoryStageCue | null {
  return exits[storyId] ?? null;
}
