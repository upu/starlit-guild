# 昼食とベルネ帰還の見下ろし舞台（2026-10-27）

「私が用意するお昼」`interlude-walnut-lunch` は既存の丘・村の屋根・畑の位置を保った手描き背景へ接続した。塔との相対位置は追加設定していない。一枚絵・本文・表情指定・セーブは変更していない。

人物は `aria-lunch-v1` / `leon-lunch-v1` の各8姿勢。立位134/144pxを基準に一つの倍率で座位も梱包し、足底176pxに固定。手と独立した菓子・水筒・紐を登録し、菓子を拾う、互いの掌へ渡す、膝元から口へ運ぶ、かじった菓子へ変わる、水筒の蓋へ伸ばしかけて止める、紐を渡して包む動作を台詞へ合わせた。人物全体を滑らせて小物へ合わせない。動作中は次表示への進行を待つ。

- 実装：`lib/storybook/lunch-cue.ts`、`app/storybook/lunch.css`、`scripts/build-storybook-lunch-overlook.mjs`。共通の接続は `carry-cue.ts` / `presentation.ts` / `stage.tsx`。
- 素材原画・完全な指示・不採用の厚い荷札：`docs/art-generation/storybook-lunch-overlook-20261027.json`。
- 検査：`tests/storybook-lunch.test.mjs`。床から手への接触、掌間の受け渡し、水筒の設置、菓子保持と空いた手の使い分け、32表示の固定足元、共通倍率を検査。
- 実表示：PC1243×1244・ブラウザーのスマホ幅390×844で32表示ずつ。カウンターを読みながら順次進行し、主要4動作も連続撮影。手より菓子が浮く位置と、包みが膝の奥へ重なる位置を修正。変更後の食事と終盤は両幅で再確認。スマホ実機での確認ではない。
- 証跡：`work/lunch-ui-pages.json`、`lunch-verified-{pc,mobile}-*.png`、`lunch-pass-fixed-pc-*.png`、`lunch-eating-final-{pc,mobile}-*.png`。初期試行の `lunch-first-*` / `lunch-final-*` は修正前。
- 関連22テスト、型検査、対象lint、最終Vinextビルド成功。`work/lunch-final-{tests,typecheck,lint,build}.log`。

ベルネ帰還 `berne-road-return` は、別途 `overlook-cue.ts` / `overlook.css` へ接続済み。薄い綴じ紙、低い石の縁、フィンの着席と保持、レオンが紙の綴じ角を指す動作をPC・スマホ幅各14表示で確認。今回、着席の補間配列に残っていた型エラーも修正した。

現時点の登録監査は手描き1402表示・一枚絵296表示・旧舞台0・登録画像欠落0。これは登録範囲の証拠であり、全章の全動作が最終確認済みという意味ではない。冒険は37場面中3場面まで。15種の未変換作業道具、残りの背景・敵・効果、全章PC/スマホ幅の最終動作確認、初回背景読み込みの一瞬の単色表示が残る。全体ゴールは未完了。
