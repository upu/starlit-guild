# 出発・読了・次の行先

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [画面の出発と読了](../../../app/phone-game.tsx) の `phoneStoryActions` → [Action処理](../../../lib/game-actions.ts) の `startAction` / `readStoryAction` → [行先更新](../../../lib/quest-navigation.ts) の `advanceQuestDestination` / `replayQuestDestination`。Auto-Nextの自動出発は `game-actions.ts` の `departNextStage`（読了時）と `continueAutoNext`（クリア時。[放置進行](../../../lib/game-engine.ts) の `settleSquad` からも呼ぶ）、出発前の会話の判定は [物語](../../../lib/stories.ts) の `departureStory`。Auto-Nextが未読の会話の前で止まったときに会話を開くのは `phone-game.tsx` の `autoDeparture`、会話前の「N-N ステージ名」は [会話読者](../../../app/story-scenes.tsx) の `StageStoryReader`。[順序](../../../lib/prologue.ts) は `storyStages`。
- **仕様**: [クエストの選択と進行](../../gameplay/quest-navigation.md)、対象章の [実装資料](../../gameplay/README.md#章ごとの実装)。IDは [用語集](../../glossary.md)。
- **検証**: [出発・読了](../../../tests/departure-flow.test.mjs)、[行先](../../../tests/quest-navigation.test.mjs)、[ID](../../../tests/glossary.test.mjs)。行先画面は [手動テスト](../development.md#ローカルの手動テスト) の `quest-picker.browser.mjs`。
