# キャラクター・装備・ショップ

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [画面](../../../app/equipment-panels.tsx) の `CharacterPanel` / `InventoryPanel`、[人物切替スワイプ](../../../app/use-character-swipe.ts)、[レベル・EXP表示](../../../app/character-level.tsx) → [レベル式](../../../lib/roster.ts) の `level` / `levelProgress`、[装備](../../../lib/equipment.ts) の `equipment` / `buyEquipment` / `changeEquipment`、[技](../../../lib/techniques.ts)。
- **仕様**: [ゲームプレイ仕様](../../gameplay/gameplay.md)、対象章の [実装資料](../../gameplay/README.md#章ごとの実装)。所持品と装備はセーブに関わる。
- **検証**: [装備・保存](../../../tests/equipment.test.mjs)、[バッグ表示](../../../tests/inventory.test.mjs)、[レベル・EXP表示](../../../tests/character-level.test.mjs)。人物画面は [手動テスト](../development.md#ローカルの手動テスト) の `character-panel.browser.mjs`。

- **消耗品**: [品・購入・登録](../../../lib/consumables.ts)、[アイテム枠・バッグ](../../../app/consumable-panels.tsx)、[消耗品の購入詳細](../../../app/consumable-shop-detail.tsx)。武器・防具の選択は [character-loadout.tsx](../../../app/character-loadout.tsx)。[消耗品テスト](../../../tests/consumables.test.mjs)と人物画面のブラウザー検証を使う。
