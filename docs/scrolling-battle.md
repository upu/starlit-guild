# 本編の横スクロール戦闘

第一章・第二章の全18ステージは、自動で右へ進む戦闘・作業画面を使う。途中の選択待ちはなく、タップ補助・技の付け替えとチャットの掛け合いを利用できる。独立した試作ページと試作専用の戦闘処理は正式導入時に撤去した。

## 実装の入口

- `lib/game-engine.ts` と `lib/chapter-road.ts` が本編の行動・移動・襲撃・固定距離の運搬を進める。育成・報酬・保存・留守中精算は同じ本編処理を使う。
- `lib/chapter-road-presentation.ts` が描画用の座標・人物・作業・攻撃を読み取り専用で組み立てる。表示専用の型と人物の並びは `lib/road-view.ts`。
- `app/phaser/chapter-road-painter.ts` が素材読み込みとタップを接続し、`road-painter.ts`・`road-effects.ts` が描画する。画像のコマ位置は `road-art.ts`。
- 小サイズ用の人物・歩行・作業・エフェクトのPNG原本は `assets/source/road/`。配信は `public/animations/road/` のロスレスWebPのみ。開発起動・ビルド時に自動生成し、CIで更新漏れを検査する。

画面上の作業と戦闘の違い・計算・互換性は [戦闘バランス](combat-balance.md)、章全体の時間と次章への引き継ぎは [章別基準](progression-balance.md) を参照する。

## 確認

`tests/chapter-road.test.mjs` と `tests/road-transport.test.mjs` で無操作踏破・報酬・保存互換・オフライン進行・固定距離運搬を検証する。`tests/road-art.test.mjs` は原本とWebPの寸法・透明度・可視画素の一致と更新検知を確認する。

ローカル起動後の `node tests/chapter-road.browser.mjs` は合成セーブと独立したブラウザーを使い、PC・スマホ幅の本編画面、再読み込み、画像読み込み失敗からの再試行を確認する。ユーザーの記録は変更しない。必要なら `PLAYWRIGHT_MODULE`・`TEST_ROOT` を指定する。ブラウザー幅の確認はスマホ実機の体感確認とは区別する。
