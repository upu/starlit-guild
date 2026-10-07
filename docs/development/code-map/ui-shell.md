# 下部ナビ・共通ダイアログの枠

制作向けの動きの比較は `/sprite-lab`（`app/sprite-lab/layout.tsx` / `page.tsx` / `studies.ts`）が入口。`walk` / `tea` / `work` / `garden` で共通見本と本編の素材を比較し、公開はテスト機能ONだけ。旧 `/guild-lab/*-study` は転送のみ。部屋・家具配置の試作 `/guild-lab` とは分け、どちらも本編セーブを書き換えない。

見た目の枠を変えるときは、まず次の2ファイルを見る。`app/layout.tsx` は両方を他の画面別 CSS の後に読み込む。

旅団タブの入口は `app/phone-game-frame.tsx` → `app/guild-panel.tsx`。下部の施設操作は `app/guild-toolbar.tsx`、植え付け・作業台・購入は `app/guild-garden.tsx` / `app/guild-workbench.tsx` / `app/guild-shop.tsx`。ホームは `app/guild-scene.tsx`、栽培地の切替は `app/guild-garden-scene.tsx`。ショップ専用Phaserの入口は `app/phaser-guild.tsx` → `app/phaser/guild-game.ts`。床は `app/phaser/guild-painter.ts`、棚・商品は `app/phaser/guild-menu-painter.ts`、画像の共通処理は `app/phaser/guild-sprites.ts`。`lib/guild-stage-model.ts` の在室・加工状態は現行ホームでも使用する。現地の担当アイコンは `app/guild-duty-marker.tsx`、レシピの操作は `app/guild-recipe-menu.tsx`、商品座標は `lib/guild-menu-model.ts`、素材は `lib/guild-room-art.ts`、Reactの画像は `app/guild-prop-image.tsx` / `app/guild-room-image.tsx`、プランターと成長表示は `app/guild-plot-view.tsx`、商品画像は `app/guild-item-icon.tsx`。日常チャットは `app/guild-chat.tsx` と `lib/guild-presence.ts`。表示は `app/guild.css` / `app/guild-stage.css` / `app/guild-controls.css` / `app/guild-menu.css`。描画方針は [旅団画面の素材](../../art/guild-scenes.md)、仕様は [旅団の拠点機能](../../gameplay/guild-base.md)、検証は `tests/guild.test.mjs` / `tests/guild-stage.test.mjs` / `tests/guild.browser.mjs`。

旅団の床・家具・住人は `app/home-room.tsx` → `app/phaser/home-room-game.ts` / `home-room-art.ts`。5人の全身コマは `lib/home-actor.ts`、経路と席の予約は `lib/home-room-life.ts`、茶席の挨拶と返事の間は `lib/home-room-social.ts`、マス配置は `lib/home-room-layout.ts`、保存時の検査は `lib/home-room-schema.ts`。`/guild-lab` は全員がいる独立した試作で、ゲームのセーブへ書き込まない。家具配置は本編では未開放で試作に残す。施設の状態表示は `lib/guild-ui-status.ts`、作る品の選択は `app/guild-recipe-menu.tsx`、共通の見た目は `app/guild-production.css`。[制作と確認](../../art/guild-lab.md) を参照。

| 対象 | 正本 | 画面別の例外 |
| --- | --- | --- |
| 下部ナビの位置・高さ・余白・タブの見た目 | `app/phone-navigation.css` | 序章の列数も同ファイル。画面の中身は `app/navigation.css`、`app/prologue.css`、`app/equipment.css`、`app/adventure-actions.css`。 |
| 通常/セーブのダイアログ枠・閉じるボタン・安全領域 | `app/dialog-shell.css` | 物語は `app/stories.css`、クエストは `app/quest-picker.css`、ショップは `app/shop.css`。セーブ内容の表示は `app/globals.css` と `app/phone.css`。 |

下部ナビの最終的な高さは `--game-nav-height` に従う。固定配置と画面下部の予約領域は同じ変数を参照する。短い画面の画像サイズやラベル調整は残し、高さ指定だけは複数ファイルで競合させない。通常ダイアログと物語ダイアログでは配置が異なるため、物語のルールを共通枠へ移さない。

関連検証は `tests/game-viewport.test.mjs`、`tests/dialog-position.test.mjs`、`tests/story-dialog.test.mjs` と、ビルド済み CSS を使う `tests/dialog-layout.browser.py`。ブラウザーの幅・高さ・安全領域を変えて確認する。スマホ実機の確認とは区別する。

旅団本編の施設＋・担当アイコンは `app/home-room-markers.tsx`、座標は `lib/home-room-markers.ts`。`app/home-room.tsx` の虫眼鏡は本編・試作共通で、停止・動きを減らすボタンは試作の `studyControls` だけに表示する。
