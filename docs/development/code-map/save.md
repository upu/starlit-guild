# セーブ・復帰・バックアップ

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [画面との接続](../../../app/use-local-game.ts) の `useLocalGame` → [端末保存・バックアップ](../../../app/local-game-state.ts) の `useLocalPersistence` / `useBackup`、画面を開いている間だけ進める `useLocalAdvance` の `advance` / `resume`（[時間の精算](../../../lib/game-engine.ts) の `settleOnScreen` / `skipTo`）、[復帰・複数タブ](../../../app/local-game-lifecycle.ts) の `useLocalGameLifecycle`。形式は [parseBundle](../../../lib/save-format.ts)、旧状態は [migrate](../../../lib/game-migrations.ts)。
- **仕様**: [セーブシステム](../../gameplay/save-system.md)。既存記録を初期化・置換しない。
- **検証**: [形式・移行](../../../tests/game-v4.test.mjs)、[復帰・複数タブ](../../../tests/mobile-lifecycle.test.mjs)。バックアップAPIは [手動テスト](../development.md#ローカルの手動テスト) の `api-backup.integration.mjs`。

- **消耗品の互換性**: [save-consumables.ts](../../../lib/save-consumables.ts) で在庫・登録・周回効果を検証する。旧v4の欠落項目は空の扱いで、読み込み時に消費しない。[消耗品テスト](../../../tests/consumables.test.mjs) を参照。

- **旅団の実時刻**: `lib/guild-engine.ts` の `settleGuild` を `settle` / `skipTo` / `act` から呼ぶ。`lib/guild-production.ts` が植え付け・仕込み・完了、`lib/guild-actions.ts` が操作、`lib/guild-content.ts` が数値、`lib/save-guild.ts` が保存検証。`tests/guild.test.mjs` で留守中の進行と時計の逆行を確認する。
