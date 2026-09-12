# 演出素材（2026-09-10）

## 第一部のステージ背景（2026-09-12）

内蔵 imagegen で各1回生成し、1536×1024 PNGを採用。`public/stages/evening-trade-road.png` は1-2の夕方の交易路、`public/stages/town-deliveries.png` は1-3の倉庫と商店の通り。`Quest.background` を通じてクエスト一覧・冒険マップに表示する。

共通指示：STARLIT-GUILDの温かな日本風ファンタジーRPG向け、painterly anime environment、crisp polished warm soft light、landscape 1536×1024。人物・敵・文字・UIを描かず、下半分は仲間のスプライトを置ける広い前景にする。

- 夕方の交易路：quiet rural dirt trade road at sunset, low trees and grassy verge, fork in distance, golden orange sky, no tower or glowing moss。採用画像の遠景には街並みと尖塔状の屋根があるが、物語の塔としては扱わない。
- 街の仕事：modest medieval fantasy town market warehouse lane in daytime, timber and cream plaster stores, crates and cloth parcels at sides, cart near store, sunlit cobblestone street, no visible tower。

目視で前景の余白・人物やUIの不在を確認。キャラクター立ち絵・会話スチルは既存素材を維持する。

## 発見アイテム

画像は内蔵 imagegen で各1回生成。透明PNGを320×320へ縮小し、アルファを保って配信する。保存先は `public/items/chest.png`、`public/items/herb.png`、`public/items/spirit.png`。3枚合計約516 KiB。既存のキャラ・背景素材は変更しない。

## 共通プロンプト

Use case: stylized-concept. Asset type: standalone square transparent PNG game item for cozy Japanese fantasy idle RPG STARLIT GUILD. Style: cute chibi storybook painted anime, detailed warm gold outlines, rich natural green and violet jewel tones, charming polished hand-painted game art. Composition: one centered isolated subject fills 75–85% of square canvas, generous safe padding on all edges, clear bold silhouette readable at 64–88 pixels. Background: actual transparent alpha, no backdrop, no checkerboard, no scene. Constraints: no text, UI, frame, logo, watermark, or additional subjects.

以下を共通プロンプト末尾に連結して生成した。

### chest.png

Subject: small ancient wooden treasure chest in three-quarter view, warm gold metal bands and clasp, lid slightly open with magical golden glow escaping, a few gold coins nestled near its base. Warm weathered walnut wood, cozy inviting treasure, compact self-contained glow preserved with translucent alpha.

### herb.png

Subject: glowing moon-dew herb, elegant emerald leaves and tiny white bell flowers holding turquoise dewdrops, growing from a small compact earth tuft. Delicate botanical magic yet a strong readable plant silhouette, soft turquoise glow contained close to the leaves, natural green jewel tones and subtle warm gold edging.

### spirit.png

Subject: friendly lost forest spirit, cute mint and aqua luminous small floating wisp, little leaf ears, amber eyes, rounded chibi shape, tiny gentle smile and soft halo. Endearing slightly curious expression, compact magical wispy tail and soft translucent edges, rich emerald leaf accents, self-contained silhouette.

## 演出と検証

- 既存のイベント日時とIDから演出を表示する。新しい進行フラグやセーブ形式は追加しない。
- 斬撃、二連矢の軌跡、回復の光、障壁、流星、全員必殺の1.9秒カットイン。連携は実際のペアの顔を表示する。
- 同時の着弾演出は最大8件。前の地点・未来・期限切れのイベントは描画しない。マップの操作を遮らない。
- 効果音はWeb Audioで合成。通常攻撃より必殺・連携・発見音を優先し、連打を間引く。消音は再生中の音にも適用する。
- 動きを減らす設定では着弾粒子・軌跡・全画面の光を省略し、静止したカットインとアイテムを表示する。
- 既存の15地点描画、セーブ移行、オフライン精算、複数タブ復帰に加え、演出の期限・前地点除外・3種アイテムの描画・音の重複抑制と消音を自動検証する。
- 画像は目視で確認。ブラウザーでのアニメーション目視、実機の音の聞こえ方・音量・性能は未検証。
- BGMは後続の追加でオリジナル曲2曲を作成。`public/music/camp.wav` と `public/music/journey.wav` に保存。外部の音楽生成サービスは使用せず、`scripts/compose-bgm.mjs` に楽譜と合成方法を保持する。キャラ音声は未追加。
