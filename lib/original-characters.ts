// User-created characters. Sprite slots 8–11 remain reserved for the original atlas.
export const originalCharacters = [
  {
    id: "merrill",
    name: "メリル",
    sprite: 12,
    art: "/characters/merrill.png",
    job: "悪食のドライアド吟遊詩人",
    faction: "マッドハロウィン",
    bio: "左腕の琴を右手で弾き、踊りながら次のひと口を探す。キノコ料理が得意だが、珍しいキノコに手を出しては毒に当たる。魔物も食べる。エルフの耳まで珍しい食材扱いするのは、冗談か本気か分からない。",
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
];
export const originalArt = (sprite: number) =>
  originalCharacters.find((c) => c.sprite === sprite)?.art;
