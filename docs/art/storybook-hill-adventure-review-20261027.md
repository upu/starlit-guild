# 第一章1-4 丘の塔への道（2026-10-27）

対象は `tower-road`。用語集、第一章の実装本文、地図帳の「リンデ・二つの村」の既存設定を照合した。畑の先の小さな林から塔へ向かう関係を保ち、新しい場所・方角・道筋は追加していない。一枚絵・会話・保存・進行と戦闘の判定は変更していない。

## 変更

- 会話の斜め奥へ延びる道をそのまま横移動へ使わず、見下ろす角度、植生、小石、柵の縮尺を合わせた横方向の路面を生成。畑と広葉樹の林は通行帯の外へ置いた。反復の境界は隣接する同じ原画の端を反転で合わせる。
- 塔は別の透明素材とし、冒険の到着地点の世界座標へ固定。背景の反復で塔が何本も現れたり、進む人物へ塔が追従したりしない。幅は人物の表示基準高の3.2倍、扉は人が通れる大きさ。終盤の近距離では塔の上部が画面外になる。
- 薬草と採取は検証済みの小群落・空いた手で摘む姿勢を使い、人物の足と草の根元を離す。立位・歩行・採取・戦闘で既存の共通倍率と足底を保つ。
- 夜道の背景も同じ路面から生成し保存した。これは準備素材であり、瓶の携行・光・戦闘前後の動作が未完了のため `moss-night-road` にはまだ適用していない。

## 実表示と検査

PC1243×1244は15地点の道程を約58秒で再生。スマホ幅390×844は同じ道程を再生し、到着を確認。スマホの終盤は記録間隔が空いたため、専用の「塔の手前から」で再度連続撮影し、塔の扉と人物の比率、固定された接近、薬草への移動を確認した。採取姿勢も両幅で確認。ブラウザーのスマホ幅でありスマホ実機ではない。見本の到着後の待機配置への切り替えは、本編の帰還会話の確認と区別する。

- 通し再生：`work/hill-ui-pc.json`、`hill-verified-pc-*.png`、`hill-ui-mobile.json`、`hill-verified-mobile-*.png`。
- スマホ終盤の連続撮影：`work/hill-ending-mobile.json`、`hill-ending-mobile-*.png`。
- 採取の静止確認：`work/hill-forage-mobile-final.png`。初期の `hill-forage-mobile.png` は読込中のため確認証跡に使わない。
- 43テスト：`work/hill-regression-final.log`。塔の世界座標・両幅での人物との比率・薬草との接点・状態不変・描画姿勢・移動経路・反復境界を含む。
- 型検査・対象lint・ビルド：`work/hill-typecheck-final.log`、`hill-lint-final.log`、`hill-build-final.log`。

編集元は `lib/storybook/adventure.ts`、`lib/road-scrolling-background.ts`、`app/phaser/road-scenery.ts`、`road-storybook-poses.ts`。梱包は `scripts/build-storybook-hill.mjs`。原画・完全な生成指示は `docs/art-generation/storybook-hill-adventure-20261027.json`。確認ページは `/sprite-lab/storybook/hill`。

既定の手描き冒険は7/37。残り30冒険、未変換の作業物、敵と特殊演出、会話初回の背景表示、全章の最終通し確認は未完了。登録数を全体の動作品質の証明には使わず、ゴールを継続する。
