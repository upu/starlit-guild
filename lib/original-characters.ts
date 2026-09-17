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
];
export const originalArt = (sprite: number) =>
  originalCharacters.find((c) => c.sprite === sprite)?.art;
