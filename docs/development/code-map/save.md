# セーブ・復帰・バックアップ

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [画面との接続](../../../app/use-local-game.ts) の `useLocalGame` → [端末保存・バックアップ](../../../app/local-game-state.ts) の `useLocalPersistence` / `useBackup`、画面を開いている間だけ進める `useLocalAdvance`（[時間の精算](../../../lib/game-engine.ts) の `settleOnScreen`）、[復帰・複数タブ](../../../app/local-game-lifecycle.ts) の `useLocalGameLifecycle`。形式は [parseBundle](../../../lib/save-format.ts)、旧状態は [migrate](../../../lib/game-migrations.ts)。
- **仕様**: [セーブシステム](../../gameplay/save-system.md)。既存記録を初期化・置換しない。
- **検証**: [形式・移行](../../../tests/game-v4.test.mjs)、[復帰・複数タブ](../../../tests/mobile-lifecycle.test.mjs)。バックアップAPIは [手動テスト](../development.md#ローカルの手動テスト) の `api-backup.integration.mjs`。
