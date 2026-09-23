# 戦闘・育成・進行時間

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [戦闘](../../../lib/combat.ts)、[自動進行](../../../lib/game-engine.ts) の `settle`、[戦力](../../../lib/game-rules.ts) の `stats` / `power`、[装備](../../../lib/equipment.ts) の `equipmentBonus`。
- **仕様**: [章ごとの戦力と到達時間](../../gameplay/progression-balance.md) → [戦闘の計算と調整](../../gameplay/combat-balance.md)。章をまたぐ状態と実測時間の区別は [共通ルール](../../agent-rules.md#戦闘育成章のバランス)。
- **検証**: [戦闘](../../../tests/combat.test.mjs)、[進行](../../../tests/game-v4.test.mjs)、[育成](../../../tests/progression-balance.test.mjs)。章別の測定とテスト開始データは仕様資料に従う。
