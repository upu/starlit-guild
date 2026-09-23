# キャラクター・装備・ショップ

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [画面](../../../app/equipment-panels.tsx) の `CharacterPanel` / `InventoryPanel` → [装備](../../../lib/equipment.ts) の `equipment` / `buyEquipment` / `changeEquipment`、[技](../../../lib/techniques.ts)。
- **仕様**: [ゲームプレイ仕様](../../gameplay/gameplay.md)、対象章の [実装資料](../../gameplay/README.md#章ごとの実装)。所持品と装備はセーブに関わる。
- **検証**: [装備・保存](../../../tests/equipment.test.mjs)、[バッグ表示](../../../tests/inventory.test.mjs)。人物画面は [手動テスト](../development.md#ローカルの手動テスト) の `character-panel.browser.mjs`。
