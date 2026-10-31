# 台詞・読者・思い出

1-6前の個人の携行袋と紐は `lib/storybook/forest-cue.ts`、布の往復の受け渡しは `forest-handoff.ts`。袋への追従・退出と掌の接点は `tests/storybook-forest.test.mjs`、実画面の確認範囲は[会話の補足確認](../../art/storybook-early-dialogue-gaps-review-20261031.md)を参照する。

1-5の夜の瓶・布の接触と受け渡しは `lib/storybook/night-dialogue.ts`。共通の夜姿勢は `night-cue.ts` に維持し、台詞ごとの距離と時刻だけを調整する。`tests/storybook-night-dialogue.test.mjs` が掌の一致・瓶の持ち主・布を掛ける順を検査し、実画面の範囲は [1-5・2-2の会話確認](../../art/storybook-night-herbs-dialogue-review-20261031.md)を参照する。

共通小物15種類の描画・接点・状態の確認と、全75会話の素材指定の最終点検は [共通小物の記録](../../art/storybook-common-props-review-20261031.md)。`shared-prop-art.ts` が初期・途中・退出へ同じ画像を渡し、旅行荷物は `common-props.css` と `stage-images.ts` で描画・先読みする。`tests/storybook-common-props.test.mjs` と `storybook-shared-props.test.mjs` が画像の可視範囲と動作中の素材維持を検査する。

絵本調の共通姿勢は `app/storybook/shared-poses.css`、接点は `lib/storybook/shared-pose-contacts.ts`、途中で必要な画像の準備は `shared-pose-images.ts`。肩掛け・押す・ベッド上の素材の梱包は `scripts/build-storybook-remaining-poses.mjs`。`tests/storybook-shared-poses.test.mjs` と [姿勢と接点の確認](../../art/storybook-shared-poses-review-20261031.md) に検証範囲を記録する。場面固有の姿勢を共通CSSで上書きせず、動作と物の状態を維持する。

絵本調の共通小物は `lib/storybook/shared-prop-art.ts`。`StorybookStage` で初期・途中・退出の `StageItem.image` を選び、`app/story-stage-chapter-props.tsx` と `story-stage-item-motion.ts` が同じ画像を描く。先読みは `stage-images.ts`、位置・持ち主の維持と動作中の旧画像への復帰防止は `tests/storybook-shared-props.test.mjs`。全章の実表示の素材参照と残る専用姿勢は [実表示の点検](../../art/storybook-rendered-assets-review-20261031.md) を参照する。

1-3で箱を台へ戻す途中も取引先の人を残す指定は `lib/storybook/carry-cue.ts` の `loweringCue`。出発前の全表示・途中演出で一人の商人を保つ検査は `tests/storybook-merchant-placement.test.mjs`。両幅の前15・後25表示と確認の限界は [1-3の確認記録](../../art/storybook-town-sequence-review-20261031.md)を参照する。

2-4・4-6・4-8の会話末尾から本編開始、および4-8の最終ナレーション中のメリルの退出と閉じる操作は [接続の確認](../../art/storybook-departure-seams-review-20261031.md)。メリルの退出は `lib/story-stage-seedlings.ts` の41表示目で始め、同じ終点を `exitExtras` に渡す。`tests/storybook-seedlings.test.mjs` が鍋の保持と退出後の再登場防止を検査する。

本編の「出発」からステージ表示・会話・読了・冒険開始までを保存しないデータで確認する入口は `app/sprite-lab/storybook/departure-phone/page.tsx`。本編の `PhoneGame` をそのまま使い、メモリー内の状態だけを進める。4-7出発前48表示と両幅の接続の記録は [出発前の確認](../../art/storybook-records-opening-review-20261031.md)。

冒険の描画を見終えた帰還会話の入口は `lib/storybook/adventure-entry.ts`。`useRestorationHandoff.completed` → `QuestCompletion.completedAdventure` → `StoryReader` の最初の舞台へ渡す。思い出や描画スキップでは省略しない。検査は `tests/storybook-adventure-entry.test.mjs` / `tests/story-reader.test.mjs`、本編構成の一時データは `/sprite-lab/storybook/moss-removal-phone`、確認範囲は [1-9の接続記録](../../art/storybook-moss-return-seam-review-20261031.md)。

会話の補助人物の動作・手元・IDの型は `lib/story-stage-extra-types.ts`。舞台の合図は `lib/story-stage-cues.ts` が同じ型を受け渡し、表示コマは `lib/story-stage-figure.ts`、手の座標は `lib/story-stage-extra-wrists.ts` が決める。

1-6帰還冒頭の瓶と器は `lib/storybook/forest-cue.ts`、姿勢は `app/storybook/forest.css`、時刻指定の見本は `app/sprite-lab/storybook/forest-sample/`。制作記録と未確認範囲は `docs/art/storybook-forest-jar-review-20261030.md`。
2-7帰還の作業場での蜜・布の受け渡しと運び手の控えは `lib/storybook/workshop-cue.ts` / `app/storybook/blockade-fork.css`。時刻指定の見本は `app/sprite-lab/storybook/workshop-handoff/`、接点・筆記姿勢の検査は `tests/storybook-puppets.test.mjs`、確認範囲は `docs/art/storybook-workshop-handoff-review-20261030.md`。
2-9帰着時の荷物・机とお茶の動きは `lib/storybook/homeward-office-cue.ts` / `app/storybook/homeward-office.css`。時刻指定の見本は `app/sprite-lab/storybook/homeward-tea-review/`、移動・注ぎ順・荷下ろしの検査は `tests/storybook-homeward-tea.test.mjs`、確認範囲は `docs/art/storybook-homeward-tea-review-20261030.md`。

2-4帰還の休憩は `lib/storybook/mountain-tea.ts`。ポットと支えの岩を掌へ合わせ、最後の地の文まで着座の手を維持し、受け渡し中のミラの名前を頭上へ置く。接点・姿勢と動作待ちの検査は `tests/storybook-mountain.test.mjs`、前後の会話の両幅確認は `docs/art/storybook-mountain-dialogue-review-20261031.md`。

4-7帰還の板と籠の経路・フィンの退避は `lib/storybook/records-field-cue.ts`、手元は `records-field-items.ts`。`tests/storybook-records-field.test.mjs` が接触と人物の間隔、帰路を次の台詞で再開しないことを検査する。確認範囲は [冒険と帰還の確認](../../art/storybook-records-sequence-review-20261031.md)。

4-8の名前・苗・紙・鍋は `lib/storybook/seedlings-actors.ts` / `seedlings-items.ts` / `seedlings-pot-pickup.ts`。フィンの名前は本人の真上に揃える。接触・回収・身体の倍率と一枚絵の維持は `tests/storybook-seedlings.test.mjs`、両幅の前35・後41表示は [一連の確認](../../art/storybook-seedlings-sequence-review-20261031.md) を参照する。
4-9夜道の荷車と車輪は `lib/storybook/transplant-night-cue.ts` / `app/storybook/transplant-wheel.css`。板と車輪の時刻指定見本は `app/sprite-lab/storybook/transplant-wheel-review/`、接地と追従の検査は `tests/storybook-transplant-night.test.mjs`。確認範囲は `docs/art/storybook-transplant-pull-timing-20261029.md`。
同帰還会話の森の苔を採り、別の器へ移す動きと経路は `lib/storybook/forest-collection.ts`、手元と器を避ける経路の検査は `tests/storybook-forest.test.mjs`。
最後の採取と帰還の見本は `app/sprite-lab/storybook/forest/`。確認用の最終地点、採取画面の保持、会話への入口は `adventure-review-points.ts`、`restoration-preview-state.ts`、`founding-return-review.tsx` にあり、本編の自動遷移とは別に確認する。

昼食の座位・菓子・水筒・紐は `lib/storybook/lunch-cue.ts` と `app/storybook/lunch.css`。素材は `scripts/build-storybook-lunch-overlook.mjs`、接触と32表示の検査は `tests/storybook-lunch.test.mjs`。ベルネ帰還は `overlook-cue.ts` / `overlook.css` / `tests/storybook-overlook.test.mjs`。[実表示の確認記録](../../art/storybook-lunch-review-20261027.md)も参照。

箱を着地後に支える時間は `StageActor.placeHoldMs` と `lib/story-stage-pose.ts`。保持から解放への順序・足元・reduced motion・既存の既定値は `tests/story-stage-placement-hold.test.mjs` で検査する。

3-9後半の塔の回復は `lib/story-stage-berne.ts` と `app/story-stage-restored.css`。石を戻した背景は `scripts/story-stage-keystone-art.mjs` と `config/rpg-backgrounds.json` に登録する。窓・石組みの発光は人物用の縮尺変換の外で背景へ固定し、窓から順に一度だけ点灯する。縮尺・包帯・一枚絵の維持は `tests/story-stage-restored-tower.test.mjs`。

第二章のプティ戦は [戦況別の掛け合い](../../../lib/pumpety-battle-banter.ts) を `chapterTwoBanter` から呼ぶ。[プティ戦の検査](../../../tests/pumpety-presentation.test.mjs) で通常進行中の会話・追撃動作・覆面の表情・会話の保持を確認する。

[作業別のコード案内](../code-map.md) に戻る。

舞台付き会話の最新台詞・履歴切り替えと、最後のタップ後の出発は `app/story-scenes.tsx` の `useReaderState` / `useStageExit`、動作完了は `app/story-stage-motion.ts` を参照する。操作の仕様は [会話と出発](../../art/story-stage.md#会話と出発の操作)。

1-3の取引先の人・手前の台・残りの荷は `app/story-stage-props.tsx`。小箱の置き場所と補間は `lib/story-stage-props.ts`、台詞を送ったときの位置保持と共同運搬への追従は `app/story-stage-box-motion.ts`。取引先の台詞別ポーズは `lib/story-stage-town.ts` に置く。

会話中の着座・運搬・専用動作の選択は `lib/story-stage-pose.ts`、手前を回る移動は `lib/story-stage-travel.ts`、NPCの歩行と持ち物の追従は `app/story-stage-extra-motion.ts`。台詞内の複数動作は `StageMoment` と `buildLaterStage` で組み立て、4-9の籠運びは `lib/story-stage-transplant.ts` に定義する。専用ポーズの登録は `scripts/story-stage-review-art.mjs`、縮尺・迂回・時系列の検査は `tests/story-stage-review.test.mjs`、手元高さ・支持物の重なり・受け渡しは `tests/story-stage-attachments.test.mjs` を参照する。

椅子・食卓・奥の席の退席通路は `lib/story-stage-furniture.ts`。2-3の寝台の姿勢と場面転換は `lib/story-stage-medicine.ts`、場面転換で位置を引き継がない処理は `buildLaterStage` の `stageStart` と `useStoryStageMotion`。`tests/story-stage-furniture.test.mjs` で共通アトラスの椅子座位、椅子の残存、寝台、最後の動作から出発への持ち物の引き継ぎを検査する。

低い岩・縁・踏み台は `lib/story-stage-low-seats.ts` の `lowSeat` と `StageActor.perch` を使い、支持物を人物と別に描く。アリア・レオン・ミラ・フィンは共通アトラス36〜43番、リコの同じ番号は踏み台を含む専用姿勢。4-6の支え歩き・手帳と鞄の受け取りは `lib/story-stage-lico.ts`、頭幅・接地・手元と到着時刻の検査は `tests/story-stage-low-seats.test.mjs`。

3-5前半の運び手・手当て・椅子の移動は `lib/story-stage-stone-yard.ts`、候補の石と手元の配置は `lib/story-stage-stone-yard-items.ts`、接点・到着時刻・共通アトラスの回帰検査は `tests/story-stage-stone-yard.test.mjs`。物置での比較・控えの受け渡しは `lib/story-stage-stone-rest.ts`、同じ小物と席の状態は `lib/story-stage-stone-rest-items.ts`、カップ・やかん・四脚の移動は `lib/story-stage-stone-tea.ts`、接点・到着時刻・障害物を避ける経路は `tests/story-stage-stone-rest.test.mjs`、4-10の同じ椅子を譲る動作は `lib/story-stage-founding.ts`、五人で回す登録用紙は `lib/story-stage-registration-paper.ts`。検査は `tests/story-stage-office-seats.test.mjs`。アリアの筆記2コマは共通アトラスの17・18番を使い、`scripts/story-stage-review-art.mjs` で歩行と頭幅・身長・足元を揃える。4-7の踏み台・反射装置・煙・記録板は `lib/story-stage-lico-records.ts`、素材の登録は `scripts/story-stage-lico-art.mjs`、接地・縮尺・受け渡しは `tests/story-stage-lico.test.mjs` を参照する。

4-10の見下ろし版での書類回しは `lib/storybook/founding-paper-circuit.ts` / `founding-paper-contacts.ts`、署名前に紙を取り上げる動作は `founding-signing-pickup.ts`、共通の補正入口は `founding-return-cue.ts`。`tests/storybook-founding-return.test.mjs` で接点・経路・椅子と静止画への切替位置を検査する。PC幅・スマートフォン幅の全111表示の範囲は [帰還会話の確認記録](../../art/storybook-founding-return-review-20261031.md)。

3-8の一枚絵より前の受傷・布の受け渡しは `lib/story-stage-night-hand.ts`、展示物と持ち物は `lib/story-stage-night-hand-items.ts`。フィンの共通アトラス17〜20番と小物の登録は `scripts/story-stage-night-hand-art.mjs`、縮尺・接点・経路・既存44コマの画素は `tests/story-stage-night-hand.test.mjs` で検査する。一枚絵が始まる13行目以降は `storyArtAt` の既存区間を維持する。

3-8後半の橋での合流、包帯の確認、荷車の包みを空いた手で叩く動作は `lib/story-stage-bridge.ts`。共通アトラスのフィン32・33番、ミラ17番と空の鉢は `scripts/story-stage-bridge-art.mjs`。静止した人物が荷物へ手を伸ばす間の前後関係は `lib/story-stage-props.ts` の `stageActorDepth`、接点・縮尺・経路・既存コマの画素は `tests/story-stage-bridge.test.mjs` を参照する。

3-9前半の石組みの準備、控えの受け渡し・重ね置き、目地の根の除去、柵と荷車の迂回は `lib/story-stage-restoration.ts`。管理人の共通アトラス8〜15番と小物は `scripts/story-stage-restoration-art.mjs`、NPCが運ぶ紙の手元は `lib/story-stage-extra-wrists.ts`。既存コマの画素・頭幅・接地・接点・受け渡しの時刻・経路は `tests/story-stage-restoration.test.mjs` で検査する。運び手の表示素材の選択は `stageExtraAtlas` を共通で使う。

旅団の日常は `lib/guild-stories.ts`、解放は `lib/guild-base.ts`、在室と未読の選択は `lib/guild-presence.ts`。`app/guild-chat.tsx` が共通の `Banter` で自動再生し、`app/use-banter-completion.ts` が最後の台詞の表示時間と一時停止を扱う。既読は `story.read`、思い出での再読は `StoryReader` を共用する。生成台本は `docs/story/game-script/guild.md`。`tests/guild.test.mjs` / `tests/story-reader.test.mjs` / `tests/guild.browser.mjs` で解放・在室・既読・停止・再読・表情を確認する。

- **編集元・主要関数**: [シーンの集約](../../../lib/stories.ts) の `stories` / `availableStories` → 対象章の本文。第三章は [接続](../../../lib/chapter-three-stories.ts) から [分割ファイル](../../../lib/chapter-three-opening-stories.ts) へ。第四章は [接続](../../../lib/chapter-four-stories.ts) から [幕間〜4-3の本文](../../../lib/chapter-four-stories-1.ts)・[4-4〜4-6の本文](../../../lib/chapter-four-stories-2.ts)・[4-7〜4-8の本文](../../../lib/chapter-four-conflict-stories.ts)・[4-9〜4-10の本文](../../../lib/chapter-four-stories-3.ts) と [道中会話](../../../lib/chapter-four-banter.ts) へ。[読者](../../../app/story-scenes.tsx) は `StoryReader`、[思い出の章選択と一覧](../../../app/story-library.tsx) は `StoryLibrary`、スチルは [storyArtAt](../../../lib/story-art.ts)。マップ下の掛け合いの送りと重複防止は [掛け合いの進行](../../../lib/banter-exchange.ts) の `nextBanter`。

- **仕様**: [シナリオの案内](../../story/README.md)、[人物一覧](../../characters/README.md)、対象章の実装資料。[ゲーム内台本](../../story/game-script/README.md)（`docs/story/game-script/`）は出力。
- **会話中のミニキャラ**: [台詞別の演出](../../../lib/story-stage.ts) → [会話の直上の舞台](../../../app/story-stage.tsx)・[動作の再生](../../../app/story-stage-motion.ts)・[表示](../../../app/story-stage.css)。1-1出発話と、`lib/story-stage-evening.ts` に定義した1-2出発・達成話と、`lib/story-stage-town.ts` の1-3出発・達成話を対象にする。共通の演出型は `lib/story-stage-cues.ts`。1-4〜1-9は `lib/story-stage-chapter.ts` から塔・夜道・森・水路の各定義へ進む。小物の追従は `app/story-stage-item-motion.ts`、NPCと道具は `app/story-stage-chapter-props.tsx`。第二章〜第四章の58場面（幕間2場面を含む）は `lib/story-stage-later.ts` から各舞台の定義へ進む。第一章〜第四章の76場面で最新台詞・履歴を共用し、1-1達成話と途中で現れる既存の一枚絵は静止画を保つ。ホームの歩行・冒険の作業・会話用の表情ポーズを使い、スチルが表示される場合はスチルを優先する。[背景と荷車の素材](../../art/story-stage.md)は [配信生成](../../../scripts/build-story-stage-art.mjs) で用意する。[動作検査](../../../tests/story-stage.test.mjs)・[読者](../../../tests/story-reader.test.mjs)と、手動テストの `story-stage.browser.mjs` / `story-evening.browser.mjs` / `story-chapter.browser.mjs` / `story-later.browser.mjs` で台詞同期・早送り・画面幅・再読を確認する。
- **設定資料の地図**: [fiction-atlas](../../../.agents/skills/fiction-atlas/SKILL.md) → [地図データ](../../story/atlas/atlas.json) と [シナリオ作業の確認・更新](../../story/atlas/README.md#シナリオ作業での確認と更新)。生成器・データ検査は同スキルの `scripts/atlas.py`、検証は `scripts/test_atlas.py`。表示用HTMLとSVGは `docs/story/atlas/view/` に出力する。
- **検証**: [台詞](../../../tests/stories.test.mjs)、[読者](../../../tests/story-reader.test.mjs)、[スチル](../../../tests/story-art.test.mjs)、[掛け合いの進行](../../../tests/banter-exchange.test.mjs)、[台本](../../../tests/export-script.test.mjs)。画面幅は [手動テスト](../development.md#ローカルの手動テスト) の `dialog-layout.browser.py`、動画は `story-video.browser.mjs`。本文変更後は `npm run script:export` / `npm run script:check`。

2-7の射撃・蜜の回収・布への受け渡しとお辞儀は `lib/story-stage-blockade-recovery.ts`。人形の歩行・膝つき・お辞儀は `lib/story-stage-figure.ts`、NPCの奥行きを含む補間は `lib/story-stage-extra-travel.ts`。素材登録は `scripts/story-stage-puppet-art.mjs`、足元・縮尺・手渡し位置・NPCの台詞内連続動作は `tests/story-stage-puppet-motion.test.mjs` を参照する。

2-7後半の控え・道標・荷車は `lib/story-stage-blockade-road.ts`、小人形の抱き上げ・蜜の収納・手当ては `lib/story-stage-blockade-care.ts`。物に載せた荷物は `StageItem.carrier`、袋の中身は `stored` で保持する。`lib/story-stage-cargo.ts` が親から先に描画位置を計算し、`lib/story-stage-props.ts` が向き・接地・重なりを受け渡す。運び手の歩行・記録・低い姿勢と運搬用小物の素材登録は `scripts/story-stage-carrier-art.mjs`、検査は `tests/story-stage-cargo.test.mjs`。

会話送り・台詞内の姿勢変更を挟む移動は `lib/story-stage-travel.ts` の `stageRoute`。表示位置と未通過の経由点を一緒に引き継ぎ、行き先または指定経路が変わった場合だけ経路を作り直す。NPCも `lib/story-stage-extra-travel.ts` から同じ処理を使う。中断前後の位置・到着時刻と全章の指定経路は `tests/story-stage-route-continuity.test.mjs`。

2-6後の作業場へ逃げる人形と布・蜜は `lib/story-stage-golem-return.ts` / `lib/story-stage-golem-items.ts`、二人の手当てと薬箱の運搬は `lib/story-stage-golem-care.ts`。`StageItem.backstep` は向きを保って足運びを逆順にする。包帯は `lib/story-stage-wrists.ts` の表示コマごとの腕位置へ追従し、腕が胴体の裏へ隠れるコマでは一緒に隠す。128pxセルの下端と120pxの足元を混同しない。布・包帯の登録は `scripts/story-stage-golem-art.mjs`、縮尺・追従・手元・実素材の透明領域は `tests/story-stage-golem-return.test.mjs`。

処置後に残す包帯は `StageActor.dressed` と `lib/story-stage-dressings.ts`。`buildLaterStage` が人物の状態から各行・連続動作へ追加するため、小物一覧の入れ替えで消えない。2-7では三人の出発まで保持する。弓用192pxセルの位置は共通128px枠へ換算し、驚きの上下動も包帯へ渡す。包み布の回収・手渡し・袋への収納、腕の実画素、運搬経路の足元は `tests/story-stage-dressings.test.mjs`。

2-7後の押し返しは共通会話アトラス44/45、腕を弾かれた小人形は人形アトラス7。会話アトラスは全員4列12行で、低い座位は36〜43に限定する。矢は `StageArrow` の先端座標と発射・到達時刻を `lib/story-stage-arrow.ts` で計算し、`app/story-stage-arrows.tsx` が描画する。台詞内の姿勢切り替えで飛行時間をリセットせず、動きを減らす設定では隠す。接触・退避・新ポーズの縮尺は `tests/story-stage-contact.test.mjs`。

2-8の戸口での挨拶・室内の薬箱設置・桶の受け渡し・往診は `lib/story-stage-households.ts`。家の人の片側をかばう歩行は `StageExtra.limp` と `lib/story-stage-figure.ts` / `lib/story-stage-extra-travel.ts`、2行アトラスと桶の登録は `scripts/story-stage-household-art.mjs`。包帯・荷物の持ち越し、手元、寝台を避ける経路、ポーズ間の頭幅と足元は `tests/story-stage-households.test.mjs`、治療スチルへの接続は `tests/story-stage-patient.test.mjs`。

2-9の帰路・薬箱・空き瓶・荷車は `lib/story-stage-homeward.ts`、帰着後の控え・茶器・着座は `lib/story-stage-homeward-office.ts`。運び手の帽子の挨拶は共通アトラス12番（4列4行）、空き瓶の袋と追加コマの登録は `scripts/story-stage-homeward-art.mjs`。既存12コマを再合成せず生の画素列で保持する。荷物の連続性、画面外補正後の停車時刻、三つのカップの順、机の手前の立ち位置は `tests/story-stage-homeward.test.mjs`。

幕間「私が用意するお昼」の布・菓子・水筒・紐と包みは `lib/story-stage-picnic.ts`。草地の背景と携帯用小物は `scripts/story-stage-picnic-art.mjs`、背景の登録は `config/rpg-backgrounds.json`。菓子の持ち主・縮尺・手渡し接点、二人分の分離、水筒の位置と包みの重なりは `tests/story-stage-picnic.test.mjs`。

幕間「約束の胡桃」は `lib/story-stage-walnut-tasting.ts` と `lib/story-stage-walnut-items.ts`。焼き色・半割り・裏面・欠片と腰掛けの登録は `scripts/story-stage-walnut-art.mjs`。`StageActor.scoot` は座位のまま寄る小移動、`LaterStage.exitRoutes` は退出時の経路指定。菓子の順・受け渡し・腰掛けの前後関係・水筒の時刻・背景の道に沿う退出は `tests/story-stage-walnut-tasting.test.mjs`。

3-1の食堂は `lib/story-stage-berne.ts`、街を見下ろす休憩所は `lib/story-stage-low-seats.ts`。背景と紙の表裏は `scripts/story-stage-berne-opening-art.mjs`、配信用背景の登録は `config/rpg-backgrounds.json`。`StageItem.turn` は同じ寸法の小物を縦軸で裏返す角度で、`app/story-stage-item-motion.ts` が途中状態を引き継ぐ。茶器・荷物の縮尺、静止画への切替、接近後の紙の回転と低負荷設定は `tests/story-stage-berne-opening.test.mjs`。

3-2の街路・退出経路は `lib/story-stage-berne-paving.ts`、往診・昼食の時系列は `lib/story-stage-berne-visit.ts`、同一の薬箱・紙・三人分の食事・四つのカップの位置は `lib/story-stage-berne-visit-items.ts`。素材生成は `scripts/story-stage-berne-visit-art.mjs`、接点・数量・退出の検査は `tests/story-stage-berne-visit.test.mjs`。`StageActor.nameAbove` は足元の道具を避ける名前位置で、`app/story-stage-motion.ts` が姿勢に合わせる。

3-3の図面と控え・石組みの調査は `lib/story-stage-keystone.ts`、紙と荷物の状態は `lib/story-stage-keystone-items.ts`。背景2種は `scripts/story-stage-keystone-art.mjs` と `config/rpg-backgrounds.json`、紙を取る・戻す接点、移動完了後の動作、縮尺、荷物回収と空所を避ける退出は `tests/story-stage-keystone.test.mjs`。

3-4の勝手口・ノックと料理人の接近は `lib/story-stage-manor-door.ts`、展示台の石・覆い・鍵・光の測定は `lib/story-stage-manor-display.ts` と `lib/story-stage-manor-display-items.ts`。素材の切り出しと料理人・商人の共通縮尺への登録は `scripts/story-stage-manor-art.mjs`。フィンのノックは共通会話アトラス44・45番。到着後の接触、石の表裏と覆いの順、布の深度、腰の鍵の連続性、既存画素と頭幅・接地の維持は `tests/story-stage-manor.test.mjs`。

3-6前半の門番への反応・鍋の受け渡し・料理人の退出は `lib/story-stage-survey-door.ts`。鍋本体と蓋、道具袋、磨き布、料理人12〜15番、門の背景は `scripts/story-stage-survey-art.mjs`。`StageItem.behindOwner` は背負う袋の前後関係を指定する。到着時刻・手元の接点・蓋の順序・退出中の持ち物追従・頭幅と接地は `tests/story-stage-survey-door.test.mjs`。

3-6後半の下見・庭師への接近は `lib/story-stage-survey-garden.ts`、鉢・手袋・鍵・道具袋の持ち主と位置は `lib/story-stage-survey-garden-items.ts`。`StageActor.gloves` はフィンの共通アトラス46・47番（手袋を着けた手元／脱ぐ途中）を選ぶ。`StageExtra.limp` は庭師の足をかばう歩行と立位も表す。素材は `scripts/story-stage-survey-art.mjs` と `scripts/story-stage-review-art.mjs`。鍵の一回転、元の鍵との縮尺、手袋と鍵の返却、鉢の設置、アリア・ミラ・フィンの経路、既存46コマの維持は `tests/story-stage-survey-garden.test.mjs`。


3-7の井戸・厨房・道の間違い・荷車の退出は `lib/story-stage-reception-well.ts`、袋・縄・留め具は `lib/story-stage-reception-well-items.ts`。展示台裏の目印・布の受け渡しは `lib/story-stage-reception-display.ts`、共通荷車と展示物は `lib/story-stage-reception-items.ts`。料理人の手は `lib/story-stage-extra-wrists.ts` → `app/story-stage-extra-motion.ts` から位置情報へ渡し、`StageItem.wristAnchor: "top"` は袋の取っ手を手へ合わせる。NPC所有の手元小物も `stageItemVisible` で判定する。荷車の連続性・受け渡しの到着時刻・退出の距離・袋の歩行追従・展示物の縮尺は `tests/story-stage-reception.test.mjs`。

3-9後半の食堂導入は `lib/story-stage-restoration-dining.ts`。`StageActor.tea` は三人の共通アトラス48〜51番でカップを持つ／飲む座位を選ぶ。生成・旧48コマの保持は `scripts/story-stage-dining-tea-art.mjs`、共通アトラスの描画は `app/story-stage-motion.ts` と `app/story-stage.css`。控え返却の接点、渡してから下がる順序、座席とカップの重複防止、頭幅・接地・旧RGBAは `tests/story-stage-dining-return.test.mjs`。

4-1の昼食・依頼の紙・皿の片付け・往診鞄から封書を出す動作は `lib/story-stage-linde-requests.ts`。店主の接客姿勢12〜15番と皿・封書の登録は `scripts/story-stage-linde-art.mjs`。`StageItem.wristAnchor: "bottom"` は皿の底を手のひらへ合わせ、椅子姿勢の手元は `lib/story-stage-wrists.ts` で左右の表示へ対応する。旧店主12コマのRGBA・頭幅・足元、皿の接点と持ち上げの順、封書と三通の紙の保持は `tests/story-stage-linde-requests.test.mjs`。

4-2の灯籠の戸・油皿・掃除の引継ぎ・草刈り・注油・点灯は `lib/story-stage-lantern-work.ts` と `lib/story-stage-lantern-items.ts`、手帳記入と控えの受け渡しは `lib/story-stage-lantern-address.ts`。アリアの共通アトラス52〜55番（拭く／草を刈る）、荷運び人13・14番（拭く）、灯籠の各状態と草の登録は `scripts/story-stage-lantern-service-art.mjs`。共通人物アトラスは16行（4-3の飲食・往診姿勢を含む）。拭く手・歩行中の道具・油皿の位置は `lib/story-stage-wrists.ts` と `lib/story-stage-extra-wrists.ts`。旧52コマの維持、頭幅・接地、点灯までの順序、移動中の小物の可視性・注油の接点は `tests/story-stage-lantern-service.test.mjs`。灯籠の同一縮尺と手帳・控えの区別は `tests/story-stage-field-props.test.mjs` と `tests/story-stage-lantern-address.test.mjs`。

4-3前半の食堂は `lib/story-stage-brekka-dining.ts`、給仕の時系列は `lib/story-stage-brekka-dining-service.ts`、小杯・果実水・パン・隣の卓は `lib/story-stage-brekka-dining-items.ts`。四人の共通56〜58番と荷運び人16〜18番が、持つ／飲む／手を伸ばす座位を選ぶ。登録は `scripts/story-stage-brekka-dining-art.mjs`、原本と全文プロンプトは `docs/art-generation/story-stage-brekka-dining-20261023.json`。旧56コマと荷運び人16コマのRGBA、頭幅・接地・給仕の到着と杯の接点は `tests/story-stage-brekka-dining.test.mjs`。角度だけの変更では手から小物を離さず、持ち主・置き場所が変わるときだけ移動を補間する（`app/story-stage-item-motion.ts`、`tests/story-stage-drink-grip.test.mjs`）。

4-3後半の往診・退室・隣家へのノックは `lib/story-stage-brekka-visit.ts`。ミラの共通60〜63番は小瓶へ触れる／茶杯へ手を伸ばす／二拍のノック、医者4〜7番は記録・説明の姿勢。登録は `scripts/story-stage-brekka-visit-art.mjs`、原本・全文プロンプト・ハッシュは `docs/art-generation/story-stage-brekka-visit-20261023.json`。医者のアトラスは2行。旧60姿勢と医者の旧4姿勢の保持、頭幅・足元、茶杯を置く順、薬箱を下ろしてからノックする順は `tests/story-stage-brekka-visit.test.mjs`。

4-4の夜明け前のミラと荷車の追跡は `lib/story-stage-moss-trail.ts`。手元を含む疲れた姿勢・御者の歩行と車輪は `scripts/story-stage-moss-trail-art.mjs`、既存姿勢の保存・縮尺・追従・一枚絵への切替は `tests/story-stage-moss-trail.test.mjs` を参照する。

4-5の道順の記録、分かれ道、塔の石段は `lib/story-stage-moss-second-day.ts`。手帳の読む／書く姿勢は `StageActor.routeNotes` と `lib/story-stage-pose.ts`、背景の登録は `scripts/story-stage-moss-trail-art.mjs` の `secondDayBackgrounds`。荷車は4-4と共通の `mossCartDriver` / `mossCartItems` を使い、手帳を閉じる時点、縮尺、御者と取っ手の接点、階段と帰路の維持は `tests/story-stage-moss-second-day.test.mjs` で検査する。

4-6の苔床は [場面](../../../lib/story-stage-moss-beds.ts) → [介助と受け渡し](../../../lib/story-stage-moss-bed-rest.ts) → [小物と腰掛け](../../../lib/story-stage-moss-bed-items.ts)。[観察・介助姿勢](../../../lib/story-stage-study-pose.ts) と [素材生成](../../../scripts/story-stage-moss-beds-art.mjs) は共通アトラスを使う。画像に描いた小物の重複抑止・姿勢寸法・退出は [検査](../../../tests/story-stage-moss-beds.test.mjs) を参照。身体動作を終えてから台詞を送る場面は `finishBeforeAdvance` を指定し、[送り待ち](../../../app/use-story-motion-advance.ts) と [読者検査](../../../tests/story-reader.test.mjs) で連打・重複完了を扱う。

4-7の記録照合は [管理小屋](../../../lib/story-stage-records-registry.ts) → [苔床の装置](../../../lib/story-stage-records-field.ts) → [板・帳簿・苗の受け渡し](../../../lib/story-stage-records-return.ts)。[共通の小物](../../../lib/story-stage-records-field-items.ts) は4-6の柵と腰掛けを引き継ぐ。`StageActor.recordStudy` はリコ76〜79番、`StageExtra.deskWork` は管理人・商人16〜19番を選ぶ。[登録処理](../../../scripts/story-stage-records-art.mjs) は人物20行、管理人・商人5行を生成する。旧RGBA・頭幅・座高・接地・原本返却の接点・二冊の保持は [検査](../../../tests/story-stage-lico-records.test.mjs)。小物の `embeddedFrames` は人物とNPCの双方で画像内の同じ物を二重表示しない。

4-8の苗・布と一枚絵への切替は [積み出し口](../../../lib/story-stage-seedlings.ts)、苔・紙の受け渡しは [交換](../../../lib/story-stage-seedling-exchange.ts)、四体のコロタケ回収は [回収](../../../lib/story-stage-seedling-collection.ts)。`StageExtra.seedlingAction` はメリル4〜11番、`StageActor.paperAction` はリコ80〜83番を選ぶ。[メリルの登録](../../../scripts/story-stage-seedlings-art.mjs) は3行、[紙の姿勢](../../../scripts/story-stage-paper-art.mjs) は既存20行の後へ1行を加える。旧画素を再合成せずRGBAへ新行だけ連結する。縮尺・旧画素は [素材検査](../../../tests/story-stage-seedling-art.test.mjs)、手元・回収順・最後のタップ後の退出は [動作検査](../../../tests/story-stage-seedling-exchange.test.mjs)。`LaterStage.exitExtras` は台詞中のNPCを残し、最後のタップ後だけ退出先を適用する。

4-10出発の比較用小瓶は [受け渡し](../../../lib/story-stage-founding-gift.ts)。接近後の手渡し、布包み、アリアの鞄への収納と街道での収納維持を [検査](../../../tests/story-stage-founding-gift.test.mjs) で確認する。
4-10帰還の苔の器は [器の受け渡し](../../../lib/story-stage-founding-sample.ts)。机脇を空ける移動、机上と手元の一致、記録後の収納を [検査](../../../tests/story-stage-founding-sample.test.mjs) で確認する。
- 4-10出発の鞄と帰りの積み荷は `lib/story-stage-founding-bag.ts`。同じ鞄の足元・手元・背中への移動と、荷車に載せた籠・封書を管理する。手元の接点・移動順序・持ち物の継続は `tests/story-stage-founding-gift.test.mjs`。
## 鍬の持ち替え

4-9出発の鍬は `lib/story-stage-transplant-items.ts` の背負い・手持ち・地面の位置を `lib/story-stage-transplant.ts` の順序で切り替える。`StageItem.wristOffset` は長い道具の握り位置を手首へ合わせるための地面座標の補正。素材は `scripts/story-stage-transplant-art.mjs`、順序と寸法の検査は `tests/story-stage-transplant.test.mjs`。

同じ小道具モジュールの `transplantRope` は縄束を荷台→レオンの手→地面へ運ぶ。接点を変える場合は、荷車の縁の位置とレオンの立ち位置を一緒に更新し、足が荷台に乗って見えないことも実画面で確認する。

余分な板と車輪用の板は `lib/story-stage-transplant-boards.ts` で三枚を保持する。`StageItem.pitch` は板の下端を動かさず地面へ寝かせる角度で、`app/story-stage-item-motion.ts` が中断時の角度も引き継ぐ。板を下ろす場所は荷車の退出経路から離し、持ち手の接点と運搬時間を `tests/story-stage-transplant.test.mjs`、平置きの補間を `tests/story-stage-berne-opening.test.mjs` で確認する。

荷下ろし中の護衛は `lib/story-stage-transplant-guard.ts`。`sword: "strike"` は冒険用の剣の4コマを一回だけ使い、`sword: true` の構えへ戻す。魔物の移動と仲間の作業は同じシーケンスへ統合し、作業の品物を消さない。

4-9帰還の塔での籠の受領は `lib/story-stage-return-basket.ts`。作業者の手からレオンの掌への接点・接近と離脱の順序・籠の寸法を `tests/story-stage-return-basket.test.mjs` で検査する。苔床での指拭き・葉を広げる動作、フィンの空籠の持ち上げは `lib/story-stage-seedlings.ts` と `tests/story-stage-moss-care.test.mjs`。

4-10冒頭の管理人の筆記と机上の帳簿は `lib/story-stage-founding-records.ts`。全出発行での支持・同じ帳簿の継続・街道での非表示を `tests/story-stage-founding-records.test.mjs` で検査する。窓の紫を含む専用背景 `tower-records` は `config/rpg-backgrounds.json` と素材生成へ登録し、他の塔の場面へ流用しない。
# 手描き舞台の代表例

`lib/storybook/indoor-cue.ts` は屋内見本だけの姿勢・家具補正。試料収納の順序は `sample-storage.ts`、検証は `tests/storybook-indoor-props.test.mjs`。試作の確認記録と未完了事項は [舞台見本](../../art/storybook-stage-study.md)。


手描き舞台の本編接続は `app/storybook/stage.tsx` と `lib/storybook/presentation.ts`。会話の読み進めは既存 `StoryReader` を使い、動作補正は `lib/storybook/carry-cue.ts` から適用する。一枚絵の判定を先に行い、舞台へ置換しない。共通CSSは `app/storybook/`、セーブを変更しない本編表示確認は `/sprite-lab/storybook/reader`（テスト機能ONのみ）。

第三章の食堂の椅子・机の奥の座り位置は `lib/storybook/dining-cue.ts`、ベルネ街路の保持物・筆記・退場時の手元は `lib/storybook/berne-street-cue.ts`。背景と荷物・石の淡い光は `app/storybook/berne.css`、椅子の維持・既存スチルの優先・退場時の持ち荷の検査は `tests/storybook-berne.test.mjs`。

往診先の地面への着席・薬箱・手帳・パン・トレーは `lib/storybook/porch-cue.ts`。四人の地面の座り姿は `scripts/build-storybook-ground-rest.mjs`、フィンのトレー運搬は `scripts/build-storybook-finn-tray.mjs` で梱包する。表示は `app/storybook/ground-rest.css` / `porch-tray.css`、同じ縮尺・接地線・持ち物の維持・左右の手の検査は `tests/storybook-porch.test.mjs`。

3-3の草のある石組みと露出した空所、図面と控え、持ち荷は `lib/storybook/foundation-cue.ts` / `app/storybook/foundation.css`。石工の歩行・屈む姿勢は `scripts/build-storybook-mason.mjs`、縮尺・接地・地面から手元への荷物寸法と図面の支持は `tests/storybook-foundation.test.mjs`。同じ塔の3-9は接点が異なるため、この背景対応を自動的には適用しない。

3-4出発前の勝手口・料理人との肩の接触は `lib/storybook/manor-door-cue.ts` / `app/storybook/manor-door.css`。扉の開閉背景は `lib/storybook/presentation.ts`、専用のノック・料理人の歩行と両腕の姿勢は `scripts/build-storybook-manor-actors.mjs` で梱包。縮尺・接地・動作待ち・接触と解放・開扉の検査は `tests/storybook-manor-door.test.mjs`。


3-4帰還後の庭の展示・石の保持・白布の灯り比較と控えは `lib/storybook/manor-display-cue.ts` / `app/storybook/manor-display.css`。庭師の共通縮尺と接地線は `scripts/build-storybook-gardener.mjs`、ケースの共通縮尺と底面は `scripts/build-storybook-manor-props.mjs` で梱包し、`tests/storybook-manor-display.test.mjs` で動作待ち・手首・寸法・退場位置・筆記後の保持を検査する。

3-5前半の手描き背景・手当て・椅子運搬・持ち荷寸法は `lib/storybook/stone-yard-cue.ts` / `app/storybook/stone-yard.css`。素材は `scripts/build-storybook-stone-yard-actors.mjs` で立ち姿基準の共通縮尺・足元へ梱包し、`tests/storybook-stone-yard.test.mjs` で縮尺・手首の左右・寸法維持・到着してからの掴みと解放を検査する。持ち物に合う表示の識別属性は `app/story-stage-motion.ts` の data-held-art、NPCの歩行と停止の切替は `app/story-stage-extra-motion.ts` の data-moving。左向きの運び手の手首は `lib/story-stage-extra-wrists.ts` を参照。

3-5帰還後の暗所比較・控え・お茶は `lib/storybook/stone-rest-cue.ts`。手首と人物の位置は `stone-rest-actors.ts`、荷物寸法と支持面は `stone-rest-items.ts`、四脚の掴み・解放・着席と時刻の繰り延べは `stone-rest-transitions.ts`。表示は `app/storybook/stone-rest.css` / `stone-rest-seats.css`。素材は `scripts/build-storybook-stone-rest-actors.mjs` / `build-storybook-stone-rest-props.mjs` / `build-storybook-aria-seat.mjs`、縮尺・基準の光との距離・手元の受け渡し・四脚と支持面の検査は `tests/storybook-stone-rest.test.mjs`。屋外と屋内の切替は `lib/storybook/presentation.ts`、場面に限定した姿勢の表示は `StorybookStage` の data-story を使う。

3-6出発前の鍋・蓋・布・背負い袋と扉の接点は `lib/storybook/survey-door-cue.ts` / `app/storybook/survey-door.css`。背景の切替は `lib/storybook/presentation.ts`、料理人8姿勢と4小物の梱包は `scripts/build-storybook-survey-cook.mjs` / `build-storybook-survey-props.mjs`、共通縮尺・小物寸法・蓋と顔の間隔・手元追従・扉への経路は `tests/storybook-survey-door.test.mjs` で確認する。

3-6帰還後の裏庭と手袋・鍵の返却は `lib/storybook/survey-garden-cue.ts`、人物・手首・庭道・診察の位置は `survey-garden-actors.ts`、鉢と手袋・鍵は `survey-garden-items.ts`。表示は `app/storybook/survey-garden.css`、素材の梱包は `scripts/build-storybook-survey-garden-actors.mjs` / `build-storybook-survey-garden-props.mjs`。`tests/storybook-survey-garden.test.mjs` で人物縮尺・接地・受け渡しと到着時刻・庭道・診察・空の手を確認する。

3-7出発前の井戸・手押し車・予備袋は `lib/storybook/reception-well-cue.ts`、人物の接点と扉の位置は `reception-well-actors.ts`、車の追従と荷物は `reception-well-items.ts`。`app/storybook/reception-well.css` が表示を担当し、出発後も `storybookExitCue` で同じ調整を適用する。梱包は `scripts/build-storybook-finn-push.mjs` / `build-storybook-well-props.mjs`、共通縮尺・静止から押し動作への接続・出発経路・到着してからの拾得と受け渡しは `tests/storybook-reception-well.test.mjs` を参照。

3-7帰還後の目印と布の支度は `lib/storybook/reception-display-cue.ts`、人物・手首と名前は `reception-display-actors.ts`、布の支持面・道標・鉢の前後関係は `reception-display-items.ts`。表示は `app/storybook/reception-display.css`。素材梱包は `scripts/build-storybook-finn-cloth.mjs` / `build-storybook-servant-display.mjs` / `build-storybook-reception-cloths.mjs`、人物縮尺・手元・天板・展開順・位置維持と層は `tests/storybook-reception-display.test.mjs` を参照。

3-8の手当て前と夜の橋は `lib/storybook/night-hand-cue.ts`、人物と手首は `night-hand-actors.ts`、覆い・布・鉢は `night-hand-items.ts`。表示は `app/storybook/night-hand.css`、姿勢の梱包は `scripts/build-storybook-finn-injury.mjs` / `build-storybook-mira-check.mjs` / `build-storybook-finn-pat.mjs`、4小物は `build-storybook-night-hand-props.mjs`。`tests/storybook-night-hand.test.mjs` で共通縮尺・透明余白を含めた覆いの手元・布の受け渡し・会話待ち・包帯と包みの向き・既存一枚絵の表示境界・鉢の見切れを確認する。

3-9の石組みの作業と食堂への接続は `lib/storybook/restoration-cue.ts`、管理人・誘導と迂回路は `restoration-actors.ts`、紙の台と柵・荷車の接点は `restoration-items.ts`。表示は `app/storybook/restoration.css`。梱包は `scripts/build-storybook-restoration-actors.mjs` / `build-storybook-restoration-props.mjs` / `build-storybook-restoration-documents.mjs` / `build-storybook-seated-tea.mjs`。`tests/storybook-restoration.test.mjs` で縮尺・着席の高さ・書類の接点・迂回路と荷車寸法・既存一枚絵の表示境界を確認する。朝の石組みの窓は `berne-foundation-open-v2.png`、夕景は `berne-foundation-restored-v1.png` を使用する。

4-1の昼と夕方の食堂は `lib/storybook/linde-cue.ts`、着席位置と店主の手元は `linde-actors.ts`、机上と椅子・手持ちの紙は `linde-items.ts`、ミラが立ち上がって往診鞄を開く順序は `linde-transitions.ts`。表示は `app/storybook/linde.css`。素材梱包は `scripts/build-storybook-linde-lunch.mjs` / `build-storybook-linde-travel.mjs` / `build-storybook-linde-table.mjs`。`tests/storybook-linde.test.mjs` で皿の寸法・席の固定・机を避ける経路・鞄への到着と封書の取得順・往路を再実行しないことを確認する。

4-2の地図・灯籠掃除・給油・宛名は `lib/storybook/lantern-cue.ts`、描画は `app/storybook/lantern.css`。素材梱包は `scripts/build-storybook-lantern.mjs`、灯籠5状態の寸法、共通の身体縮尺、掃除姿勢の優先、拾得前の到着時間と油皿への接点、昼夕と手帳・控えの区別は `tests/storybook-lantern.test.mjs`。NPCの注油と手帳の提示は `StageExtra.oilPour` / `showNotebook` と `story-stage-figure.ts` のコマ選択で扱う。

4-3出発前の食堂は `lib/storybook/brekka-dining-cue.ts`、飲食の手首・席・給仕位置は `brekka-dining-actors.ts`、椅子と天板・杯の保持点は `brekka-dining-items.ts`。表示は `app/storybook/brekka-dining.css`、梱包は `scripts/build-storybook-brekka-dining.mjs`。`tests/storybook-brekka-dining.test.mjs` は採用した着席姿勢の共通縮尺、小さな杯の満空寸法、乾杯時の距離、給仕の到着時刻・注ぎ口と縁の接点、起立後に机の両端を回る経路を確認する。帰還後の往診場面は別の担当となり、この食堂の変換を適用しない。

4-3帰還後の往診と隣の戸への移動は `lib/storybook/brekka-visit-cue.ts`、描画は `app/storybook/brekka-visit.css`。室内・中庭、医者と患者、ノックと鞄を下ろす姿勢、小瓶と湯飲みの梱包は `scripts/build-storybook-brekka-visit.mjs`。`tests/storybook-brekka-visit.test.mjs` は共通縮尺、座高、机を回る経路と到着時間、湯飲みの保持点と患者の手元への配置、鞄の接地とノックの順序を確認する。瓶への接触は `StageActor.visit="bottle"` のframe68で既存の夜作業64〜67・ノック62〜63と分けている。

4-4の徹夜明けと最初の追跡は `lib/storybook/moss-trail-cue.ts`、描画は `app/storybook/moss-trail.css`、梱包は `scripts/build-storybook-moss-trail.mjs`。鞄とメモ、御者の手と引き棒、独立して回る車輪と落ちる苔を扱う。`tests/storybook-moss-trail.test.mjs` は身体の共通縮尺と余白、4歩行コマの接点、車輪と車軸、荷車が完全に画面を出ること、両シーンの既存一枚絵を5表示目から維持することを確認する。4-5の追跡は別の変換として扱う。

4-5の手帳・石段・坂道・フィンの帰路は `lib/storybook/moss-second-day-cue.ts`、手帳と指示姿勢の描画は `app/storybook/moss-second-day.css`。荷車の接点は4-4の `cartDriver` / `cartItem` を再利用し、下の道だけ御者と荷車を同時に下げる。読む・書くの表示は `story-stage-motion.ts` の `data-route-notes`、手帳素材の梱包は `node scripts/build-storybook-work.mjs leon route-notes v1`。`tests/storybook-moss-second-day.test.mjs` で共通縮尺・段の内側の経路と下り・荷車の足場・上段の頭の余白を確認する。塔の裏の上の道は、荷車が石壁を横切らず右へ抜ける `brekka-tower-path-v2.png` を採用した。

4-6の苔床・手帳・休憩は `lib/storybook/moss-beds-cue.ts`、描画は `app/storybook/moss-beds.css`、梱包は `scripts/build-storybook-moss-beds.mjs`。`StageActor.holdingWalk` は持ち物のある移動だけを4歩行コマに切り替え、止まった後の調査・支える姿勢を維持する。`tests/storybook-moss-beds.test.mjs` で縮尺・低い姿勢・手帳と踏み台の表示・受け渡しの到着時間と接点を確認する。手帳歩行v2は暫定採用で、v3/v4は不採用。踏み替えの明瞭さは全章最終確認の残件にしている。

4-7の管理小屋（lico-records-departureの0〜31）は `lib/storybook/registry-cue.ts`、描画は `app/storybook/registry.css`、梱包は `scripts/build-storybook-registry.mjs`。管理人と商人は共通の立ち姿の縮尺から着席・机仕事のコマを梱包し、椅子と文書は独立して置く。`tests/storybook-registry.test.mjs` で座高・足元、机の端への到着と接点、原本の保持と受け渡し、写しの分離、屋外への切替境界を確認する。共通の `story-stage-props.ts` は、机より前へ出た人物の持ち物も同じ描画順へ上げる。4-7の苔床と帰還後は下記のrecords-field変換を参照する。

リコの後ろ髪を一束のポニーテールへ揃える素材はassets/source/storybook/lico-*-ponytail-v1.png、梱包はscripts/build-storybook-lico-ponytail.mjs。通常会話・歩行・作業はapp/storybook/lico-actors.cssとconversation-actors.css、苔床作業・手帳歩行はmoss-beds.css。身体基準の共通縮尺と足裏位置を維持し、髪幅で身体を再拡大しない。4-7のfield-records用もrecords-field.cssで接続する。

4-7後半の苔床はlib/storybook/records-field-cue.ts。人物の手首・立ち位置、記録・膝板・籠・覆いの保持はrecords-field-items.ts、持ち替える順序はrecords-field-sequence.ts。表示はapp/storybook/records-field.css、装置3状態と布・板・二冊・浅皿・苗・籠の梱包はscripts/build-storybook-records-field.mjs。リコの低い着席／記録／覆いはlico-field-records-ponytail-v1を使用。StageActor.recordHandOutは手帳を抱えたまま反対の掌を出す姿勢。tests/storybook-records-field.test.mjsは共通縮尺と低い座高、装置の共通縮尺、記録・膝板の手元の一致、二冊を開いたまま支えること、到着前に覆いを外さないこと、布の裾と足裏、苗を載せる接点を検査する。

4-8の積み出し口とメリルの姿勢・苗の手渡し・コロタケの拾得位置はlib/storybook/seedlings-cue.ts、描画はapp/storybook/seedlings.css、素材梱包はscripts/build-storybook-seedlings.mjs。低いしゃがみと共通縮尺、受け取る掌の一致、拾得位置、鍋の寸法、退出中の4歩行コマはtests/storybook-seedlings.test.mjs。StageExtra.walkFramesは代替シートの歩行コマを明示し、従来NPCのコマ選択を維持する。帰還後のリコの紙の操作はseedlings-actors.tsとseedlings-items.ts、素材はseedling-actions.css。紙をちぎって渡す・メリルがしまう順序はstory-stage-seedling-exchange.ts。出発側は15表示目から末尾まで既存の一枚絵を維持するため、苗を守る・耳を覆う姿勢は準備素材のみで接続しない。歩行の足運びと全章の通し確認は引き続き調整対象。

実際の会話レイアウトで任意の表示から動きを再確認する場合は/sprite-lab/storybook/readerの「再生開始の会話」を使う。StoryReader.reviewStartPageは確認用の初期位置だけを指定し、通常のゲームは0から再生する。セーブの既読・クエスト進行は変更しない。通し再生の確認は別に行う。

4-9帰還の三か所はlib/storybook/transplant-return-cue.tsからtransplant-tower.ts・transplant-visit.tsへ接続する。新しい苔床は塔から離れた既存地点で、背景new-moss-beds-v1とbrekka-tower-drain-v1を使い分ける。リコの指拭きと低い葉広げ・作業者の回収と受け渡し・医者が同じ側で鞄を拾い上げる素材はscripts/build-storybook-transplant-return.mjs。頭身・布と籠の接点・往診時の湯飲みはtests/storybook-transplant-return.test.mjs。作業者の歩行は左右の脚の交代を引き続き調整する。

StoryReaderのuseStageCuesは会話番号と一枚絵の有無が変わるまで同じcueを保持する。動作完了や早送り・履歴開閉で再描画されても、受け渡しや移動を冒頭から再生し直さない。tests/story-reader.test.mjsのcue同一性検査と実際の運搬完了後の表示で確認する。

4-9出発前の積み出し口（moss-transplant-departure、0〜15番）はlib/storybook/transplant-loading-cue.ts。transplantStudyCueで帰還側と夜道を区別する。4-8と同じyard背景・cell19に揃え、鍬の手持ち／背負い／接地と屈む位置、フィンの退避、ミラの最後の返事を表示する位置を補正する。鍬はscripts/build-storybook-transplant-loading.mjsで柄の中心を登録し、app/storybook/transplant-loading.cssで表示。tests/storybook-transplant-loading.test.mjsは道具の縮尺・手と平置きの柄の接点・置いた道具を避ける立ち位置・返事中のミラの可視性を検査する。

4-9夜道（16〜37番と退出）はlib/storybook/transplant-night-cue.ts、背景transplant-night-path-v1。積み出し口と同じcell19で、籠の受け渡し・低い手と置き場・車輪の敷板・荷車の柄の高さを登録する。scripts/build-storybook-transplant-night.mjsがフィンの引き歩行、細い板、敵、透明余白を詰めた荷車と専用CSSを出力する。data-movingは到着後に引き歩行のループを止めるために使う。tests/storybook-transplant-night.test.mjsで縮尺・物の保持・接点・退出を検査。歩行の自然さと全動作の最終監査は別途必要。

4-10出発側（starlit-guild-founding-departure）はlib/storybook/founding-departure-cue.tsとfounding-departure-items.ts。塔の足元から帰路の石へ、cell19とcameraScale0.72を明示して身体を縮めない。袋の口を閉じる・拾う・瓶を渡す接点を登録し、同じ瓶を包んで収納する。scripts/build-storybook-founding-departure.mjsが包み瓶とapp/storybook/founding-departure.cssを出力する。StageActor.insideCameraは、引いたカメラの画面端に意図して立つ人物の座標を退出へ変換しない指定。lib/story-stage-camera.tsとtests/storybook-founding-departure.test.mjsで、旧来の退出処理と区別して検査する。

4-10帰還側（starlit-guild-founding-return）の表示1〜67はlib/storybook/founding-return-cue.ts。既存のindoor-cue.tsの着席交代を再利用し、標本の器とリコの手／ラベル位置を登録する。紙の五人の受け渡しと机への返却はfounding-paper-circuit.ts・founding-paper-contacts.ts。レオンは手前の通路を回って左角へ置き、中央へ滑らせる。StageActor.reachApproachは指定した最後の接近距離だけ支持物より手前へ描画する。通常のreachOverは到着時のみという従来動作を保つ。tests/storybook-founding-return.test.mjsが接点・経路・時間・縮尺・一枚絵への境界を検査する。表示68以降の茶器や窓は既存の一枚絵を維持する範囲で、新規アニメーションは追加しない。

幕間「約束の胡桃」はlib/storybook/walnut-cue.ts。tastingItemsの焼き色・分割・受け渡しを読み、同じ身体縮尺の座位・低い手・口元へ接続する。片方を渡す接点、布の欠片と水筒の拾得、一口後に残りを眺める期間、籠へ畳んだ布と水筒を収めて二本の道へ分かれる退出はtests/storybook-walnuts.test.mjsで検査。snackActionで指定した専用の未反転アトラスは、旧perchの左右別コマ扱いをせず人物の向きを反映する。
