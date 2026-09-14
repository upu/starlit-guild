# スチル制作記録

## 第一部1-9：塔の再点灯

組み込み image_gen で1536×1024のスチルを生成し、`public/stories/tower-light-restored.png` へ保存。`tower-moss-removal-return` の0始まり6行目、塔に淡い紫の光がともる瞬間から表示する。読了後はアルバムでも鑑賞できる。1-8には一枚絵を追加せず、水路の修理までに分けた。

二人は寄り添って座り、正面の塔を向く後ろ姿。人物の顔を見せず、風景の広がりと筆跡を残す。塔の窓には復旧し始めたばかりの淡い紫を置き、強い光線や明るすぎる道を避ける。

正確なプロンプトと画像の確認結果は [生成記録](stage-1-9-art.json) に保存する。モデル識別子はツールから返されていない。画像の確認とブラウザ・実機確認は区別する。

後ろ姿の衣装では、アリアのフードを独立した帽子に見せない。後頭部から首元・肩・マントへ緑の布が連続し、髪はフードの開口部から自然に出す。後頭部全体の髪でフードとマントのつながりが途切れて見える箇所を局所修正した。首から肩への布の連続、脇へ流れる髪、座る構図と塔の光の維持を画像で確認済み。

ゲーム内には読み込まない制作資料。スチル本体は `public/stories/`、場面・表示ページ・代替テキストは `lib/story-art.ts` に保存する。

## 第一部1-7・1-8

- `public/stages/old-waterway.png`：古い水路の一覧・冒険背景。半ば塞がれた排水口と湿った斜面を描く。
- `public/stages/tower-drainage-open.png`：1-8の10地点目以後と達成後の待機背景。流れの戻った水路と脇へ積んだ丸太を描く。再出発では作業前の背景から始める。
- 1-8終幕には一枚絵を置かず、水路が戻った状態を背景と会話で見せる。
- 採用背景は1536×1024。組み込みimage_genを使用し、既存の塔の風景を参照した。プロンプト原文と目視確認は [制作記録](stage-1-7-1-8-art.md) を参照。

## 第一部1-6

組み込み `image_gen` で森の湿地背景と苔を比較する一枚絵を制作し、原寸1536×1024 PNGを採用。モデル識別子はツールから返されていない。背景は [1-6の制作記録](stage-1-6-art.json)、採用スチルは [最終制作記録](stage-1-6-closeup-art.json) に保存した。

- `public/stages/forest-wetland.png`：1-6の一覧・冒険背景。午後の木陰、湿った石と根、浅い水辺、人物が歩く地面を描く。塔や光る苔は置かない。
- `public/stories/forest-moss-aria-oil.png`：`forest-wetland-return` の0起点5行目、アリアが二つの入れ物を顔の近くまで持ち上げて見比べる動作から表示。人物は `tower-moss-discovery.png` の髪・目・衣装を継承する。読了後はアルバムで鑑賞できる。

比較の一枚絵は油彩調。正面寄りの胸上でアリアの顔と表情を主役に、両手で二つの苔を顎の近くまで持ち上げる。肩幅とマントの横への広がりを抑え、腕を内側へ寄せる。厚みのある筆跡、髪と顔の暖かな光、森の緑で他のスチルと雰囲気を変える。[生成プロンプトと記録](stage-1-6-closeup-art.json) を参照。

アリアの金髪・緑の目・尖った耳・緑と金のフード、正面寄りの胸上の構図、油彩の筆跡、狭めた肩とマント、顔の近くの二つの器、苔に向く視線、文字の不在を画像で確認した。背景は通行スペースを確認済み。表示行・寸法・保存先は自動テストで確認。ゲーム画面のブラウザ操作や実機検証とは区別する。

## 第一部1-4・1-5

組み込み `image_gen` で専用背景2枚、苔灯の対象物1枚、発見場面1枚を生成。原寸PNGをゲームの参照先へ保存した。背景は既存の夕方の交易路、人物は `village-trade-handover.png` の外見・衣装を参照する。生成時のモデル識別子はツールから返されていない。

| 保存先 | 用途・表示条件 |
| --- | --- |
| `public/stages/tower-road.png` | 1-4の一覧・冒険背景。昼の青空、畑、林、普通の土の道、遠景の小さな塔。水たまりや泥を強調しない |
| `public/stages/moss-night-road.png` | 1-5の一覧・冒険背景。夜の交易路と村々への分かれ道。地面を見分けられる月明かり |
| `public/items/moss-lamp.png` | 1-5の足元確認地点に表示する木の入れ物と淡く光る苔。透明背景。魔物除けや防御効果はない |
| `public/stories/tower-moss-discovery.png` | `tower-road-return` の0始まり20行目、苔について尋ね、灯りとして試したい理由を伝え、採取の許可を得た後、木の入れ物の中で苔が光る場面から表示。読了後はアルバムでも鑑賞可能 |

会話は一行送りのため、絵の表示条件は3行ごとのページ境界に縛らない。絵は光る苔を手に取る以前には見せない。

4枚を画像で確認。背景の昼夜、二人の髪・目・耳・衣装、木べらと入れ物、文字や透かしがないことを確認した。苔は羽状の小葉を持つ描写で、1-5の葉の並びへの見覚えと揃える。画像の確認とゲーム画面でのブラウザ操作検証は区別する。

発見場面の生成プロンプト：

> Create a finished 1536x1024 landscape anime fantasy story illustration. Preserve Aria and Leon's exact recognizable character designs from reference: Aria young adult female elf, long blonde hair green eyes, pointed ears, forest green gold embroidered feathered ranger hat and cape, cream blouse, brown leather gloves/bracers, bow/quiver; Leon young adult human male, tousled brown hair brown eyes, red scarf cape, blue tunic steel shoulder armor and brown gloves. NEW scene at the shady outside base of a modest local stone beacon tower, late afternoon. They have permission from caretaker (off frame) to take just a little moss. Leon holds a SMALL shallow plain wooden container at chest height with just a little softly glowing pale mint-green featherlike moss. Aria still holds a small wooden spatula near the container, looking delighted and curious at the moss. Leon looks at the gently lit seam of his glove with a quietly surprised smile. Their shoulders comfortably near, affection through relaxed gestures, no romance icons. Small moss patch on damp exterior stones behind, no big shining crystals, no magical beams, no explanation of tower mechanism, no text, no watermark, no other characters. Main hands and container fully in frame. Intimate useful discovery, painterly atmospheric detail matching reference.

## 従来記録のスチル8枚

組み込みの image_gen を使用し、各場面を独立した1枚絵として生成。`public/stories/first-map.png` を絵柄とアリア・レオンの参照、`public/sprites.png` を仲間の人物デザインの参照とする。原寸の PNG を保存し、生成プロンプトと出力寸法は [生成記録](story-art-generation.json) に保存する。

| 物語 | シーンID | 保存先 | 初めて表示する行と場面 |
| --- | --- | --- | --- |
| 青い灯りの届く距離 | crystal-departure | public/stories/lantern-between.png | 0起点3行目。ランタンをふたりの真ん中へ持ち直す |
| ほつれた言い訳 | slime-return | public/stories/mended-sleeve.png | 0起点3行目。アリアが袖を繕い、レオンが見守る |
| 押し花の行き先 | blossom-return | public/stories/pressed-petals.png | 0起点0行目。落ちていた花びらを旅の手帳にはさむ |
| 護衛のあとの約束 | royal-return | public/stories/festival-promise.png | 0起点3行目。護衛を終え、アリアが半歩近づく |
| あなたの分も、淹れるから | recruit-mira-joined | public/stories/mira-own-tea.png | 0起点3行目。ミラが自分の分の茶葉を量る |
| 最後の荷物 | recruit-garr-joined | public/stories/garr-last-luggage.png | 0起点3行目。荷物を引き受けてもらったガルが空いた手を見る |
| 星図の余白 | recruit-luna-joined | public/stories/luna-chart-margin.png | 0起点3行目。ルナが星図の余白に仲間のいた場所を描く |
| ひとくち目は、一緒に | recruit-poppy-joined | public/stories/poppy-first-sip.png | 0起点3行目。空になった瓶を見てポピーの肩から力が抜ける |

会話は一発言ずつ追加する。`revealAtLine` の行へ達するまで途中の絵を見せない。鑑賞一覧では、冒頭から出る絵は物語の解放時、途中で出る絵は読了時から鑑賞できる。仲間の加入場面は加入条件に従い、人物が加わる前には出さない。鑑賞しても冒険の時計や報酬を変えない。

### 目視確認

全8枚を原寸画像で確認。既存の絵柄、髪・目・耳・衣装、人物の手、小道具、文字や透かしがないことを確認した。袖の修繕ではふたりが手袋を外す自然な作業姿を採用。ルナの絵にはガルに加えてアリアとレオンも登場し、ペン先は星図の本体を指す。本文の「みんなの立っていた場所」に合う仲間との星図の会話として採用し、代替テキストは実際の構図を記述する。余白へ人物を書き込む瞬間そのものの再現ではない。

## 従来記録の基礎スチル

組み込みの image_gen で各1枚を生成。参照画像は public/sprites.png の先頭2人（アリアとレオン）。プロンプトは下記に原文を保存する。

| 場面 | 保存先 | 表示タイミング |
| --- | --- | --- |
| いつもの隣に | public/stories/first-map.png | herbs-departure の冒頭 |
| 今は、どこにも | public/stories/fireside.png | pilgrim-return の0起点6行目、アリアが隣に座る場面から |

いずれも 1536 × 1024 px の PNG。生成物をそのまま採用し、ブラウザでは縦横比を保って全体を表示する。文字やハートは入れず、地図を寄せる動作と丸太に置く手の距離で描く。人物の髪・目・耳・衣装、独立した一枚の構図、手、文字なしを目視確認済み。焚き火の絵ではレオンの視線がアリア寄りになっているが、静かな場面として採用する。

実装は lib/story-art.ts と app/story-scenes.tsx。読了やセーブ形式を変更せず、旅の思い出で再生できる。既存の物語を読めるセーブにも追加操作なしで適用される。

## 生成プロンプト（原文）

## first-map

Use case: illustration-story. Create one original standalone wide landscape game event CG, approximately 1536 x 1024 pixels, for a cozy fantasy idle RPG. Reference input is character design only: the first two characters of the supplied spritesheet are Aria and Leon; ignore all other sprites and do not reproduce or edit the sheet. Convert their chibi designs into naturally proportioned youthful adult fantasy adventurers in polished hand-painted Japanese fantasy storybook/anime illustration. Aria: wavy blonde hair, green eyes, pointed elf ears, green hood with a pale feather and delicate gold trim, green cloak, white tunic, brown leather belts, gloves and boots, recognizable archer bow. Leon: tousled brown hair, brown eyes, red scarf and short red cape, blue tunic, silver shoulder armor, brown leather gloves and boots, sword. Scene: their first outing, early morning at a simple forest camp wooden table. Aria has spread a herb-gathering quest map between them and quietly tilts the paper map toward Leon; he points out a route with a clear natural hand gesture. Both look attentively at the map, familiar childhood friends sharing practical calm gestures, restrained warm expressions, no contrived blush. Map shows only drawn route marks and terrain shapes, no writing or lettering. Soft green forest and morning sunlight behind, emerald shadows and warm golden light, tactile painted cloth and wood. Centered medium framing, two characters and their expressive faces and hands are clearly legible at 420 pixels wide. Make the interaction the focus, cohesive richly painted background without visual clutter. Single continuous full-bleed composition. No text, captions, lettering, hearts, logos, frame, split panels, watermarks, explicit romance, embrace, kiss or handholding.

## fireside

Use case: illustration-story. Create one original standalone wide landscape game event CG, approximately 1536 x 1024 pixels, for a cozy fantasy idle RPG. Reference input is character design only: the first two characters of the supplied spritesheet are Aria and Leon; ignore all other sprites and do not reproduce or edit the sheet. Convert their chibi designs into naturally proportioned youthful adult fantasy adventurers in polished hand-painted Japanese fantasy storybook/anime illustration. Aria: wavy blonde hair, green eyes, pointed elf ears, green hood with a pale feather and delicate gold trim, green cloak, white tunic, brown leather belts, gloves and boots, recognizable archer bow. Leon: tousled brown hair, brown eyes, red scarf and short red cape, blue tunic, silver shoulder armor, brown leather gloves and boots, sword. Scene: after a mountain pilgrimage, they are seated shoulder-close on the same log beside a small nighttime campfire. Aria has just settled slightly closer. In the small visible gap between them, her gloved hand rests on the log beside his gloved hand, clearly separated and not touching. They both gaze down toward the fire with quiet restrained expressions and relaxed shoulders. Convey the subtle feeling of longstanding childhood friends through the small distance between them, no contrived blush. The green cloak and red scarf are very recognizable. Her bow and his fully sheathed sword are safely put beside the log. Soft stars and deep forest behind. Emerald nighttime shadows, warm golden firelight on faces and hands, tactile painted cloth and wood. Centered medium framing with both faces, the separated hands on the log, and small fire clearly legible at 420 pixels wide; naturally proportioned bodies, carefully drawn hands. Single continuous full-bleed composition with atmospheric background without clutter. No text, captions, lettering, hearts, logos, frame, split panels, watermarks. No embrace, kiss, handholding, touching hands, or explicit romance.

## オリジナルキャラクターの掛け合い

| 物語 | 画像 | 最初に表示する行（0起点） | 動作 |
| --- | --- | --- | --- |
| 試飲役には向かない | merrill-poppy-tasting.png | 3 | 試作品を飲んで顔をしかめるメリルと、慌てるポピー |
| 返さない宝物 | pumpety-finn-keepsake.png | 6 | 人形がお辞儀をし、プティが鍵を返す |
| 三分を数える手 | chacha-mira-tea.png | 3 | ミラが砂時計を置き直し、チャチャが座ってカップを持つ |

3枚とも1536×1024。衣装と既存の仲間の外見を引き継ぎ、文字や吹き出しは入れない。生成プロンプトと入力画像は [採用画像の制作記録](original-character-art-v2-prompts.json)、画像の一覧は [オリジナルキャラクターのギャラリー](original-character-gallery.md)。

目視確認では人物は各2人で、指定衣装・表情・小道具・場面に対応している。チャチャの絵には予備も含めた3客のカップがあり、大剣は画面端で一部切れるが、物語の動作と鑑賞を妨げないため採用。
