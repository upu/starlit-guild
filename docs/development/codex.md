# Codex の作業手順

[資料案内](../README.md) → [開発・運用](README.md) → Codex の作業手順

[AGENTS.md](../../AGENTS.md) から Codex だけが読む手順。ツールに依存しないルールは [エージェント共通ルール](../agent-rules.md) を正本とし、ここには Codex の操作だけを置く。

- Git管理対象を変更する実装依頼では [starlit-implement](../../.agents/skills/starlit-implement/SKILL.md) を使う。GitHubを正本として `main` 同期、作業ブランチ、検証、push、PR作成まで進め、PRマージ前に明示承認を待つ。承認後はマージ・後片付けを行い、ゲームバージョンを上げた変更は指定がなければプレビューへ反映する。バージョン据え置きなら明示的な反映依頼がない限り省略してよい。
- 「反映して」「確定して公開」「GitHubとサイトへ同期」などの依頼では [starlit-publish](../../.agents/skills/starlit-publish/SKILL.md) を使う。`$starlit-publish` だけでも呼び出せる。実装依頼では先にPRフローを進め、マージ後に引き継ぐ。
- 本番への配備は、実行時の明示指定と、プレビュー確認・配備準備後の別の最終承認がある場合だけ行う。開始時の指定やPRマージ承認を配備承認へ流用しない。
- 作業ブランチは `codex/<短い名前>` を推奨する。一時 worktree が detached HEAD なら、同期済み `main` と同じコミットからその worktree にブランチを作る。
- このプロジェクトのスキルは `.agents/skills/` に置いてGitで管理し、個人用フォルダーへ複製しない。
- 舞台や移動を扱うシナリオ作業では、汎用の個人スキル `fiction-atlas` を読み、[地図とシナリオの照合手順](../story/atlas/README.md#シナリオ作業での確認と更新) に使う。スキルは利用可能な一覧から探し、通常の配置先は `$CODEX_HOME/skills/fiction-atlas/SKILL.md`（未設定なら `~/.codex/skills/fiction-atlas/SKILL.md`）。本作のデータは `docs/story/atlas/atlas.json` を使い、既存の地図を新規初期化しない。スキルがない環境では同資料と単独HTMLで照合・更新し、生成や検証まで完了できなければ残った作業を報告する。
