// User-created characters. Sprite slots 8–11 remain reserved for the original atlas.
export const originalCharacters = [
  {
    id: "merrill",
    name: "メリル",
    sprite: 12,
    art: "/characters/merrill.png",
    job: "悪食のドライアド吟遊詩人",
    faction: "マッドハロウィン",
    bio: "左腕の甲側に弦を張ったガントレット型の琴を右手で弾き、踊りながら次のひと口を探す。エルフの耳も、小動物も、魔物も気になる。悪気はないが、止めないと本当に食べる。",
  },
  {
    id: "pumpety",
    name: "パンプティ",
    sprite: 13,
    art: "/characters/pumpety.png",
    job: "夜目のきくドールマスター",
    faction: "マッドハロウィン",
    bio: "愛称はプティ。八重歯とツインテールが目印。ドワーフの血を引き、暗闇でもよく見える。人形にいたずらをさせて、本人は無実の顔。",
  },
  {
    id: "chacha",
    name: "チャチャ",
    sprite: 14,
    art: "/characters/chacha.png",
    job: "茶と筋肉の天使",
    faction: "星灯りの旅団",
    bio: "お茶の蒸らし時間に筋トレをする、おっとりした天使の少女。柔らかな物腰と、見た目以上の力持ち。肉弾戦に向かない種族のはずが、大剣でだいたい解決する。",
  },
];
export const chachaHero = {
  id: "chacha",
  name: "チャチャ",
  job: "茶と筋肉の天使",
  mark: "茶",
  color: "#e8a271",
  stats: [9, 24, 42],
  price: 0,
  trait: "おっとり豪腕",
  bio: originalCharacters[2].bio,
  sprite: 14,
  unlock: 6,
};
export const originalArt = (sprite: number) =>
  originalCharacters.find((c) => c.sprite === sprite)?.art;
