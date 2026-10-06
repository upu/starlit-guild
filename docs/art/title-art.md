# スタートページのアート

案内：[背景画像](background-images.md)

内蔵 imagegen で生成。背景は WebP に変換し、ロゴは生成時のアルファチャンネルを保った lossless WebP として保存。

- 横画面: `public/title/starlight-towers.webp`（1536 × 1024）
- 縦画面: `public/title/starlight-towers-portrait.webp`（1024 × 1536）
- 透過ロゴ: `public/title/starlit-guild-logo.webp`（1536 × 1024）

画面の向きに合わせて背景を切り替える。タイトルと START は風景に焼き込まず、独立して配置する。キャッチコピーは表示しない。

## 採用背景と設定の対応

2026-09-29に、ユーザー確認済みの横・縦の修正版へ差し替えた。内蔵 imagegen の生成原本は `assets/source/title/starlight-towers.png` と `assets/source/title/starlight-towers-portrait.png` に保存。配信用は同じ寸法の WebP（sharp、quality 90、effort 6）とする。

- リンデの町、交易路、畑と林、街外れの丘の塔を主景にする。塔の窓と頂部は淡い紫、家や普通のランタンは暖色とし、[塔の灯りの設定](../story/world-and-story.md#星灯りの塔制作案)と揃える。
- 遠景に3つの小さな紫の塔の灯りを置き、遠くへ続く街道を感じさせる。塔の所在地・固有名・方角・実距離をこの絵で確定せず、ベルネやブレッカの塔とは特定しない。
- リンデの塔は、背後に高い林の斜面を持つ丘の平場に置く。足元の湿った石組み、坂の途中の小さな石造りの排水口と細い流れを描き、出口が詰まると水が残り得る地形にする。
- 第一章1-7・1-8の[古い排水路](../story/story-part-1.md#1-7-古い水路をたどって--地図の端に残る線)は、大部分が地面や石組みの下を通る。大きな開渠の用水路、川、堀として描かない。タイトルでは詰まりの事件そのものを再現しない。
- 旧背景の大湖・湖上都市・険しい雪山・断崖・大きな石橋を外した。星空と静かな暮らしの雰囲気を引き継ぐ。

これらは既存の場所・排水の設定に沿った背景の構図であり、[地図帳](../story/atlas/README.md)の座標・街道の接続やシナリオを変更するものではない。

配信用WebPの再生成は、依存関係をインストールしたリポジトリのルートで実行する。

```sh
node --input-type=module -e "import sharp from 'sharp'; for (const name of ['starlight-towers', 'starlight-towers-portrait']) { await sharp('assets/source/title/' + name + '.png').webp({ quality: 90, effort: 6 }).toFile('public/title/' + name + '.webp'); }"
```

## 共有リンクのカード画像

`assets/source/social/x-card-background.png` は、[アリア](../characters/aria-reference-sheet.webp)・[レオン](../characters/leon-reference-sheet.webp)・[ミラ](../characters/mira-reference-sheet.webp)・[フィン](../characters/finn-reference-sheet.webp)・[リコ](../characters/lico-reference-sheet.webp) の最新リファレンスシートを参照して内蔵 imagegen で再生成した横長のPNG原本。2026-10-06に、アリアの短い髪・目立たない後頭部の編み込み・胸元・光沢を抑えた塗り、レオンの短いマントと背嚢、ミラのまとめ髪へ揃えた。淡い水彩の線・塗りを引き継ぎ、フィン・ミラ・レオン・アリア・リコの五人を少し小さな上半身の構図で並べる。顔の重なりを避け、ロゴは人物にかからない左上の星空へ移す。背景は現行タイトルのリンデ周辺の町・丘・紫に灯る塔の方向性へ揃える。プロンプト・参照画像・採用原本は[再生成記録](../art-generation/social-card-refresh-20261006.json)を参照。

文字を生成画像へ焼き込まず、`scripts/generate-social-card.mjs` が既存の透過ロゴを合成し、1200 × 630 PNG を `public/social/x-card.png` に1枚だけ出力する。OGPとXは同じ画像URLを参照する。更新後は `npm run social-card:generate`、整合性確認は `npm run social-card:check` を使う。カードはゲーム画面には表示しない。旧WebP原本はGitの履歴に残し、現行の生成処理はPNG原本だけを使う。

## 初版の生成プロンプト（制作履歴）

以下は差し替え前の制作記録。金色の塔や湖の指定は現行背景には使わない。現行版の編集プロンプトは [2026-09-29の生成記録](../art-generation/title-landscape-2026-09-29.json) を参照する。

### 横画面の風景

Use case: stylized-concept. Asset type: full-bleed start-screen background art for a Japanese fantasy RPG, landscape 1536x1024. A beautiful painterly anime fantasy landscape at blue hour under a deep teal-blue starry night sky. Rolling forested hills, a winding old trade road, tiny peaceful village lights and distant mountains. Five slender old stone starlight beacon towers scattered across the valleys at varied distances, their lantern-like crowns collecting starlight and softly illuminating the roads with pale warm gold light. One distinct tower around the central-right area and smaller distant beacons toward the center-left; keep the essential world readable inside the central 45 percent for portrait phone crops. Grounded rural fantasy, stone and moss, inhabited peaceful world, not a giant magical castle. Atmospheric depth, exquisite hand-painted game background detail, cinematic composition. Top 35 percent mostly quiet dark sky for a separate title logo. Lower 18 percent dark subdued foreground for a separate START control. NO people, NO characters, NO lettering, NO typography, NO logos, NO interface, NO watermark. Art fills the canvas edge to edge.

### 透過ロゴ

Use case: logo-brand. Asset type: polished transparent title logo for a Japanese fantasy RPG. Create a genuinely transparent PNG background, wide landscape 1536x1024 canvas with logo centered and generous transparent margin. Exact main Japanese text: 「星灯りの旅団」 (do not render quote brackets). Exact small subtitle: STARLIT GUILD. This must look like a professionally art-directed Japanese RPG title wordmark, elegant bespoke Japanese lettering with clear accurate readable characters, ivory and softly luminous antique gold, subtle dark teal edge for contrast over a night landscape. Main Japanese title in one horizontal line, with a delicate star-and-lantern emblem rising above its center; thin elegant ornamental arcs like a small constellation and a restrained botanical flourish below. Subtitle small and widely spaced beneath Japanese title. Transparent negative space including all gaps between letters. No rectangular panel, no opaque background, no scenery, no people, no mockup, no extra words, no tagline, no START. The title and its integrated emblem are the only artwork.

### 縦画面の風景

横画面の風景を参照画像として使用。

Edit this fantasy landscape into a portrait 1024x1536 mobile game title background. Preserve the same beautiful painterly world, starry blue night, stone lantern-topped starlight towers, forested hills, winding trade road, warm village windows, lakes and mountains. Recompose the scene, not merely crop: one prominent glowing tower on the right side in the middle distance, and THREE clearly visible smaller glowing towers scattered across the central and left valleys behind it, all visible within a vertical portrait frame. Upper 32 percent quiet dark starry sky for a separate logo; lower 18 percent subdued dark path for a separate START label. Cinematic depth, exquisite detail, peaceful rural fantasy. NO characters, NO text, NO logo, NO interface. Portrait orientation required.
