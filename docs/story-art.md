# スチル制作記録

ゲーム内には読み込まない制作資料。スチル本体は `public/stories/`、場面・表示ページ・代替テキストは `lib/story-art.ts` に保存する。

## シナリオに合わせた追加8枚（2026-09-10）

組み込みの image_gen を使用し、各場面を独立した1枚絵として生成。既存の `public/stories/first-map.png` を絵柄とアリア・レオンの参照、`public/sprites.png` を仲間の人物デザインの参照とする。原寸の PNG を保存し、既存2枚と合わせて全10枚。生成プロンプトの原文と出力寸法は [追加スチルの生成記録](story-art-generation.json) に保存する。

| 物語 | シーンID | 保存先 | 初めて表示するページと場面 |
| --- | --- | --- | --- |
| 青い灯りの届く距離 | crystal-departure | public/stories/lantern-between.png | 2ページ目。ランタンをふたりの真ん中へ持ち直す |
| ほつれた言い訳 | slime-return | public/stories/mended-sleeve.png | 2ページ目。アリアが袖を繕い、レオンが見守る |
| 押し花の行き先 | blossom-return | public/stories/pressed-petals.png | 1ページ目。落ちていた花びらを旅の手帳にはさむ |
| 護衛のあとの約束 | royal-return | public/stories/festival-promise.png | 2ページ目。護衛を終え、アリアが半歩近づく |
| あなたの分も、淹れるから | recruit-mira-joined | public/stories/mira-own-tea.png | 2ページ目。ミラが自分の分の茶葉を量る |
| 最後の荷物 | recruit-garr-joined | public/stories/garr-last-luggage.png | 2ページ目。荷物を引き受けてもらったガルが空いた手を見る |
| 星図の余白 | recruit-luna-joined | public/stories/luna-chart-margin.png | 2ページ目。ルナが星図の余白に仲間のいた場所を描く |
| ひとくち目は、一緒に | recruit-poppy-joined | public/stories/poppy-first-sip.png | 2ページ目。空になった瓶を見てポピーの肩から力が抜ける |

会話は3行ずつ表示するため、`revealAtLine` はページ冒頭の0または3（既存の焚き火のみ6）。途中の場面の絵は、そのページを開くまで表示しない。前のページへ戻れば再び非表示になる。鑑賞一覧では、冒頭の絵は物語の解放時、途中の絵は読了時から鑑賞できる。仲間の加入場面は既存の加入条件に従い、人物が加わる前には出さない。

新しい物語・人物設定・セーブ項目は追加しない。既存の解放済みシナリオにも適用し、鑑賞しても冒険の時計や報酬を変えない。

### 追加8枚の目視確認

全8枚を原寸画像で確認。既存の絵柄、髪・目・耳・衣装、人物の手、小道具、文字や透かしがないことを確認した。袖の修繕ではふたりが手袋を外す自然な作業姿を採用。ルナの絵にはガルに加えてアリアとレオンも登場し、ペン先は星図の本体を指す。本文の「みんなの立っていた場所」に合う仲間との星図の会話として採用し、代替テキストは実際の構図を記述する。余白へ人物を書き込む瞬間そのものの再現ではない。

ブラウザ上の操作・画面幅別の見え方は今回の確認対象に含めない。

### 動作確認

- スチル・物語・加入に関する23テストが成功。画像の実寸、ページ単位の表示と巻き戻し、既読後の鑑賞参照、保存・進行を確認。
- TypeScriptの確認と本番ビルドが成功。追加PNG 8枚はビルド出力との一致を確認し、生成記録に保存先とSHA-256を記録。
- ローカルの配信先で全10枚が `200 / image/png` を返すことを確認。

## 最初の2枚（2026-09-10）

組み込みの image_gen で各1枚を生成。参照画像は public/sprites.png の先頭2人（アリアとレオン）。プロンプトは下記に原文を保存する。

| 場面 | 保存先 | 表示タイミング |
| --- | --- | --- |
| いつもの隣に | public/stories/first-map.png | herbs-departure の冒頭 |
| 今は、どこにも | public/stories/fireside.png | pilgrim-return の3ページ目、アリアが隣に座る場面から |

いずれも 1536 × 1024 px の PNG。生成物をそのまま採用し、ブラウザでは縦横比を保って全体を表示する。文字やハートは入れず、地図を寄せる動作と丸太に置く手の距離で描く。人物の髪・目・耳・衣装、独立した一枚の構図、手、文字なしを目視確認済み。焚き火の絵ではレオンの視線がアリア寄りになっているが、静かな場面として採用する。

実装は lib/story-art.ts と app/story-scenes.tsx。読了やセーブ形式を変更せず、旅の思い出で再生できる。既存の物語を読めるセーブにも追加操作なしで適用される。

## 生成プロンプト（原文）

## first-map

Use case: illustration-story. Create one original standalone wide landscape game event CG, approximately 1536 x 1024 pixels, for a cozy fantasy idle RPG. Reference input is character design only: the first two characters of the supplied spritesheet are Aria and Leon; ignore all other sprites and do not reproduce or edit the sheet. Convert their chibi designs into naturally proportioned youthful adult fantasy adventurers in polished hand-painted Japanese fantasy storybook/anime illustration. Aria: wavy blonde hair, green eyes, pointed elf ears, green hood with a pale feather and delicate gold trim, green cloak, white tunic, brown leather belts, gloves and boots, recognizable archer bow. Leon: tousled brown hair, brown eyes, red scarf and short red cape, blue tunic, silver shoulder armor, brown leather gloves and boots, sword. Scene: their first outing, early morning at a simple forest camp wooden table. Aria has spread a herb-gathering quest map between them and quietly tilts the paper map toward Leon; he points out a route with a clear natural hand gesture. Both look attentively at the map, familiar childhood friends sharing practical calm gestures, restrained warm expressions, no contrived blush. Map shows only drawn route marks and terrain shapes, no writing or lettering. Soft green forest and morning sunlight behind, emerald shadows and warm golden light, tactile painted cloth and wood. Centered medium framing, two characters and their expressive faces and hands are clearly legible at 420 pixels wide. Make the interaction the focus, cohesive richly painted background without visual clutter. Single continuous full-bleed composition. No text, captions, lettering, hearts, logos, frame, split panels, watermarks, explicit romance, embrace, kiss or handholding.

## fireside

Use case: illustration-story. Create one original standalone wide landscape game event CG, approximately 1536 x 1024 pixels, for a cozy fantasy idle RPG. Reference input is character design only: the first two characters of the supplied spritesheet are Aria and Leon; ignore all other sprites and do not reproduce or edit the sheet. Convert their chibi designs into naturally proportioned youthful adult fantasy adventurers in polished hand-painted Japanese fantasy storybook/anime illustration. Aria: wavy blonde hair, green eyes, pointed elf ears, green hood with a pale feather and delicate gold trim, green cloak, white tunic, brown leather belts, gloves and boots, recognizable archer bow. Leon: tousled brown hair, brown eyes, red scarf and short red cape, blue tunic, silver shoulder armor, brown leather gloves and boots, sword. Scene: after a mountain pilgrimage, they are seated shoulder-close on the same log beside a small nighttime campfire. Aria has just settled slightly closer. In the small visible gap between them, her gloved hand rests on the log beside his gloved hand, clearly separated and not touching. They both gaze down toward the fire with quiet restrained expressions and relaxed shoulders. Convey the subtle feeling of longstanding childhood friends through the small distance between them, no contrived blush. The green cloak and red scarf are very recognizable. Her bow and his fully sheathed sword are safely put beside the log. Soft stars and deep forest behind. Emerald nighttime shadows, warm golden firelight on faces and hands, tactile painted cloth and wood. Centered medium framing with both faces, the separated hands on the log, and small fire clearly legible at 420 pixels wide; naturally proportioned bodies, carefully drawn hands. Single continuous full-bleed composition with atmospheric background without clutter. No text, captions, lettering, hearts, logos, frame, split panels, watermarks. No embrace, kiss, handholding, touching hands, or explicit romance.

## オリジナルキャラクターの掛け合い（2026-09-10追加）

| 物語 | 画像 | 最初に表示する行（0起点） | 動作 |
| --- | --- | --- | --- |
| 試飲役には向かない | merrill-poppy-tasting.png | 3 | 試作品を飲んで顔をしかめるメリルと、慌てるポピー |
| 返さない宝物 | pumpety-finn-keepsake.png | 6 | 人形がお辞儀をし、プティが鍵を返す |
| 三分を数える手 | chacha-mira-tea.png | 3 | ミラが砂時計を置き直し、チャチャが座ってカップを持つ |

3枚とも1536×1024。衣装と既存の仲間の外見を引き継ぎ、文字や吹き出しは入れない。生成プロンプトと入力画像は [修正版の制作記録](original-character-art-v2-prompts.json)、画像の一覧は [オリジナルキャラクターのギャラリー](original-character-gallery.md)。

目視確認では人物は各2人で、指定衣装・表情・小道具・場面に対応している。チャチャの絵には予備も含めた3客のカップがあり、大剣は画面端で一部切れるが、物語の動作と鑑賞を妨げないため採用。
