# 冒険画面の描画・タップ

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [表示用投影](../../../lib/adventure-presentation.ts) の `adventureFrame` / `adventureAction` → [DOM操作](../../../app/map-stage.tsx) の `MapStage` → [Phaser接続](../../../app/phaser-adventure.tsx) の `PhaserAdventure`。Canvas描画は [app/phaser/](../../../app/phaser/)。
- **仕様**: [Phaser冒険画面](../phaser-adventure.md)、[横スクロール戦闘](../../gameplay/scrolling-battle.md)。描画側へ進行・保存の判定を重複させない。
- **検証**: [投影・入力](../../../tests/adventure-presentation.test.mjs)、[描画部品](../../../tests/map-render.test.mjs)、[動作画像](../../../tests/hero-animation.test.mjs)。ブラウザー表示と実機は別に確認。
