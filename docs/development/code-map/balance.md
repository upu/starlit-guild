# 戦闘・育成・進行時間

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [戦闘](../../../lib/combat.ts)、[自動進行](../../../lib/game-engine.ts) の `settle`、[戦力](../../../lib/game-rules.ts) の `stats` / `power`（作業量 `workTarget`・1回の作業量 `actorOutput`・行動間隔 `actorPeriod` は実際の進行と所要時間の見積もりで共用）、[装備](../../../lib/equipment.ts) の `equipmentBonus`。
- **仕様**: [章ごとの戦力と到達時間](../../gameplay/progression-balance.md) → [戦闘の計算と調整](../../gameplay/combat-balance.md)。章をまたぐ状態と実測時間の区別は [共通ルール](../../agent-rules.md#戦闘育成章のバランス)。
- **検証**: [戦闘](../../../tests/combat.test.mjs)、[進行](../../../tests/game-v4.test.mjs)、[通し試走（手動）](../../../tests/chapter-runs.balance.mjs)。章別の測定とテスト開始データは仕様資料に従う。
- **クエストごとの違い**: 区間の種類・名前の繰り返し、作業中の行動の表示文、戦闘の難度（`rank`）・作業の難度、敵の攻撃文、到着の表示は、各クエスト定義の `style`（型は [game-content.ts](../../../lib/game-content.ts) の `QuestStyle`）に書く。エンジン・ルール・戦闘はクエストIDで分岐せず `style` を読む。区間ごとに作業を決める章は [game-rules.ts](../../../lib/game-rules.ts) の `scriptedWork` がまとめて呼ぶ。
- **区間数と敵の画像番号**: 標準の区間数 `STANDARD_QUEST_NODES` と短い区間割りの判定 `shortRoute` は [puppet-battles.ts](../../../lib/puppet-battles.ts)、依頼の `enemy` が指す画像番号と単独の強敵判定は [quest-sprites.ts](../../../lib/quest-sprites.ts)。
- **第四章の敵固有行動**: [召喚・回復・麻痺](../../../lib/chapter-four-battles.ts)、[敵側の掛け合い](../../../lib/chapter-four-battle-banter.ts)、[演出への投影](../../../lib/chapter-four-battle-presentation.ts)。[専用テスト](../../../tests/chapter-four-battles.test.mjs)と[第四章仕様](../../gameplay/chapter-four-gameplay.md#リコメリルの対立)を併せて確認する。

- **消耗品の自動使用**: [consumable-effects.ts](../../../lib/consumable-effects.ts) を被弾直後と `makeRun` から呼び、区間経験値へ反映する。[消耗品テスト](../../../tests/consumables.test.mjs)で専用戦闘・更新刻みの一致を確認し、通し試走はアイテムなしで比較する。
