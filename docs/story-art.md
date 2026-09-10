# スチル制作記録

ゲーム内には読み込まない制作資料。2026-09-10、組み込みの image_gen で各1枚を生成。参照画像は public/sprites.png の先頭2人（アリアとレオン）。プロンプトは下記に原文を保存する。

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

