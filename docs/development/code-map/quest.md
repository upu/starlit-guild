# 出発・読了・次の行先

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [画面の出発と読了](../../../app/phone-game.tsx) の `phoneStoryActions` → [Action処理](../../../lib/game-actions.ts) の `startAction` / `readStoryAction` → [行先更新](../../../lib/quest-navigation.ts) の `advanceQuestDestination`。[順序](../../../lib/prologue.ts) は `storyStages`。
- **仕様**: [クエストの選択と進行](../../gameplay/quest-navigation.md)、対象章の [実装資料](../../gameplay/README.md#章ごとの実装)。IDは [用語集](../../glossary.md)。
- **検証**: [出発・読了](../../../tests/departure-flow.test.mjs)、[行先](../../../tests/quest-navigation.test.mjs)、[ID](../../../tests/glossary.test.mjs)。
