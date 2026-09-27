# 冒険画面の描画・タップ

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [表示用投影](../../../lib/adventure-presentation.ts) の `adventureFrame` / `adventureAction` → [DOM操作](../../../app/map-stage.tsx) の `MapStage` → [Phaser接続](../../../app/phaser-adventure.tsx) の `PhaserAdventure`。味方の戦闘時の表示間隔は [隊形](../../../lib/road-party-formation.ts)、移動・作業コマの切替は [道中の姿勢](../../../app/phaser/road-poses.ts)。Canvas描画は [app/phaser/](../../../app/phaser/)。
- **仕様**: [Phaser冒険画面](../phaser-adventure.md)、[横スクロール戦闘](../../gameplay/scrolling-battle.md)。描画側へ進行・保存の判定を重複させない。
- **位置の連続性**: [道中の移動演出](../../../lib/road-motion.ts) の `RoadMotion` を `ChapterRoadPainter` ごとに保持し、隊形・作業地点・カメラの切替を補間する。表示位置はエフェクトと回復タップにも共有する。[移動検査](../../../tests/road-motion.test.mjs) で襲撃・撃破・次の地点への遷移、静止条件、表示位置への入力を確認する。
- **荷車の隊列**: [運搬時の配置](../../../lib/road-carrier-formation.ts) で引き手・押し手の画面上の位置と奥行きを決める。[運搬検査](../../../tests/road-transport.test.mjs) で人数・戦闘後の復帰・荷車との位置関係を確認する。
- **検証**: [投影・入力](../../../tests/adventure-presentation.test.mjs)、[描画部品](../../../tests/map-render.test.mjs)、[動作画像](../../../tests/hero-animation.test.mjs)、[リコの歩行・運搬](../../../tests/road-poses.test.mjs)。道中や第三章の画面は [手動テスト](../development.md#ローカルの手動テスト) の `chapter-road.browser.mjs` / `chapter-three.browser.mjs`。ブラウザー表示と実機は別に確認。
- **スマホの鮮明さ**: [描画解像度](../../../app/phaser/adventure-resolution.ts) でCanvas・カメラを高密度化し、[人物の縮小キャッシュ](../../../app/phaser/road-sprite-filter.ts) に描画密度を渡す。[解像度検査](../../../tests/adventure-resolution.test.mjs) / [縮小検査](../../../tests/road-sprite-filter.test.mjs) と、`TEST_DPR=3` を指定した道中のブラウザー検査でサイズ・リサイズ・タップを確認する。

作業ポイントの説明札は [対象位置への追従とチャットの回避](../../../app/phaser/road-work-caption.ts) を参照。

作業ポイントの画像は [全作業文の対応](../../../lib/road-worksite-catalog.ts) → [素材と動作](../../../lib/road-worksite-art.ts) → [表示](../../../lib/chapter-road-work-look.ts)。[全章の点検記録](../../art/worksite-audit.md) と [未登録検査](../../../tests/road-worksites.test.mjs)、`tests/road-worksites.browser.mjs` で追加漏れと小表示を確認する。
