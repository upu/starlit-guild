# 背景画像

[資料案内](../README.md) → [アート・音](README.md) → 背景画像

場所を見せる背景の共通案内。クエスト背景とタイトル背景を扱う。物語の人物・出来事を描いた一枚絵は [スチル制作記録](story-art.md) を参照する。

## 原本・配信・表示

クエスト背景の元PNGは `assets/source/scenery/`、配信用WebPは `public/scenery/` に置く。[クエスト画像の生成](scenery-images.md) に用途別サイズ、更新手順、整合性検査をまとめる。

現在の画像の割り当ては `Quest.background` と章・描画の実装で確認する。章・ステージとクエストIDは [用語集](../glossary.md)、進行に伴う表示は [章ごとの実装](../gameplay/README.md#章ごとの実装)、横スクロールの表示は [横スクロール戦闘](../gameplay/scrolling-battle.md) を参照する。

## 場所ごとの制作記録

個別の記録がある背景をまとめる。全配信画像の一覧は [背景画像manifest](../../assets/scenery.manifest.json) で確認する。

| 場所・用途 | 制作記録 |
| --- | --- |
| 第一章1-2の夕方の交易路・1-3の街 | [交易路と街の背景](#交易路と街の背景) |
| 第一章1-6の森の湿地 | [森の湿地の生成記録](../art-generation/stage-1-6-art.json) |
| 第一章1-7・1-8の古い水路と復旧後 | [水路の背景画像](stage-1-7-1-8-art.md) |
| 第二章2-4・2-6の山道 | [山道の背景](#山道の背景) / [ミラと山道の生成記録](../art-generation/mira-animation-road-art.json) |
| タイトル画面 | [タイトル画像](title-art.md) — 横・縦画面の背景とロゴ |

## 交易路と街の背景

内蔵 imagegen で各1回生成し、1536×1024 PNGを採用。`assets/source/scenery/evening-trade-road.png` は1-2の夕方の交易路、`assets/source/scenery/town-deliveries.png` は1-3の倉庫と商店の通り。`Quest.background` を通じてクエスト一覧・冒険マップに表示する。

共通指示：STARLIT-GUILDの温かな日本風ファンタジーRPG向け、painterly anime environment、crisp polished warm soft light、landscape 1536×1024。人物・敵・文字・UIを描かず、下半分は仲間のスプライトを置ける広い前景にする。

- 夕方の交易路：quiet rural dirt trade road at sunset, low trees and grassy verge, fork in distance, golden orange sky, no tower or glowing moss。採用画像の遠景には街並みと尖塔状の屋根があるが、物語の塔としては扱わない。
- 街の仕事：modest medieval fantasy town market warehouse lane in daytime, timber and cream plaster stores, crates and cloth parcels at sides, cart near store, sunlit cobblestone street, no visible tower。

目視で前景の余白・人物やUIの不在を確認。キャラクター立ち絵・会話スチルは既存素材を維持する。

## 山道の背景

2-4と2-6は、足元が谷の遠景に重なっていた背景を `assets/source/scenery/mountain-road.png`（1024×1536）へ変更。待機位置と戦闘位置の下に、地面が連続する山道を描いた。画像の生成・修正は組み込みツールを使い、原本の画素はプログラムで加工していない。

最終プロンプト・参照・採用原本は [ミラと山道の生成記録](../art-generation/mira-animation-road-art.json)。同時に制作したミラの動作画像は [人物の動作画像](hero-animation-art.md#ミラと山道) にまとめる。
