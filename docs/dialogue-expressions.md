# リファレンスシートに合わせた会話の表情

2026-09-15。内蔵画像生成ツールでアリア、レオン、ミラ、プティの顔アイコンを作り直した。GPT Image 2.5 必須という当初の条件はユーザーが取り消し、APIキー不要の内蔵ツールへ変更した。内蔵ツールのモデル名は取得できないため、特定のモデルで生成したとは記録しない。

## 採用画像と表示

| 人物 | 参照 | ゲーム用画像 |
| --- | --- | --- |
| アリア | [シート](characters/aria-reference-sheet.webp) | [表情一覧](../public/portraits/aria-expressions.webp) |
| レオン | [シート](characters/leon-reference-sheet.webp) | [表情一覧](../public/portraits/leon-expressions.webp) |
| ミラ | [シート](characters/mira-reference-sheet.webp) | [表情一覧](../public/portraits/mira-expressions.webp) |
| プティ | [シート](characters/pumpety-reference-sheet.webp) | [表情一覧](../public/portraits/pumpety-expressions.webp) |

各画像は1024×512px、4列×2行、1コマ256px角のWebP。上段は通常 `neutral`、笑顔 `smile`、驚き `surprised`、困り `worried`。下段は真剣 `serious`、照れ `shy`、疲れ `tired`、ニヤリ `mischievous`。元画像1774×887pxから全体を縮小し、品質90で書き出した。表示時は各コマの中央付近64%を切り取り、顔を約1.56倍のアップにする。目と口を中心に置き、頭頂部・髪・飾りの端は枠から切れてよい。ミラとプティは切り取りの中心を少し下げて口元まで入れる。画像自体には全体を残し、隣の表情のコマが混入しない範囲で切り取る。背景は不透明なアイボリー。人物ごとの髪・耳・髪飾りと、表情差分の顔の位置を確認し、64px角の比較でも目と口の違いを確認した。

`StoryLine.expression` へ台詞ごとに指定する。句読点や単語から実行時に感情を推測しない。同じ文章でも場面によって違う表情を指定できる。省略時は通常顔で、地の文には顔を出さない。会話画面、思い出の読み返し、道中のチャット履歴は各発言の表情を保持する。キャラクター画面では通常顔を使い、対象外の人物には従来の顔画像を使う。

第一章1-1〜1-9、待機・道中の掛け合い、従来記録のミラ加入やプティの来客・クエストなどに表情を付けた。ミラが自分の疲れを後回しにする発言は疲れ顔、プティのいたずらはニヤリ顔、アリアの早合点から謝る流れは笑顔→驚き→困り顔とした。台詞本文、シーンID、進行・セーブ形式は変更していない。

これは既存の会話への表示実装であり、新しい第二章のシナリオ実装ではない。プティの素顔画像は従来記録向け。第二章のパンプキンヘッド姿へこの素顔を流用しない。かぶり物の状態は第二章実装側で別に扱い、[人物設定](characters/pumpety.md) を守る。

## 生成記録

内蔵ツールへの最終プロンプトを以下に保存する。参照シートの文字情報を新たな人物設定として採用していない。アリア・プティには、最初の出力で髪がコマの端に近かったため、各1回の構図修正を行った。

### アリア

参照: `docs/characters/aria-reference-sheet.webp`。初回出力 `exec-50b3dd00-bd1c-4510-bc8c-c23f9150d074.png`、採用出力 `exec-313c7a28-d356-4215-8fab-42a01c96c1f6.png`。

```text
Use case: stylized-concept. Asset type: anime RPG dialogue face expression sprite atlas. Create one 4-column by 2-row grid image with exactly 8 equal square cells, aspect ratio 2:1, ideally 2048x1024. Input image is character identity and rendering STYLE REFERENCE only; do not reproduce its sheet layout or any text. Subject: Aria, the blonde elf in the reference, green eyes, long wavy honey-blonde hair, braided crown detail, white flower with brown feathers and green leaves at her left temple (viewer right), pointed elf ears, dark green gold-trimmed cape collar. Faithfully match her face, coloring and refined anime painting. Every cell is the SAME tightly framed frontal head and neck portrait, entire top of hair, feather tips and ears inside cell with a small safe margin; consistent center/scale and near-frontal angle, face large enough to read at 64px. Shoulders/cape collar only at bottom, no hands/props. Background plain opaque warm ivory in all cells. GRID ORDER is mandatory left to right: TOP ROW neutral attentive closed mouth; warm happy smile; surprised wide eyes and open small mouth; worried knitted raised inner brows. BOTTOM ROW serious determined furrowed brows and firm mouth; shy blushing averting eyes; tired heavy eyelids and small weary mouth; mischievous knowing asymmetric smile. Change facial expressions clearly while keeping identity, hairstyle, outfit, lighting and scale constant. Clean precise linework and rich soft cel shading, crisp readable eyes and mouths. No text, labels, numbers, borders, dividers, gutters, watermark, accessories beyond reference, or extra people. Keep all 8 cells seamlessly adjoining as a regular 4x2 atlas.
```

初回出力への修正:

```text
Edit this expression atlas only to correct framing. Preserve exactly the 4 columns x 2 rows order, all eight expressions, Aria's identity, hairstyle, colors and art style. Every cell must now contain her ENTIRE crown of hair, feather ornament tips, both ears, and side hair silhouette without touching top/left/right edges. Zoom out each portrait by 18 percent, use uniform scale in all 8 cells, and add a generous blank warm ivory safety margin above every head. Head tops must be visibly separated from every cell top by at least 30 pixels at 2048x1024 atlas size. Keep square cells, seamless 4x2 grid, opaque warm ivory backdrop, no gutters/borders/text. Show head and neck with small upper shoulders at bottom. Do not change facial expressions or their order.
```

### レオン

参照: `docs/characters/leon-reference-sheet.webp`。採用出力 `exec-97190abc-0278-408d-8952-3323cd80638e.png`。

```text
Use case: stylized-concept. Asset type: anime RPG dialogue face expression sprite atlas. Create one 4-column by 2-row grid image with exactly 8 equal square cells, aspect ratio 2:1, ideally 2048x1024. Input image is character identity and rendering STYLE REFERENCE only; do not reproduce its sheet layout or any text. Subject: Leon, youthful human man with short tousled brown hair, brown eyes, red scarf over blue high collar; faithfully match reference face, hairstyle, coloring and refined anime painting. Every cell is SAME front-facing head and neck portrait with just upper shoulders. ENTIRE hair silhouette must fit WITH a clearly visible generous warm ivory margin above and beside head. Reserve top 10% of EVERY cell as blank ivory; crown never touches edges. Consistent head scale and center, face large and clearly readable at 64px. No hands/props. Background plain opaque warm ivory in all cells. GRID ORDER mandatory left to right: TOP ROW neutral attentive closed mouth; warm happy smile; surprised wide eyes and open small mouth; worried knitted raised inner brows. BOTTOM ROW serious determined furrowed brows and firm mouth; shy blushing averting eyes; tired heavy eyelids and small weary mouth; mischievous knowing asymmetric smile. Change facial expressions clearly while keeping identity, hairstyle, outfit, lighting and scale constant. Clean precise linework and rich soft cel shading, crisp readable eyes and mouths. No text, labels, numbers, borders, dividers, gutters, watermark, extra accessories or people. Keep all 8 cells seamlessly adjoining as regular 4x2 atlas.
```

### ミラ

参照: `docs/characters/mira-reference-sheet.webp`。採用出力 `exec-e0bfbbac-1ffc-4506-9c3e-5a74730c6844.png`。

```text
Use case: stylized-concept. Asset type: anime RPG dialogue face expression sprite atlas. Create one 4-column by 2-row grid image with exactly 8 equal square cells, aspect ratio 2:1, ideally 2048x1024. Input image is character identity and rendering STYLE REFERENCE only; do not reproduce its sheet layout or any text. Subject: Mira, gentle young healer with pale lavender hair, lavender eyes, braided crown, moon crescent and white flower ornament at left temple (viewer right), white/purple healer collar with dark purple ribbon. Preserve her quiet softness with an undertone of fatigue, reference face and refined anime painting. Every cell is SAME front-facing head and neck portrait with just upper shoulders. ENTIRE crown and ornament silhouette must fit WITH clearly visible warm ivory margin above and beside head. Reserve top 8% of EVERY cell as blank ivory; crown never touches edges. Consistent head scale and center, face large and clearly readable at 64px. No hands/props. Background plain opaque warm ivory in all cells. GRID ORDER mandatory left to right: TOP ROW neutral gentle closed mouth; warm happy smile; surprised wide eyes and open small mouth; worried knitted raised inner brows. BOTTOM ROW serious quietly determined furrowed brows and firm mouth; shy blushing averting eyes; distinctly tired heavy eyelids and weary mouth; mischievous small knowing asymmetric smile. Change facial expressions clearly while keeping identity, hairstyle, outfit, lighting and scale constant. Clean precise linework and rich soft cel shading, crisp readable eyes and mouths. No text, labels, numbers, borders, dividers, gutters, watermark, extra accessories or people. Keep all 8 cells seamlessly adjoining as regular 4x2 atlas.
```

### プティ

参照: `docs/characters/pumpety-reference-sheet.webp`。初回出力 `exec-1c1fe862-0c56-4dae-ae4a-82e0256160b9.png`、採用出力 `exec-b643b637-ac53-4483-8b92-2f13b07543e4.png`。

```text
Use case: stylized-concept. Asset type: anime RPG dialogue face expression sprite atlas. Create one 4-column by 2-row grid image with exactly 8 equal square cells, aspect ratio 2:1, ideally 2048x1024. Input image is character identity and rendering STYLE REFERENCE only; do not reproduce sheet layout/text. Subject: Pumpety, playful little girl with warm brown twin tails, large green/teal eyes, distinctive green butterfly hair ornaments on both ponytails, tiny fang in grins, small beauty mark beneath her left eye (viewer right), high black frilled collar and green/gold outfit neckline. Preserve reference child face/proportions, hairstyle, coloring, elegant anime painting. Bare human face, NO pumpkin mask or costume head. Every cell is SAME front-facing head and neck portrait with just upper shoulders. ENTIRE crown, butterfly ornaments and twin tail silhouette must fit with clearly visible blank warm ivory margin above and beside head. Fit to width, allow 6% safe margin above and on both sides in EVERY square cell; hair never touches edges. Consistent head scale and center, face large enough to read at 64px. No hands/props or dolls. Background plain opaque warm ivory in all cells. GRID ORDER mandatory left to right: TOP ROW neutral attentive closed mouth; delighted happy fang smile; surprised wide eyes and open small mouth; worried knitted raised inner brows and small frown. BOTTOM ROW serious stubborn furrowed brows and firm mouth; shy blushing averting eyes; tired heavy eyelids and small weary mouth; mischievous impish grin showing a tiny fang with narrowed lively eyes. Expressions clearly distinct while keeping identity, hairstyle, outfit, lighting and scale constant. Clean precise linework and soft cel shading, crisp readable eyes and mouths. No text, labels, numbers, borders, dividers, gutters, watermark, extra accessories or people. Keep all 8 cells seamlessly adjoining as regular 4x2 atlas.
```

初回出力への修正:

```text
Edit this 4-column x 2-row expression atlas only to fix edge framing. Preserve character identity, every expression and its cell order, art style, colors, hairstyle, butterflies, fang details and beauty mark exactly. Uniformly zoom out ALL eight portraits by 12 percent so EVERY twin tail curl and hair strand fits completely inside its own square cell with warm ivory blank margin along both side edges and top edge. No hair may touch or cross a cell boundary. Keep portraits centered horizontally at identical scale. Extend matching plain warm ivory background. Keep head/neck/upper shoulder portrait framing with shoulders reaching bottom. Output same regular seamless 4x2 equal-square grid with no text, gutters, borders or dividers.
```
