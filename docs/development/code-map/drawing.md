# 冒険画面の描画・タップ

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [表示用投影](../../../lib/adventure-presentation.ts) の `adventureFrame` / `adventureAction` → [DOM操作](../../../app/map-stage.tsx) の `MapStage` → [Phaser接続](../../../app/phaser-adventure.tsx) の `PhaserAdventure`。味方の戦闘時の表示間隔は [隊形](../../../lib/road-party-formation.ts)、移動・作業コマの切替は [道中の姿勢](../../../app/phaser/road-poses.ts)。Canvas描画は [app/phaser/](../../../app/phaser/)。
- **仕様**: [Phaser冒険画面](../phaser-adventure.md)、[横スクロール戦闘](../../gameplay/scrolling-battle.md)。描画側へ進行・保存の判定を重複させない。
- **検証**: [投影・入力](../../../tests/adventure-presentation.test.mjs)、[描画部品](../../../tests/map-render.test.mjs)、[動作画像](../../../tests/hero-animation.test.mjs)、[リコの歩行・運搬](../../../tests/road-poses.test.mjs)。道中や第三章の画面は [手動テスト](../development.md#ローカルの手動テスト) の `chapter-road.browser.mjs` / `chapter-three.browser.mjs`。ブラウザー表示と実機は別に確認。
