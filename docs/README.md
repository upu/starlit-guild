# STARLIT GUILD ドキュメント案内

このディレクトリには、現行ゲームの仕様、シナリオ制作資料、アート制作記録、実装上の設計を分けて置く。

READMEはプロジェクトの入口に留め、細かな数値・解放条件・保存形式・実装メモはここから各資料へ分ける。

## フォルダー案内

| 置き場 | 内容 |
| --- | --- |
| [`gameplay/`](gameplay/) | 現行ゲームの仕様、章ごとの実装、戦闘・育成、セーブ |
| [`story/`](story/) | 世界観、執筆指針、章ごとのプロット・制作案 |
| [`characters/`](characters/) | 人物ごとの設定、参照シート、共通書式 |
| [`relationships/`](relationships/) / [`factions/`](factions/) | 人物間の関係性、所属組織 |
| [`art/`](art/) | 画像・動画・音の仕様、制作記録、ギャラリー |
| [`art-generation/`](art-generation/) | 画像生成プロンプトと制作条件のJSON |
| [`development/`](development/) | 開発・検証・公開の手順、描画の実装構成 |
| [`templates/`](templates/) | 公開時の確認記録などの雛形 |
| [`generated/`](generated/) | ソースから自動生成する台本・掛け合い。手編集せず `npm run script:export` で更新 |
| [`archive/`](archive/) | 現在は使わない従来モード・加入システムの記録 |

直下には、この目次・[エージェント共通ルール](agent-rules.md)・[用語集](glossary.md)・旧リンク向けの [キャラクター案内](characters.md) を置く。

## 読み分け

| 区分 | 扱い |
| --- | --- |
| 現行実装 | 現在のゲームで動いている仕様。最終的な正はソースコード |
| 制作資料 | 世界観・人物・シナリオの正本。公開済みの章と今後の案を明記して分ける |
| 制作記録 | 採用素材を再現、修正するための最終プロンプトと制作条件 |
| 開発資料 | 実装構成、保存、検証、公開など開発者向けの資料 |

シナリオ資料では「制作の核」「制作案」「将来の種」「公開済み」を混同しない。資料だけを更新した場合は、ゲーム内の会話やクエストまで変更されたとは扱わない。

章・ステージ・クエストID・シーンIDの呼び名が資料とコードで違う箇所は [用語集](glossary.md) にまとめてある。

## 現行ゲーム

- [本編の横スクロール戦闘](gameplay/scrolling-battle.md) — 第一章・第二章の自動前進・戦闘・作業・画像原本とWebP配信

- [章ごとの戦力と到達時間](gameplay/progression-balance.md) — バランス調整の入口。各章の開始・終了戦力、育成と通算時間の目標・測定、次章への引き継ぎ
- [ゲームプレイ仕様](gameplay/gameplay.md) — 現在のゲームループ、画面、冒険、仲間加入、思い出
- [戦闘バランス](gameplay/combat-balance.md) — 育成差による減衰、敵と回復、第二章の育成時間・テスト開始データ・調整手順
- [セーブシステム](gameplay/save-system.md) — 端末保存、バックアップ、記録、移行、複数タブ
- [第二章のゲーム実装](gameplay/chapter-two-gameplay.md) — 2-1〜2-9、ミラ加入、技の習得・セット、互換性
- [第一章のゲーム実装](gameplay/prologue-gameplay.md) — 第一章の進行、表示、周回、互換性

## 従来モードの記録

- [従来モードの記録](archive/legacy-mode.md) — 現在は遊べない試作の扱い、旧会話・来客の記録
- [仲間加入](archive/recruitment.md) — 削除した加入システムの記録

## 世界観・シナリオ制作

- [世界観と物語](story/world-and-story.md) — 制作の核、地理、塔と苔などの共通設定
- [第一章プロット](story/story-part-1.md) — 公開済み第一章の出来事、因果、今後へ残る事実
- [第二章計画](story/story-part-2.md) — 全9ステージの進行・会話案、ミラ加入、プティの山賊騒ぎ、レベルとコインによる技習得、一枚絵の配置。実装状況は [第二章のゲーム実装](gameplay/chapter-two-gameplay.md#実装状況)
- [第三章計画](story/story-part-3.md) — 石を敷いた街と弱った塔、フィン加入、冒険のない幕間。検討段階で実装はない
- [用語集](glossary.md) — 章・ステージ・クエストID・シーンID・置き場の対応表
- [キャラクター一覧・設定](characters/README.md) — キャラ別ファイル、名前・別名・ID、設定の区分
- [関係性と掛け合い](relationships/README.md) — 組み合わせごとの関係性と既存シーン
- [アリアとレオン](relationships/aria-leon.md) — ふたりの関係性、出身、性格と成長
- [マッドハロウィン](factions/mad-halloween.md) — 組織の方針、所属、未設定事項
- [物語・会話の制作指針](story/story-writing.md) — 場面の書き方、アリアとレオンの温度、表示方針
- [スチル制作記録](art/story-art.md) — 物語スチルの場面と生成記録
- [スチル一覧](art/story-art-gallery.md) — 採用済みスチルの確認

人物を追加するときは [共通書式](characters/_template.md) を使う。シナリオ制作では、一覧 → 登場人物 → 関係性・組織 → 対象プロット・既存シーンの順に必要な資料をたどる。旧 [characters.md](characters.md) は過去のリンク向けの案内として残す。

## 描画・音・アート

- [Phaser冒険画面](development/phaser-adventure.md) — 冒険描画の構成と検証範囲
- [動作画像の制作記録](art/hero-animation-art.md) — アリア・レオン・ミラのアニメーション素材
- [動画素材の管理](art/story-videos.md) — 元動画から配信用MP4を自動生成する手順と設定
- [覆面の操り手の戦闘画像](art/puppet-battle-art.md) — 2-7の戦闘用画像と制作条件
- [第一章1-7・1-8の背景画像](art/stage-1-7-1-8-art.md) — 水路の詰まりと復旧後の背景の制作条件
- [クエスト画像の生成](art/scenery-images.md) — 章切り替え・自動行先設定と用途別WebPの生成
- [演出素材](art/presentation-assets.md) — 攻撃・発見などの演出素材
- [音楽と効果音](art/audio.md) — BGM・効果音の現行仕様と実装
- [タイトル画像](art/title-art.md) — タイトルアートの制作記録
- [オリジナルキャラクター画像](art/original-character-art.md) — 追加キャラクターの画像制作記録
- [オリジナルキャラクター一覧](art/original-character-gallery.md) — 採用画像の確認
- [第一章の会話画像](art/prologue-dialogue-art.md) — 第一章と共通会話で使う顔アイコン、受け渡しスチル
- [会話の表情](art/dialogue-expressions.md) — 4人の参照シートに合わせた顔画像と台詞ごとの表情、生成プロンプト
- [クエストアイコン](art/quest-icon-prompt.md) — クエストアイコン制作メモ
- [お店アイコン](art/shop-icon-prompt.md) — 露店アイコン制作メモ
- [バッグ・手帳・冒険・キャラクターのアイコン](art/navigation-icon-prompts.md) — 共通の色調と小サイズ向け画像の制作記録

生成プロンプトJSONは [`art-generation/`](art-generation/) に集約した。各ファイルの用途と採用素材は、対応する制作記録からたどる。

## 開発・運用

- [開発と運用](development/development.md) — 開発コマンド、スマホUI、検証、Sites公開、DBマイグレーション
- [サイトの確認と公開](development/site-release.md) — プレビュー・本番の分離、公開前検査、第一章の確認表
- [セーブシステム](gameplay/save-system.md) — 保存・復元・互換性に関わる変更時の確認先
- [変更履歴](../CHANGELOG.md) — バージョンごとの変更。上げる規則は [開発と運用](development/development.md#prごとのゲームバージョン)
- [エージェント共通ルール](agent-rules.md) — 作業ツールに依存しない優先指示
- [`AGENTS.md`](../AGENTS.md) / [`CLAUDE.md`](../CLAUDE.md) — 各エージェントの入口

## 文書を増やすとき

READMEへ詳細仕様を追記するのではなく、既存資料の担当範囲へ追加する。新しい分野で既存資料に自然な置き場がない場合だけ、上の分類に合うフォルダーへ新しい文書を作ってこの目次へ追加する。直下に分野別の資料を増やさず、リンクは移動先からの相対パスで記載する。

変更履歴や一時的な不具合記録はREADMEに積み上げず、Git履歴やIssueへ残す。バージョン単位の要約だけは [`CHANGELOG.md`](../CHANGELOG.md) にまとめる。

「実装済み」「未実装」などの進捗は、章ごとの実装仕様（[第一章](gameplay/prologue-gameplay.md)、[第二章](gameplay/chapter-two-gameplay.md#実装状況)）だけで管理する。第三章は実装に着手する時点で実装仕様を作る。制作資料・人物資料・世界観資料には進捗を書き写さず、必要ならそこへリンクする。
