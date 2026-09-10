export type StoryArt = {
 src: string;
 alt: string;
 width: number;
 height: number;
 revealAtLine: number;
};

// Reveal illustrations with the scene, rather than previewing later events.
export const storyArt: Record<string, StoryArt> = {
 'herbs-departure': {
  src: '/stories/first-map.png',
  alt: '森の拠点で地図を広げるアリアと、その隣で道を確かめるレオン。',
  width: 1536, height: 1024, revealAtLine: 0,
 },
 'pilgrim-return': {
  src: '/stories/fireside.png',
  alt: '同じ丸太に並んで腰を下ろし、焚き火に照らされるアリアとレオン。ふたりの手の間には小さな隙間がある。',
  width: 1536, height: 1024, revealAtLine: 6,
 },
 'crystal-departure': {
  src: '/stories/lantern-between.png',
  alt: '青晶石の光る洞窟の入り口で、アリアとレオンが並び、ふたりの間のランタンで足元を照らす。',
  width: 1536, height: 1024, revealAtLine: 3,
 },
 'slime-return': {
  src: '/stories/mended-sleeve.png',
  alt: 'アリアがレオンの袖の小さなほつれを繕い、レオンが針を持つ手を静かに見守る。',
  width: 1536, height: 1024, revealAtLine: 3,
 },
 'blossom-return': {
  src: '/stories/pressed-petals.png',
  alt: '花咲く森で、アリアが落ちていた花びらを旅の手帳にはさみ、レオンが隣で話を聞く。',
  width: 1536, height: 1024, revealAtLine: 0,
 },
 'royal-return': {
  src: '/stories/festival-promise.png',
  alt: '星の祭りの灯りを前に、アリアがレオンへ半歩近づき、ふたりで歩き出そうとする。',
  width: 1536, height: 1024, revealAtLine: 3,
 },
 'recruit-mira-joined': {
  src: '/stories/mira-own-tea.png',
  alt: '往診から戻ったミラが自分の分の茶葉を量り、アリアとレオンが拠点で迎える。',
  width: 1536, height: 1024, revealAtLine: 3,
 },
 'recruit-garr-joined': {
  src: '/stories/garr-last-luggage.png',
  alt: '直った橋のたもとでレオンがガルの荷物を引き受け、ガルが空いた自分の手を見つめる。',
  width: 1536, height: 1024, revealAtLine: 3,
 },
 'recruit-luna-joined': {
  src: '/stories/luna-chart-margin.png',
  alt: '夜明け前の星空の下、ルナが星図を広げ、ガル、アリア、レオンがそばで話を聞く。',
  width: 1536, height: 1024, revealAtLine: 3,
 },
 'recruit-poppy-joined': {
  src: '/stories/poppy-first-sip.png',
  alt: '小さな芽の出た薬草園で、ルナが飲み終えた薬瓶を持ち、ポピーがほっと肩の力を抜く。',
  width: 1536, height: 1024, revealAtLine: 3,
 },
};

export function storyArtAt(storyId: string, lineIndex: number): StoryArt | undefined {
 const art = storyArt[storyId];
 return art && lineIndex >= art.revealAtLine ? art : undefined;
}
