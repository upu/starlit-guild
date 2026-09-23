# STARLIT-GUILD: Codex 向け入口

作業者に共通するルールは [エージェント共通ルール](docs/agent-rules.md) を先に読む。シナリオを扱うときは同ルールの手順に従い、章・ステージ・クエストID・シーンIDを [用語集](docs/glossary.md) で照合する。このファイルは Codex の作業手順だけを定める。

変更箇所・担当資料・検証を探すときは [作業別のコード案内](docs/development/code-map.md) からたどる。

- Git管理対象を変更する実装依頼では [starlit-implement](.agents/skills/starlit-implement/SKILL.md) を使う。GitHubを正本として `main` 同期、作業ブランチ、検証、push、PR作成まで進め、PRマージ前に明示承認を待つ。承認後はマージ・後片付けを行い、ゲームバージョンを上げた変更は指定がなければプレビューへ反映する。バージョン据え置きなら明示的な反映依頼がない限り省略してよい。
- 「反映して」「確定して公開」「GitHubとサイトへ同期」などの依頼では [starlit-publish](.agents/skills/starlit-publish/SKILL.md) を使う。`$starlit-publish` だけでも呼び出せる。実装依頼では先にPRフローを進め、マージ後に引き継ぐ。
- 本番への配備は、実行時の明示指定と、プレビュー確認・配備準備後の別の最終承認がある場合だけ行う。開始時の指定やPRマージ承認を配備承認へ流用しない。
- Codex の作業ブランチは `codex/<短い名前>` を推奨する。一時 worktree が detached HEAD なら、同期済み `main` と同じコミットからその worktree にブランチを作る。他のエージェントはそれぞれの名前を使う。
- このプロジェクトのスキルは `.agents/skills/` に置いてGitで管理し、個人用フォルダーへ複製しない。
- ローカル確認の起動は、PC限定の指定がなければスマホからも開けるLAN待ち受けにする。`npm run dev` の `0.0.0.0` を維持し、起動後に実際のポートとWi-Fi/LANのIPv4アドレスを確認して接続URLを案内する。WSLなど仮想アダプターのIPは案内しない。PCからの応答確認とスマホ実機での確認は区別する。
