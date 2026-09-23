# 世界観・シナリオ

[資料案内](../README.md) → 世界観・シナリオ

制作の核・採用済みの設定・制作案・未設定を区別して読む。実装状況は [ゲーム仕様](../gameplay/README.md#章ごとの実装) にまとめ、ここには書き写さない。

## 制作の入口

1. [用語集](../glossary.md)、[世界観と物語](world-and-story.md)、[物語・会話の制作指針](story-writing.md) で呼び名・共通設定・書き方を確認する。
2. [キャラクター一覧](../characters/README.md) から登場人物を読む。人物を追加するときは [共通書式](../characters/_template.md) を使う。
3. [関係性と掛け合い](../relationships/README.md) と、人物資料が案内する所属組織を読む。共通の関係は [アリアとレオン](../relationships/aria-leon.md)、組織は [マッドハロウィン](../factions/mad-halloween.md) にまとめている。
4. 対象章のプロットと既存の台本を照合する。

## 章の資料

| 章 | プロット・制作案 | 実装・確認手順 |
| --- | --- | --- |
| 第一章 | [第一章プロット](story-part-1.md) | [第一章のゲーム実装](../gameplay/prologue-gameplay.md) |
| 第二章 | [第二章計画](story-part-2.md) | [第二章のゲーム実装](../gameplay/chapter-two-gameplay.md) |
| 第三章 | [第三章計画](story-part-3.md) | [第三章のゲーム実装資料](../gameplay/chapter-three-gameplay.md) |
| 第四章 | [第四章計画](story-part-4.md) | 未作成 |

## 台本と場面の素材

- [生成台本](../generated/script.md)・[掛け合い](../generated/banter.md)・[第三章の生成台本](../generated/chapter-three.md) — ソースから出力した会話。手編集せず `npm run script:export` で更新する。ステージ別台本は生成台本からたどる。
- [スチル制作記録](../art/story-art.md)・[スチル一覧](../art/story-art-gallery.md) — 場面の画像と生成条件。
- [動画素材の管理](../art/story-videos.md) — 場面で再生する動画の管理。
- [従来モードの記録](../archive/README.md) — 現在の物語と区別して参照する過去の出来事。
