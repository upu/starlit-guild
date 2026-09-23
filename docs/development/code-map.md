# 作業別のコード案内

[資料案内](../README.md) → [開発・運用](README.md) → 作業別のコード案内

変更対象を一つ選び、編集元・仕様・検証だけを読む。章・ステージ・IDは [用語集](../glossary.md) で照合する。

- [出発・読了・次の行先](code-map/quest.md)
- [セーブ・復帰・バックアップ](code-map/save.md)
- [台詞・読者・思い出](code-map/story.md)
- [戦闘・育成・進行時間](code-map/balance.md)
- [冒険画面の描画・タップ](code-map/drawing.md)
- [キャラクター・装備・ショップ](code-map/equipment.md)
- [下部ナビ・共通ダイアログの枠](code-map/ui-shell.md)
- [画像・動画・音の素材と生成物](code-map/assets.md)

PR前の共通検証は [開発と運用](development.md#コード品質)、画面・APIの対象別の準備と実行手順は [手動テスト一覧](development.md#ローカルの手動テスト)。ソース・テストを追加・移動したときは該当する案内を更新する。仕様本文、人物設定、実装状況は各担当資料を正本とし、ここへ転記しない。

会話・出発・バッグの TSX 単体テストに共通する変換・読み込みは [`tests/helpers/source-module.mjs`](../../tests/helpers/source-module.mjs)、会話画面の共通読み込みは [`tests/helpers/story-scene-modules.mjs`](../../tests/helpers/story-scene-modules.mjs) を見る。依存の模擬動作は各テストに残し、未登録の読み込みは失敗として扱う。
