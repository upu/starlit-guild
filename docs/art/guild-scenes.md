# 旅団画面の素材と配置

[下部ナビと画面の案内](../development/code-map/ui-shell.md) · [旅団の拠点機能](../gameplay/guild-base.md)

## 画面と描画の分担

旅団ホーム、リンデの菜園、ブレッカの栽培所は別画面。背景・家具・植物・仲間はPhaserで描き、操作と会話はReactで扱う。背景は床と周縁だけの手描き調ラスタ画像にし、家具・植物・人を個別に動かせる状態を保つ。拠点は共同住居ではなく仕事と連絡の場所。苔床は第四章で塔から離した栽培所を扱い、リンデに光る苔を増やさない。新しい地名・街道・距離は追加しない。

- `app/phaser-guild.tsx` / `app/phaser/guild-game.ts`: 遅延読込、サイズ変更、読込失敗時の再試行、破棄。冒険と同じ高解像度描画の補助を共用する。
- `app/phaser/guild-painter.ts`: 床、家具、成長する植物、人物と作業道具。足元のY座標で前後関係を決める。作業者は机の左側へ立ち、手元だけが机の端へ届く配置。
- `lib/guild-stage-model.ts`: 1000×750の配置基準、在室者と歩行経路。リンデの担当はプランターの角を回り込む。
- `app/phaser/guild-art.ts` / `lib/guild-art-frames.ts`: アトラスのコマと姿勢。フィン・リコは4歩行＋待機・世話・加工2の8コマ。他の3人は既存の冒険素材を共用する。アルファ境界で切り抜き、各シート内の縮尺を維持する。
- `app/guild-stage-props.tsx` / `app/guild-figure.tsx`: 加工ダイアログ内の作業台と担当者。同じラスタ素材を使い、お弁当は麺棒、お茶は匙、ソーダは瓶を動かす。
- `app/guild-prop-image.tsx` / `app/guild-plot-view.tsx`: ダイアログのラスタ素材の明示的な切り抜きと、画面上の植え付け操作・成長ゲージ。
- `app/guild-duty-marker.tsx`: 現地の［＋］と担当者の顔。作業台は机の下、栽培地は畑の脇から開く。下部はホーム／菜園の移動と種・材料の2アイコン。
- `app/guild-item-icon.tsx`: 商品棚・レシピ・材料・種で共用する画像。
- `public/ui/guild-banner.svg`: 竿の線を省いた灯籠の旗印。家・顔・等級の星数を使わない。

ホームの仲間は茶卓から通路を歩いて戻る。歩行と待機は24秒周期で切り替える。作業台では仕込み中だけ担当者と道具を動かし、一時停止や材料待ちでは止める。画面上の移動は進行判定に使わず、生産・収穫は旅団エンジンのみで処理する。`prefers-reduced-motion` は静止姿へ切り替える。

`tests/guild-stage.test.mjs` で歩行経路・素材の透明部分と歩行4コマを検査する。`tests/guild.browser.mjs` は隔離した保存でPhaserの動き、縮小表示、作業台、操作、成長、会話、4画面寸法を確認する。実機での体感確認とは区別する。

## 採用素材

内蔵 `image_gen` で生成・編集したPNG原本を `assets/source/guild/`、配信用WebPを `public/guild/` に保存する。背景は幅1080px・quality 87、アトラスは元解像度のlosslessで変換。絵の編集は生成ツールで行い、変換とアルファ境界の測定にSharpを使う。素材更新時はWebPと `lib/guild-art-frames.ts` を一緒に更新する。

| ファイル名（原本 .png / 配信 .webp） | 用途・参照画像 |
| --- | --- |
| `home-floor-v2` | 倉庫二階の空の床。`home-v1` の絵の質感を参照 |
| `linde-floor-v2` | リンデの菜園の通路。`linde-garden-v1` を参照 |
| `brekka-floor-v2` | 塔から離れた栽培所の地面。`brekka-garden-v1` を参照 |
| `props-v2` | 3列2段。茶卓、作業台、土の床、薬草、ニンジン、苔 |
| `finn-guild-v2` | 4列2段。既存フィンの特徴とレオンのセル塗りを参照 |
| `lico-guild-v2` | 4列2段。既存リコの赤毛・眼鏡・そばかす・花飾りを維持 |

### 採用版の生成指示

背景3点とアトラスの指示要旨を以下に残す。透明素材には `transparent_background: true`、背景には `false` を指定。

- ホーム: Edit the reference into a landscape 4:3 floor-only environment, overhead 55 degrees. Preserve warm painted wood, sunlight, windows and blue lantern pennant. Remove furniture, rug and stairs. Keep the central 80% empty and walkable; place decoration only at the perimeter. No people, text or UI.
- リンデ: Preserve the reference's textured sunny garden and paving. Overhead 55 degrees, landscape 4:3. Remove all beds; empty playable central 80%. Shed, wall and barrel only along the upper 15% and edges. No characters, text or UI.
- ブレッカ: Preserve the painted shaded clearing and drying shed. Overhead 55 degrees, landscape 4:3. Empty walkable ground; shed at upper edge only. Remove beds, desks, signs and central fences. No tower, characters, text or UI.
- 道具と植物: Six separate transparent sprites in a 3-column 2-row atlas, high overhead 55 degrees, painted fantasy game style. Row 1: tea table, empty wooden workbench, timber soil bed. Row 2: herb, carrot, moss. No ground plane, cast ground shadows, letters or people.
- リコ: Eight clean cel-shaded chibi poses, 4 columns and 2 rows, transparent RGBA. Match the existing Lico and other game sprites. Preserve messy red hair, glasses, freckles and flower. All face right. First row: left foot forward, passing, right foot forward, opposite passing, arms counter-swing. Second row: idle, tending, craft A, craft B. Distinct feet and working hands, no furniture.
- フィン初稿: Eight transparent game chibi poses with the same 4×2 walk/idle/tend/craft layout. Match existing Finn and Leon's compact proportions. Preserve middle-aged scruffy face, droopy mischievous eyes, stubble, brown ponytail and worn coat; do not turn him into a pretty boy. Distinct alternating legs and arms, no furniture.

フィンは線と塗りを揃えるため、初稿とレオンを参照して次のプロンプトで編集した（採用版）:

> Edit ONLY the rendering STYLE of the FINN eight-sprite atlas (image1) to closely match image2 Leon's clean GAME CHIBI CEL SHADING. Preserve image1 4x2 layout, ALL eight distinct body/leg/arm poses, transparent RGBA, clothes, brown ponytail, stubble and older man identity. Remove fine scratchy hair strokes, engraving/hatching, fabric realism and desaturated painterly look. Use LARGE smooth hair locks, thick clear outline, simple bold color blocks, only one shadow and one highlight tone per material, brighter warm brown hair, golden-brown coat trim, ivory shirt. Make face read forty-eight years old with obvious stubble, crow's feet, droopy cheeky eyes, broad easy grin; NOT pretty youthful anime hero. Same squat large-head chibi proportions as Leon, small compact torso and stubby legs, consistent head size all8cells. Keep the exact four walk phases of image1 with feet apart/together/apart/opposite passing, working hands on last2. No added objects, no text, no background. Actual alpha transparency.

## 背景検討の生成記録

次の3点は構図検討用として保持するが、現在の画面では読み込まない。`public/guild/home-v1.webp`、`linde-garden-v1.webp`、`brekka-garden-v1.webp`。内蔵 `image_gen` で生成し、1080px幅のWebPへ変換した。以下はその生成プロンプト。

### ホーム

Create the final separated HOME environment asset from this reference: ONLY the warehouse second-floor loft interior, filling the entire portrait 3:4 canvas. Remove the outdoor garden entirely; expand interior to a playable room. Clearly elevated overhead camera looking down 50-55 degrees, with large continuous floor space where tiny sprites can walk, painterly Japanese fantasy RPG scene. Keep beautiful warm lighting, blue lantern-emblem pennant, back windows and rustic shelves. Modest cozy shared working space, not living quarters. Layout: round tea table at (28%,48%), prep workbench with jars at (76%,30%), supply chest and seed sacks at (83%,63%), wooden staircase EXIT going down at (22%,88%). Broad open floors link all props with a clear path from table around center (50%,62%) to workbench. Small stools, brewing pots and a ledger. Leave open standing spaces beside table at (18%,55%) and (43%,57%), in front of workbench at (65%,42%), and center floor at (55%,72%). No characters, no UI, no text, no outdoor garden. Detailed hand-painted game background, matches reference quality and palette.

### リンデ

Final production BACKGROUND asset for a cozy Japanese fantasy RPG gardening screen. Portrait 3:4, high elevated overhead view looking DOWN 55 degrees, hand-painted anime storybook realism with soft lush detailed brushwork, warm daylight and blue-green shadows. ONLY an outdoor small garden behind a modest medieval river-town wooden warehouse; no interior room or cutaway. Fill whole scene with ground and spacious walkable stone paths, see top surfaces clearly. Main playable area: TWO rectangular wooden planters filled with EMPTY dark soil, first centered (28%,49%), second (70%,68%), sized roughly 28% canvas width and 13% height each. Paths at least a tiny character wide surround both and connect through broad center (48%,62%). Potting shed in TOP LEFT corner and warehouse stone wall at TOP edge, ivy and wildflowers border outer edges, water barrel and watering can at upper right, wooden fence/door at bottom left. River-town setting suggested through a small distant corner beyond fence only, no tall tower. Leave standing spaces centered (48%,51%) and (49%,77%) beside planters. No characters, no UI, no text, no plants inside the empty soil, no extra planters. Atmospheric beautiful game environment rather than web illustration, inviting and useful for sprite navigation.

### ブレッカ

Production BACKGROUND for a cozy Japanese fantasy RPG outdoor moss cultivation location, portrait 3:4, high overhead 55-degree camera looking down, ample clear walkable ground. Hand-painted anime storybook realism, lush detailed brushwork and crisp readable props. A small shaded cultivated clearing OUTSIDE a medieval brewing town, soft green dappled daylight, muted teal shadows. ONE large shallow rectangular timber-lined cultivation bed of EMPTY damp dark peat centered at (45%,60%), approximately42% canvas width and20% height, leave peat EMPTY so game will overlay growing moss. Broad continuous stone-and-earth paths around all four sides and toward a little drying shed in upper-left corner (20%,20%). Drying racks with flat trays and modest clay jars under shed, a wooden ledger desk at (78%,35%), a water barrel, quiet green field and distant town roof hints at TOP only. Trees and ferns frame edges. Cultivation site relocated AWAY from the tower, so NO tower next to bed, no giant magical tree, no glowing forest, no luminous moss baked in, no garden vegetables, no extra beds. A small blank wooden wayfinding sign bottom-left. Space for tiny worker character on path at (72%,65%) and (60%,40%). No characters, no text, no UI. Beautiful grounded fantasy game location.
