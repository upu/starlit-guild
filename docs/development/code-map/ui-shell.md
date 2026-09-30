# 下部ナビ・共通ダイアログの枠

見た目の枠を変えるときは、まず次の2ファイルを見る。`app/layout.tsx` は両方を他の画面別 CSS の後に読み込む。

旅団タブの入口は `app/phone-game-frame.tsx` → `app/guild-panel.tsx`。下部の施設操作は `app/guild-toolbar.tsx`、植え付け・作業台・購入は `app/guild-garden.tsx` / `app/guild-workbench.tsx` / `app/guild-shop.tsx`。ホームは `app/guild-scene.tsx`、栽培地の切替は `app/guild-garden-scene.tsx`。Phaserの入口は `app/phaser-guild.tsx` → `app/phaser/guild-game.ts`。床・家具・人物は `app/phaser/guild-painter.ts`、コマは `app/phaser/guild-art.ts`、配置と経路は `lib/guild-stage-model.ts`、現地の担当アイコンは `app/guild-duty-marker.tsx`。ダイアログのPhaser描画は `app/phaser/guild-menu-painter.ts`、画像と人物の共通処理は `app/phaser/guild-sprites.ts`、レシピの操作は `app/guild-recipe-menu.tsx`、商品座標は `lib/guild-menu-model.ts`、素材は `lib/guild-room-art.ts`、Reactの画像は `app/guild-prop-image.tsx` / `app/guild-room-image.tsx`、プランターと成長表示は `app/guild-plot-view.tsx`、商品画像は `app/guild-item-icon.tsx`。日常チャットは `app/guild-chat.tsx` と `lib/guild-presence.ts`。表示は `app/guild.css` / `app/guild-stage.css` / `app/guild-controls.css` / `app/guild-menu.css`。描画方針は [旅団画面の素材](../../art/guild-scenes.md)、仕様は [旅団の拠点機能](../../gameplay/guild-base.md)、検証は `tests/guild.test.mjs` / `tests/guild-stage.test.mjs` / `tests/guild.browser.mjs`。

タイルとパーツ合成の独立した試作は `/guild-lab` → `app/guild-lab/`。部位の取り付け・重なりは `lib/guild-lab-rig.ts`、動作は `lib/guild-lab-model.ts`、腕の測定原点・歩行と待機の角度・補間は `guild-lab-arms.ts`、足の待機への踏み直しは `guild-lab-feet.ts`、表示倍率と住人への追従は `guild-lab-camera.ts`、接地影は `guild-lab-contact.ts`、アリアの腰に固定したスカートの減衰追従は `guild-lab-skirt.ts`、一時的な表情・反応は `guild-lab-affection.ts`。表情パッチは `app/phaser/guild-lab-face.ts`、感情マークと粒子は `guild-lab-effects.ts`。表示寸法の追従は `app/phaser/guild-lab-resolution.ts`、段階縮小は `guild-lab-filter.ts`、余白の表示補正は `lib/guild-lab-art-layout.ts`、素材再生成は `scripts/build-guild-lab-{affection,aria,tiles}.mjs`、アリアの表情マスクは `scripts/guild-lab-face-masks.mjs`。Phaserの構成と素材・検証は [試作の記録](../../art/guild-lab.md) を参照。テスト機能ONだけで開き、既存セーブには接続しない。

| 対象 | 正本 | 画面別の例外 |
| --- | --- | --- |
| 下部ナビの位置・高さ・余白・タブの見た目 | `app/phone-navigation.css` | 序章の列数も同ファイル。画面の中身は `app/navigation.css`、`app/prologue.css`、`app/equipment.css`、`app/adventure-actions.css`。 |
| 通常/セーブのダイアログ枠・閉じるボタン・安全領域 | `app/dialog-shell.css` | 物語は `app/stories.css`、クエストは `app/quest-picker.css`、ショップは `app/shop.css`。セーブ内容の表示は `app/globals.css` と `app/phone.css`。 |

下部ナビの最終的な高さは `--game-nav-height` に従う。固定配置と画面下部の予約領域は同じ変数を参照する。短い画面の画像サイズやラベル調整は残し、高さ指定だけは複数ファイルで競合させない。通常ダイアログと物語ダイアログでは配置が異なるため、物語のルールを共通枠へ移さない。

関連検証は `tests/game-viewport.test.mjs`、`tests/dialog-position.test.mjs`、`tests/story-dialog.test.mjs` と、ビルド済み CSS を使う `tests/dialog-layout.browser.py`。ブラウザーの幅・高さ・安全領域を変えて確認する。スマホ実機の確認とは区別する。
