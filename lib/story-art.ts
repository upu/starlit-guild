export type StoryArt = {
 src: string;
 alt: string;
 width: number;
 height: number;
 revealAtLine: number;
};

// Reveal illustrations with the scene, rather than previewing later events.
export const storyArt: Partial<Record<string, StoryArt>> = {
 'moonlit-herbs-return': {
  src: '/stories/mira-collapse.png',
  alt: '膝が折れて倒れたミラの上体をレオンが支え、アリアが荷物をどけてそばへ駆け寄る。机には作りかけの薬が残っている。',
  width: 1536, height: 1024, revealAtLine: 6,
 },
 'tower-moss-removal-return': {
  src: '/stories/tower-light-restored.png',
  alt: '夕暮れの丘で、アリアとレオンが低い石に寄り添って座り、正面の塔を見上げる後ろ姿。塔の窓には淡い紫の光がともり、広がる風景を絵筆の跡を残して描いている。',
  width: 1536, height: 1024, revealAtLine: 6,
 },
 'forest-wetland-return': {
  src: '/stories/forest-moss-aria.webp',
  alt: '木漏れ日が差す苔むした石壁の前で、二つの苔の入れ物を顔の近くへ持ち上げて見比べるアリア。金髪と緑の瞳、羽飾りのある緑のフードを繊細に描いている。',
  width: 1536, height: 1024, revealAtLine: 5,
 },
 'tower-road-return': {
  src: '/stories/tower-moss-discovery.png',
  alt: '塔の足元で、アリアが木べらで分けた光る苔を、レオンの持つ浅い木の入れ物へ寄せる。小さな苔灯が二人の手元を淡く照らす。',
  width: 1536, height: 1024, revealAtLine: 20,
 },
 'village-trade-return': {
  src: '/stories/village-trade-handover.png',
  alt: '街の店先で、アリアが布で包んだ薬草を店主に渡し、レオンが村から預かった交易品を台に置く。',
  width: 1536, height: 1024, revealAtLine: 0,
 },
 'visit-merrill-poppy': {
  src: '/stories/merrill-poppy-tasting.png',
  alt: '薬草園で紫色の試作品を飲み、苦さに顔をしかめるメリルと、飲んだことに気づいて慌てるポピー。メリルは籠手を外し、素手で瓶を持っている。',
  width: 1536, height: 1024, revealAtLine: 3,
 },
 'visit-pumpety-finn': {
  src: '/stories/pumpety-finn-keepsake.png',
  alt: 'かぼちゃの人形にお辞儀をさせ、真鍮の鍵を返すプティ。フィンは胸元で大切な木のボタンを握っている。',
  width: 1536, height: 1024, revealAtLine: 6,
 },
 'camp-chacha-mira': {
  src: '/stories/chacha-mira-tea.png',
  alt: '銀の鎧と青い服のチャチャが大剣を脇に置いてカップを持ち、ミラが砂時計を置き直す酒場のお茶の時間。',
  width: 1536, height: 1024, revealAtLine: 3,
 },
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
