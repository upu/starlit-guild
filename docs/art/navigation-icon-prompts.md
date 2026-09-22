# ナビゲーションの画像アイコン

案内：[アイコン・演出](icons-and-effects.md)

Codex組み込み画像生成で制作。クエストとショップの画像を色調・輪郭の参考にし、64×64pxの透過PNGへ書き出す。通常は32px表示。高さ700px以下の下部ナビは24px、530px以下は20pxにして、既存の画面の高さを保つ。右上のボタンは44pxの押せる範囲を維持する。

キャラクターは特定の人物の肖像を使わず、顔・髪型・服装を持たない2人のシルエットとする。仲間が増えても同じ入口として使う。

| 用途 | 素材 | 意匠 |
| --- | --- | --- |
| バッグ | `public/ui/bag-satchel.png` | 革の道具袋 |
| 手帳 | `public/ui/travel-handbook.png` | 留め具のある閉じた手帳 |
| 冒険 | `public/ui/adventure-compass.png` | 方位磁針 |
| キャラクター | `public/ui/characters-silhouette.png` | 前後に重ねた汎用の人物2人 |

4素材とも64×64pxのRGBAで、透明画素と不透明画素の存在を確認。32pxに縮小した外観も確認済み。

## バッグの採用プロンプト

Create a new tiny fantasy game inventory icon: a single tan leather drawstring pouch with a cream gathered mouth and two red cord ends. A bold simple round bag silhouette, thick dark brown outlines and 2-tone golden brown shading. Match the clean friendly warm style of the reference handbook, which is only a style reference, not the subject. Readable at 32px. Output a transparent PNG cutout, with real alpha-channel transparency surrounding the bag and in any gap. Nothing behind or beneath the bag. No surface, backdrop, pattern, shadow, panel, tile, frame, writing or decoration. Centered in a square canvas, generous thick shapes. Only the isolated bag.

## 手帳・冒険・キャラクターの採用プロンプト

### 手帳

Use case: stylized-concept. Create ONE new production UI icon for the Japanese fantasy RPG STARLIT GUILD. Input images are STYLE REFERENCES ONLY: match their warm brown thick outlines, cream/gold/red palette and clean simplified shading. Design specifically for a 64 by 64 pixel asset displayed at 32 by 32 pixels: a bold instantly recognizable silhouette, few large color areas, no fine detail. Smooth illustrated shapes, not pixel art. Thick dark brown outline, at most three shading values per material. No realistic texture, grain, tiny engraving, narrow highlights, scenery, people except when requested as generic silhouette, text, numbers, labels, tile, badge frame, or ground shadow. Center one isolated icon filling 88 percent of a square canvas. OUTPUT MUST BE A TRUE RGBA PNG WITH TRANSPARENT BACKGROUND: alpha zero outside the subject and in empty gaps. Do not draw a checkerboard or any colored background. Subject: one closed russet-brown leather travel journal, standing upright at a very slight three-quarter angle. Thick visible cream page edge on the right, a simple gold horizontal clasp on the right edge, one plain broad darker spine on the left. No writing, logos, star symbols or bookmarks. The silhouette should read immediately as a small closed book, with the cover dominating.

### 冒険

Use case: stylized-concept. Create ONE new production UI icon for the Japanese fantasy RPG STARLIT GUILD. Input images are STYLE REFERENCES ONLY: match their warm brown thick outlines, cream/gold/red palette and clean simplified shading. Design specifically for a 64 by 64 pixel asset displayed at 32 by 32 pixels: a bold instantly recognizable silhouette, few large color areas, no fine detail. Smooth illustrated shapes, not pixel art. Thick dark brown outline, at most three shading values per material. No realistic texture, grain, tiny engraving, narrow highlights, scenery, people except when requested as generic silhouette, text, numbers, labels, tile, badge frame, or ground shadow. Center one isolated icon filling 88 percent of a square canvas. OUTPUT MUST BE A TRUE RGBA PNG WITH TRANSPARENT BACKGROUND: alpha zero outside the subject and in empty gaps. Do not draw a checkerboard or any colored background. Subject: one round brass pocket compass, straight frontal view. A bold simple gold circular rim with a small top loop, cream dial, one large red north-pointing triangle and dark brown south-pointing triangle as the needle. No letters, ticks, numerals or decorative spokes. Only one compass; bold large needle with strong contrast. Circular edge belongs to the physical compass, not a background tile.

### キャラクター

Use case: stylized-concept. Create ONE new production UI icon for the Japanese fantasy RPG STARLIT GUILD. Input images are STYLE REFERENCES ONLY: match their warm brown thick outlines, cream/gold/red palette and clean simplified shading. Design specifically for a 64 by 64 pixel asset displayed at 32 by 32 pixels: a bold instantly recognizable silhouette, few large color areas, no fine detail. Smooth illustrated shapes, not pixel art. Thick dark brown outline, at most three shading values per material. No realistic texture, grain, tiny engraving, narrow highlights, scenery, people except when requested as generic silhouette, text, numbers, labels, tile, badge frame, or ground shadow. Center one isolated icon filling 88 percent of a square canvas. OUTPUT MUST BE A TRUE RGBA PNG WITH TRANSPARENT BACKGROUND: alpha zero outside the subject and in empty gaps. Do not draw a checkerboard or any colored background. Subject: exactly TWO generic featureless human head-and-shoulder silhouettes, one larger cream/gold bust in front slightly to the right and one smaller muted tan bust behind slightly to the left. Each has one round head and a simple rounded shoulder shape. No facial features, hair, clothing details, equipment, identifiable characters, age or gender markers. Dark brown outlines clearly separate the two figures. Friendly neutral people/party menu symbol; fill most of the canvas, no enclosing circle or badge, no more than two people.
