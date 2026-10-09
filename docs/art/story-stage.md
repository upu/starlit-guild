# 会話のミニキャラ舞台

1-1出発話「いつもの待ち合わせ」の試作。演出は [台詞別の定義](../../lib/story-stage.ts)、画面は [StoryStage](../../app/story-stage.tsx) を参照する。

## 採用素材

`assets/source/story-stage/` のPNG原本を [配信生成](../../scripts/build-story-stage-art.mjs) で `public/story-stage/` のWebPへ変換する。`npm run story-stage-art:optimize` / `story-stage-art:check` で生成・鮮度確認する。原本は無加工で保存し、配信時だけ縮小する。透明な荷車と手荷物はアルファを維持する。背景・荷車・人物を共通の3:2座標に配置し、画面幅によってそれぞれ別の倍率にならないようにする。

- `meeting-path-v1.png`: 二つの村の道が合わさる場所。広域マップの俯瞰から、人物と同じ高さの近景へ変更。新しい地点や方角は追加しない。
- `loaded-cart-v1.png`: 村の交易品の木箱・大袋・籠に、二枚の雨布・替えの紐・薬草用の小袋・予備の包みを加えた荷車。
- `travel-bundle-v1.png`: アリアの布包みと肩掛け袋。

生成は組み込み `image_gen`。全文プロンプトは [制作記録](../art-generation/story-stage-20261009.json)、原本と配信のSHA-256は `public/story-stage/manifest.json`。

レオンの荷の点検（22–23コマ）・荷車の引き手（20–21コマ）は冒険の共通素材、その他はホームの待機・歩行・挨拶を使う。両アトラスで人物の頭身と足元を合わせる。冒頭はレオンだけが点検し、次の地の文でアリアが登場する。出発時も荷車を表示し、移動させる。

布の受け渡し専用ポーズは未制作。本文で受け渡しを伝え、画面は接近と荷の点検を表示する。
