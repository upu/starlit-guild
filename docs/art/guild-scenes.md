# 旅団画面の素材と配置

[下部ナビと画面の案内](../development/code-map/ui-shell.md) · [旅団の拠点機能](../gameplay/guild-base.md)

## 画面

旅団ホーム、リンデの菜園、ブレッカの栽培所は別画面。現在の実表示はコードで描くSVGの床・家具・作物に、既存の道中アトラスから切り出した仲間を重ねる。キャラが動く位置、手元、家具の前後、作物の成長を個別に調整できる構成を優先する。拠点は共同住居ではなく仕事と連絡の場所。苔床は第四章で塔から離した栽培所を扱い、リンデに光る苔を増やさない。新しい地名・街道・距離は追加しない。

- `app/guild-stage-floor.tsx`: 床と壁・窓、菜園の地面と周縁。家具や作物を床へ描き込まない。
- `app/guild-stage-props.tsx`: 茶卓・作業台。作業台の奥、担当者、手前の板、道具を別レイヤーにする。お弁当は麺棒、お茶はかき混ぜる匙と湯気、ソーダは瓶を動かす。
- `app/guild-plot-view.tsx`: プランターの土・植物・手前の板。保存された開始／終了時刻から成長率を計算し、葉・根・苔の大きさとゲージに反映する。
- `app/guild-figure.tsx`: 既存の歩行・荷造り・押す姿勢を共用。各コマをSVGのクリップで明示的に切り抜き、縦横比の余白へ隣のコマが漏れないようにする。
- `app/guild-item-icon.tsx`: 既存の加工品画像と、種・資材を区別するSVG。商品棚・レシピ・材料・種の選択で共用する。
- `public/ui/guild-banner.svg`: 灯籠の旗印。家・顔・等級の星数を使わない。

ホームの手の空いた仲間は茶卓から通路を歩いて戻る。リンデの世話係は二つの枠の横へ移動し、ブレッカの担当は苔床の周りを歩く。歩行コマと作業コマは同じ24秒周期で切り替える。作業台では仕込み中だけ担当者と道具を動かし、一時停止や材料待ちでは止める。画面上の歩行は進行判定に使わず、生産・収穫は旅団エンジンのみで処理する。`prefers-reduced-motion` は静止姿へ切り替える。

小表示の人物サイズ、切り抜き、家具と歩行経路、成長表示、操作アイコンの押しやすさを `tests/guild.browser.mjs` で確認する。ユーザーのセーブではなく独立したテスト用保存を使う。

## 背景検討の生成記録

次の3点は構図検討用として保持するが、現在の画面では読み込まない。`public/guild/home-v1.webp`、`linde-garden-v1.webp`、`brekka-garden-v1.webp`。内蔵 `image_gen` で生成し、1080px幅のWebPへ変換した。以下はその生成プロンプト。

### ホーム

Create the final separated HOME environment asset from this reference: ONLY the warehouse second-floor loft interior, filling the entire portrait 3:4 canvas. Remove the outdoor garden entirely; expand interior to a playable room. Clearly elevated overhead camera looking down 50-55 degrees, with large continuous floor space where tiny sprites can walk, painterly Japanese fantasy RPG scene. Keep beautiful warm lighting, blue lantern-emblem pennant, back windows and rustic shelves. Modest cozy shared working space, not living quarters. Layout: round tea table at (28%,48%), prep workbench with jars at (76%,30%), supply chest and seed sacks at (83%,63%), wooden staircase EXIT going down at (22%,88%). Broad open floors link all props with a clear path from table around center (50%,62%) to workbench. Small stools, brewing pots and a ledger. Leave open standing spaces beside table at (18%,55%) and (43%,57%), in front of workbench at (65%,42%), and center floor at (55%,72%). No characters, no UI, no text, no outdoor garden. Detailed hand-painted game background, matches reference quality and palette.

### リンデ

Final production BACKGROUND asset for a cozy Japanese fantasy RPG gardening screen. Portrait 3:4, high elevated overhead view looking DOWN 55 degrees, hand-painted anime storybook realism with soft lush detailed brushwork, warm daylight and blue-green shadows. ONLY an outdoor small garden behind a modest medieval river-town wooden warehouse; no interior room or cutaway. Fill whole scene with ground and spacious walkable stone paths, see top surfaces clearly. Main playable area: TWO rectangular wooden planters filled with EMPTY dark soil, first centered (28%,49%), second (70%,68%), sized roughly 28% canvas width and 13% height each. Paths at least a tiny character wide surround both and connect through broad center (48%,62%). Potting shed in TOP LEFT corner and warehouse stone wall at TOP edge, ivy and wildflowers border outer edges, water barrel and watering can at upper right, wooden fence/door at bottom left. River-town setting suggested through a small distant corner beyond fence only, no tall tower. Leave standing spaces centered (48%,51%) and (49%,77%) beside planters. No characters, no UI, no text, no plants inside the empty soil, no extra planters. Atmospheric beautiful game environment rather than web illustration, inviting and useful for sprite navigation.

### ブレッカ

Production BACKGROUND for a cozy Japanese fantasy RPG outdoor moss cultivation location, portrait 3:4, high overhead 55-degree camera looking down, ample clear walkable ground. Hand-painted anime storybook realism, lush detailed brushwork and crisp readable props. A small shaded cultivated clearing OUTSIDE a medieval brewing town, soft green dappled daylight, muted teal shadows. ONE large shallow rectangular timber-lined cultivation bed of EMPTY damp dark peat centered at (45%,60%), approximately42% canvas width and20% height, leave peat EMPTY so game will overlay growing moss. Broad continuous stone-and-earth paths around all four sides and toward a little drying shed in upper-left corner (20%,20%). Drying racks with flat trays and modest clay jars under shed, a wooden ledger desk at (78%,35%), a water barrel, quiet green field and distant town roof hints at TOP only. Trees and ferns frame edges. Cultivation site relocated AWAY from the tower, so NO tower next to bed, no giant magical tree, no glowing forest, no luminous moss baked in, no garden vegetables, no extra beds. A small blank wooden wayfinding sign bottom-left. Space for tiny worker character on path at (72%,65%) and (60%,40%). No characters, no text, no UI. Beautiful grounded fantasy game location.
