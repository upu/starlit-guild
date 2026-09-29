# 下部ナビ・共通ダイアログの枠

見た目の枠を変えるときは、まず次の2ファイルを見る。`app/layout.tsx` は両方を他の画面別 CSS の後に読み込む。

旅団タブの入口は `app/phone-game-frame.tsx` → `app/guild-panel.tsx`。菜園・作業台・種と材料は `app/guild-garden.tsx` / `app/guild-workbench.tsx` / `app/guild-shop.tsx`、見下ろすホームは `app/guild-scene.tsx`、栽培地の切替は `app/guild-garden-scene.tsx`、担当者の歩行は `app/guild-residents.tsx` / `app/guild-figure.tsx`、作物は `app/guild-plant.tsx`、日常一覧は `app/guild-conversations.tsx`。表示は `app/guild.css`。背景と配置は [旅団画面の素材](../../art/guild-scenes.md)。仕様は [旅団の拠点機能](../../gameplay/guild-base.md)、検証は `tests/guild.test.mjs` と `tests/guild.browser.mjs`。

| 対象 | 正本 | 画面別の例外 |
| --- | --- | --- |
| 下部ナビの位置・高さ・余白・タブの見た目 | `app/phone-navigation.css` | 序章の列数も同ファイル。画面の中身は `app/navigation.css`、`app/prologue.css`、`app/equipment.css`、`app/adventure-actions.css`。 |
| 通常/セーブのダイアログ枠・閉じるボタン・安全領域 | `app/dialog-shell.css` | 物語は `app/stories.css`、クエストは `app/quest-picker.css`、ショップは `app/shop.css`。セーブ内容の表示は `app/globals.css` と `app/phone.css`。 |

下部ナビの最終的な高さは `--game-nav-height` に従う。固定配置と画面下部の予約領域は同じ変数を参照する。短い画面の画像サイズやラベル調整は残し、高さ指定だけは複数ファイルで競合させない。通常ダイアログと物語ダイアログでは配置が異なるため、物語のルールを共通枠へ移さない。

関連検証は `tests/game-viewport.test.mjs`、`tests/dialog-position.test.mjs`、`tests/story-dialog.test.mjs` と、ビルド済み CSS を使う `tests/dialog-layout.browser.py`。ブラウザーの幅・高さ・安全領域を変えて確認する。スマホ実機の確認とは区別する。
