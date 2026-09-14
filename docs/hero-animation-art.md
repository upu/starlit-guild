# アリア・レオンの動作画像

既存の `public/sprites.png` を参照し、組み込み `image_gen` で各1枚を生成。CLI/APIは使用していない。

## 現在の状態

生成原本は `outputs/hero-animation/aria-generated.png` と `outputs/hero-animation/leon-generated.png` に保存。どちらも1448×1086、RGBで市松模様が焼き込まれているため、`scripts/prepare-hero-animation.mjs` で透過・整列し、以下のRGBA PNGを採用する。

- `public/animations/aria-v1.png`
- `public/animations/leon-v1.png`

完成画像は各1536×1152、4列×3行、384pxセル。中立色の連結領域と市松模様の周期から背景を判定し、剣・服などの明るい面を保護した。元の等分線をまたぐ足先と剣を切らないよう、人物全体を切り出して同じ倍率で再配置し、足元を346pxに統一。独立した矢・微小な背景残りは除き、射撃はPhaserの既存演出を使用する。

`heroSheets.ready` は両方true。待機の閉眼コマは3.6秒に一度150msだけ表示する。画像単体は緑背景に重ねて全24コマを点検し、透過画素・余白・足元をデータでも検査。連続再生の素材見本は `outputs/hero-animation/motion-preview.gif`。ブラウザーの画面操作・WebGL・タッチ実機の確認は未実施。

原本・中間確認画像はローカルの `outputs/` に保管し、ゲームが読み込むのは `public/animations/` の完成2枚だけ。再加工スクリプトは既存環境のsharpを使用し、原本は上書きしない。

## 最終プロンプト

両方の参照画像パス: `C:/Users/spitz/workspace/STARLIT-GUILD/public/sprites.png`。役割はデザイン・画風の参照で、編集対象ではない。

### Aria

```text
Use case: stylized-concept
Asset type: production-ready transparent game animation sprite sheet for STARLIT-GUILD.
Input image: C:/Users/spitz/workspace/STARLIT-GUILD/public/sprites.png is a CHARACTER AND STYLE REFERENCE ONLY, NOT an edit target. Use ONLY the elf archer at the TOP LEFT as Aria. Do not reproduce other atlas characters.
Primary request: Generate a new sprite sheet of exactly 12 individually drawn full-body animation frames of the SAME Aria, preserving the reference design: blonde hair, pointed elf ears, green eyes, green hood and flowing green cape with gold trim, small feather detail, brown leather belts/gloves/boots, cream short dress, wooden bow and back quiver. Match the reference's polished chibi Japanese fantasy RPG illustration style, delicate clean outlines, softly painted shading, detailed leather and cloth, oversized head and small body. Keep her exact identity and costume consistent in all frames.
Scene/backdrop: genuinely TRANSPARENT alpha background, no background color, no checkerboard graphic, no floor or ground shadow.
Composition: landscape 1536x1152 PNG if supported; exactly 4 equal columns x 3 equal rows, twelve square 384x384 cells. No visible grid. Each full character and all bow/cape/hair/arrow parts must fit inside its own cell with clear transparent gutters. Identical scale, fixed camera, consistent 3/4 view FACING RIGHT in every frame. Body horizontally centered in each cell, foot anchor/baseline at 90% of each cell height. Do not vary magnification or slide the whole body between cells. Leave at least 20px padding from every cell edge.
Animation layout in reading order:
ROW 1 (top): four genuinely different walk-cycle poses: right-facing forward-contact stride; passing pose with raised trailing foot; opposite-contact stride with opposite legs forward; opposite passing pose. Swing limbs and move cape naturally; do not reuse transformed cutouts.
ROW 2 (middle): four archery-attack frames facing right: prepare with bow raised and arrow being nocked; windup drawing bow string back to cheek, arrow aimed right; release with bow arm extended and string released, arrow still within cell if shown; recovery lowering bow slightly. Show clear arm/hand/weapon pose differences.
ROW 3 (bottom): column 1 neutral relaxed idle with bow; column 2 subtle breathing idle, slight chest/shoulder/cloth change; column 3 recoil/hurt with torso leaning back and bent knees; column 4 recover from hurt returning upright. Feet remain near same baseline.
Constraints: exactly one Aria per cell, exactly 12 frames in strict 4x3 grid; no other characters, no words, letters, numbers, borders, labels, logos, watermarks, ground shadows, glow, trails, motion blur, impact effects, particles, scenery or weapons detached outside a cell. Preserve actual transparent alpha. Genuine new limb poses, not repeated rotated/scaled versions.
```

### Leon

```text
Use case: stylized-concept
Asset type: production-ready transparent game animation sprite sheet for STARLIT-GUILD.
Input image: C:/Users/spitz/workspace/STARLIT-GUILD/public/sprites.png is a CHARACTER AND STYLE REFERENCE ONLY, NOT an edit target. Use ONLY the swordsman in the TOP ROW SECOND COLUMN as Leon. Do not reproduce other atlas characters.
Primary request: Generate a new sprite sheet of exactly 12 individually drawn full-body animation frames of the SAME Leon, preserving the reference design: spiky brown hair, brown eyes, confident youthful face, red scarf flowing behind him, blue tunic, silver metal shoulder armor, brown leather gloves/belts/boots, dark trousers, silver straight sword with gold hilt. Match the reference's polished chibi Japanese fantasy RPG illustration style, delicate clean outlines, softly painted shading, detailed leather and cloth, oversized head and small body. Keep his exact identity and costume consistent in all frames.
Scene/backdrop: genuinely TRANSPARENT alpha background, no background color, no checkerboard graphic, no floor or ground shadow.
Composition: landscape 1536x1152 PNG if supported; exactly 4 equal columns x 3 equal rows, twelve square 384x384 cells. No visible grid. Each full character and all sword/scarf/hair parts must fit inside its own cell with clear transparent gutters. Identical scale, fixed camera, consistent 3/4 view FACING RIGHT in every frame. Body horizontally centered in each cell, foot anchor/baseline at 90% of each cell height. Do not vary magnification or slide the whole body between cells. Leave at least 20px padding from every cell edge. Size the character small enough for his full sword sweep to fit a cell.
Animation layout in reading order:
ROW 1 (top): four genuinely different walk-cycle poses: right-facing forward-contact stride; passing pose with raised trailing foot; opposite-contact stride with opposite legs forward; opposite passing pose. Sword carried low, swing limbs and move scarf naturally; do not reuse transformed cutouts.
ROW 2 (middle): four sword-attack frames facing right: prepare ready guard with knees slightly bent; windup lifting sword back and overhead; strike with sword swung down and outward toward right and torso leaning into the slash; recovery bringing sword back into guard. All sword tips must remain INSIDE their own cell. Show clear arm/hand/weapon and body pose differences. No slash streaks or effects.
ROW 3 (bottom): column 1 neutral relaxed idle with sword lowered; column 2 subtle breathing idle, slight chest/shoulder/scarf change; column 3 recoil/hurt with torso leaning back and bent knees; column 4 recover from hurt returning upright. Feet remain near same baseline.
Constraints: exactly one Leon per cell, exactly 12 frames in strict 4x3 grid; no other characters, no words, letters, numbers, borders, labels, logos, watermarks, ground shadows, glow, trails, motion blur, impact effects, particles, scenery or weapons detached outside a cell. Preserve actual transparent alpha. Genuine new limb poses, not repeated rotated/scaled versions.
```
