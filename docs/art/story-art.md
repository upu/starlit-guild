# スチル制作記録

案内：[アート・音](README.md)

## 配信用 WebP の生成

採用した元 PNG は `assets/source/stories/` に保存する。`npm run stills:optimize` は各 PNG から鑑賞用の `public/stories/<名前>.webp` と、中央を正方形に切り抜いた `public/stories/thumbnails/<名前>.webp` を生成する。設定は `config/story-stills.json`、入力・出力のハッシュと容量は `assets/story-stills.manifest.json` に記録する。元 PNG を配信しない。

`npm run dev` と `npm run build` の開始前にも生成する。新しい絵を追加したら元 PNG・両 WebP・manifest を一緒にコミットし、鑑賞画面で構図を確認する。`npm run stills:check` はファイルを変えずに再生成の要否を調べ、CI でも実行する。保存されるのはシーン ID の既読情報で、画像パスの変更では `story.read` を変更しない。

## 第四章のスチル制作

[第四章のスチル制作](chapter-four-stills.md) に、苗を守るリコ、青い布の陰の二人、徹夜したミラを心配する二人、旅団結成の4場面をまとめた。

4-7「苗を守るリコ」は、キャラクター紹介も兼ねて二人の足元まで見える全身構図を採用した。`assets/source/stories/lico-protects-seedlings.png`（1536×1024）から共通パイプラインで鑑賞用WebPと320×320のサムネイルを生成する。リコは赤・黒の採用リファレンスに合わせ、メリルの太ももとふくらはぎに厚みを持たせた。制作ツールは組み込み `image_gen`。[画像一覧](story-art-gallery.md#第四章苗を守るリコ)と[最終プロンプト・制作記録](../art-generation/chapter-four-stills.json)を参照する。

第四章の本編は未実装のため、会話・アルバムへの表示登録はまだ行わない。ほかの3場面は未制作。

## 第三章：食堂、手当て、四人のお茶

採用した一枚絵は次の3枚。原本は1536×1024のPNGで、共通パイプラインから鑑賞用WebPと320×320のサムネイルを生成する。[画像一覧](story-art-gallery.md#第三章の一枚絵)と[採用画像・プロンプトの生成記録](../art-generation/chapter-three-stills.json)を参照。表示の接続状況は[第三章の実装仕様](../gameplay/chapter-three-gameplay.md#実装状況)で管理する。

| 原本（`assets/source/stories/`） | 対応する会話 | 場面 |
| --- | --- | --- |
| `finn-at-breakfast.png` | `berne-road-departure` | 食堂の隣の席で頬杖をつくフィン。気の抜けた姿と、話を聞いている目を見せる |
| `mira-tends-finn.png` | `keystone-night-road-departure` | ミラがフィンの右手の傷を手当てする。指を動かせるよう薄く布を巻く |
| `four-cups-of-tea.png` | `berne-restoration-return` | 灯りが戻った夕方、四人でお茶。アリアとレオンは設定図に沿った若い顔立ち、フィンは目を閉じた笑顔と指輪、ミラは血色の薄い疲れた顔を保つ |

お茶会の採用版は、設定資料から新規生成した絵にアリアとレオンの顔立ちを合わせたもの。フィンは右手に包帯、左手に指輪をつける。制作ツールは組み込み `image_gen`、モデル識別子は返されていない。

## 第二章2-8・2-9：薬の配達と三人のお茶

組み込み `image_gen` で各1536×1024の画像を制作。アリア・レオン・ミラのリファレンスシートを外見・衣装の参照に使い、文字なしの一枚絵にした。モデル識別子は返されていない。最終プロンプトは [生成記録](../art-generation/chapter-two-finale-art.json) に保存。

- `assets/source/stories/medicine-delivered.png`：`waiting-households-return` の0始まり4行目、ミラが匙で薬を飲ませる行から表示。少年・母親側の肩越しにミラを正面から見る構図。重いまぶた、目の下の影、疲れた肩に寝不足をにじませ、薬を飲ませる優しさを保つ。衣装はミラの設定図に合わせ、肩が見えるローブと細い肩紐を保つ。アリアとレオンは画面外。瞬時の全快や魔法の発光を置かない。
- `assets/source/stories/three-cups-of-tea.png`：`medicine-road-home-return` の0始まり11行目、ミラがカップを受け取り一口飲む行から表示。ミラは空いた手を往診のメモへ伸ばし、アリアが紙をそっと遠ざける。レオンはカップを持って笑う。大きな頭と小さな体、誇張した表情のコミカルなデフォルメ画にし、同じ机に三人と三つのカップを置く。休んでも仕事を増やしかける癖を小さな仕草で見せる。対応する地の文もこの動作へ合わせた。

両画像を目視し、人物の外見、匙での服薬とお茶の最初の一口、三人の席とカップ数、不要な文字の不在を確認。読了後は共通アルバムから閲覧できる。

## 第二章2-6：大小の人形

`assets/source/stories/begging-dolls.png` は1536×1024。`begging-golem-departure` の0始まり3行目、大小の人形が同じおねだりをする行から表示し、既存の思い出・アルバムにも登録する。

大小の人形はカボチャやコウモリ、黒・緑・黄色の布でハロウィン風に飾る。少し後ろに小柄なプティを置き、パンプキンヘッドをかぶったまま操る。穴の内側は暗く、素顔や目元は見せない。ゴーレムの両手は各5本（親指1本＋指4本）。

戦闘用の `public/enemies/mountain-puppet.png` と `public/enemies/cargo-golem.png` は同じ意匠の1024×1536透過PNG。2-5の人形、2-6の人形と大型ゴーレムに使い、縦横比を保って表示する。制作ツールは組み込み `image_gen`。モデルの識別子は返されていない。詳細は [生成記録](../art-generation/stage-2-6-art.json) を参照。

## 第一章1-9：塔の再点灯

組み込み image_gen で1536×1024の初版を生成。採用画像は2026-09-17にユーザー提供のフードを下ろした版をもとに、塔の窓の灯りを淡い紫へ編集し、`assets/source/stories/tower-light-restored.png` へ保存した。`tower-moss-removal-return` の0始まり6行目、塔に淡い紫の光がともる瞬間から表示する。読了後はアルバムでも鑑賞できる。1-8には一枚絵を追加せず、水路の修理までに分けた。

二人は寄り添って座り、正面の塔を向く後ろ姿。採用画像ではアリアのフードを下ろし、長い金髪と花飾りを見せる。塔の窓には弱い紫の灯りがともる。

初版と差し替え時のプロンプト、採用画像の出典とハッシュは [制作記録](../art-generation/stage-1-9-art.json) に保存する。モデル識別子はツールから返されていない。画像の確認とブラウザ・実機確認は区別する。

初版では、アリアのフードとマントの布の連続を局所修正した。これは差し替え前の制作履歴であり、現在の採用画像には適用しない。

ゲーム内には読み込まない制作資料。スチル本体は `public/stories/`、場面・表示ページ・代替テキストは `lib/story-art.ts` に保存する。

## 第一章1-7・1-8

- `assets/source/scenery/old-waterway.png`：古い水路の一覧・冒険背景。半ば塞がれた排水口と湿った斜面を描く。
- `assets/source/scenery/tower-drainage-open.png`：1-8の10地点目以後と達成後の待機背景。流れの戻った水路と脇へ積んだ丸太を描く。再出発では作業前の背景から始める。
- 1-8終幕には一枚絵を置かず、水路が戻った状態を背景と会話で見せる。
- 採用背景は1536×1024。組み込みimage_genを使用し、既存の塔の風景を参照した。プロンプト原文と目視確認は [制作記録](stage-1-7-1-8-art.md) を参照。

## 第一章1-6

森の湿地背景は組み込み `image_gen` で制作。苔を比較するスチルは2026-09-15にユーザー提供の1536×1024 PNGへ無加工で差し替えた。背景は [1-6の制作記録](../art-generation/stage-1-6-art.json)、採用スチルの出典とハッシュは [採用画像の記録](../art-generation/stage-1-6-closeup-art.json) に保存した。

- `assets/source/scenery/forest-wetland.png`：1-6の一覧・冒険背景。午後の木陰、湿った石と根、浅い水辺、人物が歩く地面を描く。塔や光る苔は置かない。
- `public/stories/forest-moss-aria.webp`：`forest-wetland-return` の0起点5行目、アリアが二つの入れ物を顔の近くまで持ち上げて見比べる動作から表示。読了後はアルバムで鑑賞できる。

採用画像は、木漏れ日が差す苔むした石壁の前で、アリアが二つの苔の器を顔の近くへ持ち上げた構図。金髪、緑の瞳、尖った耳、羽飾りのある緑と金のフード、革手袋を繊細に描く。原本は `assets/source/stories/forest-moss-aria.png` に保持する。以前の可逆WebPは1,873,356 bytesで、原本PNGの3,064,032 bytesから約39%削減し、両画像の全画素一致を確認した。現在の配信用WebPは上記の生成手順で作る。

提供画像の人物、二つの器、背景、文字の不在を目視確認。表示行・寸法・保存先は既存の自動テストで検証する。画像確認とゲーム画面のブラウザ操作・実機検証は区別する。

## 第一章1-4・1-5

組み込み `image_gen` で専用背景2枚、苔灯の対象物1枚、発見場面1枚を生成。原寸PNGをゲームの参照先へ保存した。背景は既存の夕方の交易路、人物は `village-trade-handover.png` の外見・衣装を参照する。生成時のモデル識別子はツールから返されていない。

| 保存先 | 用途・表示条件 |
| --- | --- |
| `assets/source/scenery/tower-road.png` | 1-4の一覧・冒険背景。昼の青空、畑、林、普通の土の道、遠景の小さな塔。水たまりや泥を強調しない |
| `assets/source/scenery/moss-night-road.png` | 1-5の一覧・冒険背景。夜の交易路と村々への分かれ道。地面を見分けられる月明かり |
| `public/items/moss-lamp.png` | 1-5の足元確認地点に表示する木の入れ物と淡く光る苔。透明背景。魔物除けや防御効果はない |
| `assets/source/stories/tower-moss-discovery.png` | `tower-road-return` の0始まり20行目、苔について尋ね、灯りとして試したい理由を伝え、採取の許可を得た後、木の入れ物の中で苔が光る場面から表示。読了後はアルバムでも鑑賞可能 |

会話は一行送りのため、絵の表示条件は3行ごとのページ境界に縛らない。絵は光る苔を手に取る以前には見せない。

4枚を画像で確認。背景の昼夜、二人の髪・目・耳・衣装、木べらと入れ物、文字や透かしがないことを確認した。苔は羽状の小葉を持つ描写で、1-5の葉の並びへの見覚えと揃える。画像の確認とゲーム画面でのブラウザ操作検証は区別する。

### 発見場面のアップへの改訂（2026-09-16）

組み込み `image_gen` で既存の `tower-moss-discovery.png` を編集し、同じ保存先へ差し替えた。出力は1536×1024のPNG。人物の外見と絵柄は [アリアの設定画](../characters/aria-reference-sheet.webp) と [レオンの設定画](../characters/leon-reference-sheet.webp) を直接参照した。二人の顔と苔灯に寄り、アリアの頭のフードを下ろして白い花飾りと編み込みを見せる。顔、衣装、木べら、容器を支える手、淡い苔の光を画像で確認した。会話と表示条件は既存のまま。

さらに色合いを設定画へ寄せ、夕日の橙色と強い陰影を抑えた。淡いベージュの金髪、明るい肌、落ち着いた緑・くすんだ赤・青灰色の衣装、柔らかな陰影を優先し、アップの構図と手元の動作を維持。組み込み `image_gen` による1536×1024 PNGを同じ保存先へ差し替え、設定画と目視で比較した。

最終的に、苔がほんのり光る場面として照明を再調整した。設定画に寄せた人物の色とアップの構図を保ち、塔の外側の日陰で周囲の明るさを抑え、苔の淡い薄緑の光を器の縁・近くの手袋・木べらへ控えめに映した。葉の形と二人の表情が読めること、光線や粒子などの強い魔法演出がないことを目視確認。組み込み `image_gen` による1536×1024 PNGを同じ保存先へ差し替えた。

淡い発光の最終プロンプト（入力1＝色合い再調整版）：

> Use case: lighting-weather. Edit this STARLIT GUILD story still, preserving the exact close-up composition, character identities, facial expressions, poses, hair and costumes, delicate anime drawing style, subdued reference-sheet palette, wooden container, spatula and all hands. User correction: this scene depicts moss GLOWING FAINTLY; make its quiet emitted light perceptible. Change lighting only and shade the immediate background appropriately. They are beside the shaded exterior base of a stone tower in late afternoon, NOT at night. Reduce the overly bright ambient daylight around the characters to gentle cool gray-blue open shade; suppress bright sky and bright backlighting so pale moss luminescence reads naturally. Keep faces clearly readable and softly colored, preserve Aria's ash-beige blonde hair, ivory skin and sage-green cloak and Leon's muted brick-red scarf and slate-blue clothing. The little featherlike moss emits a SUBTLE soft pale mint-green light from within its leaves. The moss should look alive and weakly bioluminescent, never neon, white-hot or dazzling. Very restrained tiny halo immediately around leaves, a soft mint reflection on the inner wood rim, nearby glove seams and underside/tip of the wooden spatula. The light reaches only the immediate hand-held area, not the whole faces or background. Retain leaf detail, do not overexpose the moss. The feeling is two people leaning close to notice a modest surprising glow. Avoid big bloom, glowing particles, sparkles, magical beams, dramatic chiaroscuro, green face wash, orange sunset grade, heavy dark shadows, new objects, text or watermarks. Single 1536x1024 landscape illustration.

色合い再調整のプロンプト（制作履歴。入力1＝アップ改訂版、入力2＝アリア設定画、入力3＝レオン設定画）：

> Use case: style-transfer. Revise image 1, a landscape 1536x1024 story illustration. Keep its exact close-up two-person framing, poses, expressions, wooden spatula and moss container, and setting beside a stone tower. USER CORRECTION: much closer to the colors and rendering of reference sheets 2 (Aria) and 3 (Leon). The last result was still far too orange, saturated, high contrast and heavily painted. Treat sheets 2 and 3 as the PRIMARY art direction, and image 1 ONLY as composition/action reference. Repaint with the sheets' pale luminous skin, light ash-beige blonde Aria hair, muted sage/forest green cape, subdued antique-gold detail, ivory blouse, taupe-brown leather; Leon has neutral ash-brown hair, muted dusty brick-red scarf, desaturated slate-blue tunic and cool soft silver armor. Delicate fine light-brown linework, smooth translucent pastel shading, soft detailed anime faces closely matching the sheets' portrait panels. Remove orange sunset color grading, hard golden rim light, deep brown cast shadows, heavy textured brushwork, overly dark outlines, glossy metallic contrast. Use diffuse neutral daylight at the shaded tower, with light gray stone and airy muted sage foliage, a lightly rendered subdued background. Keep local colors distinct: do not apply a single beige wash or merely reduce global saturation. Aria's skin is porcelain ivory with subtle pink cheeks, her eyes clear soft green. Her white flower hair ornament and braided half-up long hair remain, head uncovered. Leon's face should share the reference's soft youthful delicate features, brown eyes. Keep the small featherlike moss faintly mint luminous with only delicate local reflected light. Both faces and entire wooden container, gloves and spatula must remain visible. Preserve comfortable friendly proximity and discovery action. No text, panels, watermark, added characters, hearts, magical beams. Final image should look painted by the same artist using the same palette and soft rendering as the two reference sheets.

アップ改訂時のプロンプト（制作履歴。入力1＝旧スチル、入力2＝アリア設定画、入力3＝レオン設定画）：

> Use case: style-transfer. Edit image 1 (the existing STARLIT GUILD chapter 1-4 moss discovery story still). Images 2 and 3 are authoritative Aria and Leon character design AND drawing-style references. Create a finished landscape 1536x1024 single illustration. Move camera closer: tight two-person upper-body composition, both faces about 30 percent larger than image 1, little surrounding scenery, faces and the wooden moss container dominate the frame. Keep both complete faces, all interacting hands, the entire small shallow wooden container and Aria's wooden spatula visible. Aria on left with delighted curiosity, Leon right with quiet surprised smile, looking down at softly luminous pale mint featherlike moss he holds in both gloved hands. Maintain same modest discovery at shady stone tower exterior in late afternoon, softly blurred stone wall with small moss patch behind. Match image 2 exactly for Aria's face, soft light blonde hair, braided half-up hairstyle, white flower and feather hair ornament, long elf ears, green eyes, dark green gold-embroidered cape and cream blouse with brown leather bodice and gloves. Her head is uncovered: REMOVE old hat/raised hood, hood rests behind shoulders; white flowers are in her hair as on reference. Match image 3 for Leon's gentle face proportions, layered brown hair, brown eyes, red scarf, blue gold-trimmed tunic, leather harness, steel shoulder armor and brown gloves. Match the delicate clean anime linework, soft restrained colors and gentle shading of the reference sheets, less saturated orange and less heavy painterly texture than old image. Preserve story action and natural friendly proximity. No additional people, no text, no panels, no watermark, no hearts, no magical beams or crystals. This is a story illustration, not a reference sheet.

初版の生成プロンプト（制作履歴）：

> Create a finished 1536x1024 landscape anime fantasy story illustration. Preserve Aria and Leon's exact recognizable character designs from reference: Aria young adult female elf, long blonde hair green eyes, pointed ears, forest green gold embroidered feathered ranger hat and cape, cream blouse, brown leather gloves/bracers, bow/quiver; Leon young adult human male, tousled brown hair brown eyes, red scarf cape, blue tunic steel shoulder armor and brown gloves. NEW scene at the shady outside base of a modest local stone beacon tower, late afternoon. They have permission from caretaker (off frame) to take just a little moss. Leon holds a SMALL shallow plain wooden container at chest height with just a little softly glowing pale mint-green featherlike moss. Aria still holds a small wooden spatula near the container, looking delighted and curious at the moss. Leon looks at the gently lit seam of his glove with a quietly surprised smile. Their shoulders comfortably near, affection through relaxed gestures, no romance icons. Small moss patch on damp exterior stones behind, no big shining crystals, no magical beams, no explanation of tower mechanism, no text, no watermark, no other characters. Main hands and container fully in frame. Intimate useful discovery, painterly atmospheric detail matching reference.

## 第二章2-2：ミラが倒れる

- 採用画像：[`mira-collapse.png`](../../assets/source/stories/mira-collapse.png)、1536×1024。内蔵 `image_gen` で制作。
- 参考：`characters/aria-reference-sheet.webp`、`characters/leon-reference-sheet.webp`、`characters/mira-reference-sheet.webp`。外見・衣装のみを参照し、シート内の文字は設定へ採用しない。
- 表示：`moonlit-herbs-return` の第7行（0始まりで6）、ミラの膝が折れる行から。2-1のお昼には画像を置かない。
- 画像確認：倒れたミラをレオンが支え、アリアが荷物をどけて近くへ寄る。三人の外見、支える動作、作りかけの薬のある仕事場を確認した。

最終プロンプト：

```text
Create one landscape 1536x1024 illustration-story still for STARLIT GUILD, using these three sheets ONLY as character appearance references, not layouts or text. Painterly anime fantasy RPG scene, delicate textured painting and soft afternoon window light, muted natural colors. Interior of a modest healer's workroom with wooden desk, paper-wrapped herbs and unfinished medicine parcels. Exact narrative instant: Mira (lavender hair, white/lavender moon-motif healer robes, herb pouch) has actually fainted from exhaustion while standing up; her knees have buckled, eyes closed and body limp, and Leon (brown hair, blue tunic, leather armor, red scarf) kneels urgently catching and supporting her upper torso and shoulders before she falls. Aria (long blonde hair, elf ears, green eyes, white flower hair ornament, forest green cloak) has rushed to their side and is crouching close, one hand moving a bag off the floor, looking anxiously at Mira and calling her name. All three fully clothed, non-romantic rescue scene, physically credible arms and weight support. Mira central; all faces and support gesture clearly readable in the middle portion of landscape. Background only herbs, parcels, wooden furniture, no extra people, no modern medical equipment, no glow magic, no blood, no comic panels, no letters or typography, no border. Retain distinctive reference costumes and faces.
```

クエスト背景の元PNGは `assets/source/scenery/` へ移動済み。実際の表示には[用途別の生成WebP](scenery-images.md)を使用する。
