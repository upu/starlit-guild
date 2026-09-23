# スタートページのアート

案内：[背景画像](background-images.md)

内蔵 imagegen で生成。背景は WebP に変換し、ロゴは生成時のアルファチャンネルを保った lossless WebP として保存。

- 横画面: `public/title/starlight-towers.webp`（1536 × 1024）
- 縦画面: `public/title/starlight-towers-portrait.webp`（1024 × 1536）
- 透過ロゴ: `public/title/starlit-guild-logo.webp`（1536 × 1024）

画面の向きに合わせて背景を切り替える。タイトルと START は風景に焼き込まず、独立して配置する。キャッチコピーは表示しない。

## 共有リンクのカード画像

`assets/source/social/x-card-background.png` は、[アリア](../characters/aria-reference-sheet.webp)・[レオン](../characters/leon-reference-sheet.webp)・[ミラ](../characters/mira-reference-sheet.webp) のリファレンスシートを参照して内蔵 imagegen で生成した横長の原本。淡い水彩の線と塗り、三人の顔・衣装・装飾を設定画に寄せ、ミラの姿と月の杖まで見せる。文字を生成画像へ焼き込まず、`scripts/generate-social-card.mjs` が左側に濃紺の地と既存の透過ロゴを合成し、1200 × 630 PNG を `app/opengraph-image.png` と `app/twitter-image.png` に出力する。更新後は `npm run social-card:generate`、整合性確認は `npm run social-card:check` を使う。カードはゲーム画面には表示しない。

## 生成プロンプト

### 横画面の風景

Use case: stylized-concept. Asset type: full-bleed start-screen background art for a Japanese fantasy RPG, landscape 1536x1024. A beautiful painterly anime fantasy landscape at blue hour under a deep teal-blue starry night sky. Rolling forested hills, a winding old trade road, tiny peaceful village lights and distant mountains. Five slender old stone starlight beacon towers scattered across the valleys at varied distances, their lantern-like crowns collecting starlight and softly illuminating the roads with pale warm gold light. One distinct tower around the central-right area and smaller distant beacons toward the center-left; keep the essential world readable inside the central 45 percent for portrait phone crops. Grounded rural fantasy, stone and moss, inhabited peaceful world, not a giant magical castle. Atmospheric depth, exquisite hand-painted game background detail, cinematic composition. Top 35 percent mostly quiet dark sky for a separate title logo. Lower 18 percent dark subdued foreground for a separate START control. NO people, NO characters, NO lettering, NO typography, NO logos, NO interface, NO watermark. Art fills the canvas edge to edge.

### 透過ロゴ

Use case: logo-brand. Asset type: polished transparent title logo for a Japanese fantasy RPG. Create a genuinely transparent PNG background, wide landscape 1536x1024 canvas with logo centered and generous transparent margin. Exact main Japanese text: 「星灯りの旅団」 (do not render quote brackets). Exact small subtitle: STARLIT GUILD. This must look like a professionally art-directed Japanese RPG title wordmark, elegant bespoke Japanese lettering with clear accurate readable characters, ivory and softly luminous antique gold, subtle dark teal edge for contrast over a night landscape. Main Japanese title in one horizontal line, with a delicate star-and-lantern emblem rising above its center; thin elegant ornamental arcs like a small constellation and a restrained botanical flourish below. Subtitle small and widely spaced beneath Japanese title. Transparent negative space including all gaps between letters. No rectangular panel, no opaque background, no scenery, no people, no mockup, no extra words, no tagline, no START. The title and its integrated emblem are the only artwork.

### 縦画面の風景

横画面の風景を参照画像として使用。

Edit this fantasy landscape into a portrait 1024x1536 mobile game title background. Preserve the same beautiful painterly world, starry blue night, stone lantern-topped starlight towers, forested hills, winding trade road, warm village windows, lakes and mountains. Recompose the scene, not merely crop: one prominent glowing tower on the right side in the middle distance, and THREE clearly visible smaller glowing towers scattered across the central and left valleys behind it, all visible within a vertical portrait frame. Upper 32 percent quiet dark starry sky for a separate logo; lower 18 percent subdued dark path for a separate START label. Cinematic depth, exquisite detail, peaceful rural fantasy. NO characters, NO text, NO logo, NO interface. Portrait orientation required.
