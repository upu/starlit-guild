# 台詞・読者・思い出

3-9後半の塔の回復は `lib/story-stage-berne.ts` と `app/story-stage-restored.css`。石を戻した背景は `scripts/story-stage-keystone-art.mjs` と `config/rpg-backgrounds.json` に登録する。窓・石組みの発光は人物用の縮尺変換の外で背景へ固定し、窓から順に一度だけ点灯する。縮尺・包帯・一枚絵の維持は `tests/story-stage-restored-tower.test.mjs`。

第二章のプティ戦は [戦況別の掛け合い](../../../lib/pumpety-battle-banter.ts) を `chapterTwoBanter` から呼ぶ。[プティ戦の検査](../../../tests/pumpety-presentation.test.mjs) で通常進行中の会話・追撃動作・覆面の表情・会話の保持を確認する。

[作業別のコード案内](../code-map.md) に戻る。

舞台付き会話の最新台詞・履歴切り替えと、最後のタップ後の出発は `app/story-scenes.tsx` の `useReaderState` / `useStageExit`、動作完了は `app/story-stage-motion.ts` を参照する。操作の仕様は [会話と出発](../../art/story-stage.md#会話と出発の操作)。

1-3の取引先の人・手前の台・残りの荷は `app/story-stage-props.tsx`。小箱の置き場所と補間は `lib/story-stage-props.ts`、台詞を送ったときの位置保持と共同運搬への追従は `app/story-stage-box-motion.ts`。取引先の台詞別ポーズは `lib/story-stage-town.ts` に置く。

会話中の着座・運搬・専用動作の選択は `lib/story-stage-pose.ts`、手前を回る移動は `lib/story-stage-travel.ts`、NPCの歩行と持ち物の追従は `app/story-stage-extra-motion.ts`。台詞内の複数動作は `StageMoment` と `buildLaterStage` で組み立て、4-9の籠運びは `lib/story-stage-transplant.ts` に定義する。専用ポーズの登録は `scripts/story-stage-review-art.mjs`、縮尺・迂回・時系列の検査は `tests/story-stage-review.test.mjs`、手元高さ・支持物の重なり・受け渡しは `tests/story-stage-attachments.test.mjs` を参照する。

椅子・食卓・奥の席の退席通路は `lib/story-stage-furniture.ts`。2-3の寝台の姿勢と場面転換は `lib/story-stage-medicine.ts`、場面転換で位置を引き継がない処理は `buildLaterStage` の `stageStart` と `useStoryStageMotion`。`tests/story-stage-furniture.test.mjs` で共通アトラスの椅子座位、椅子の残存、寝台、最後の動作から出発への持ち物の引き継ぎを検査する。

低い岩・縁・踏み台は `lib/story-stage-low-seats.ts` の `lowSeat` と `StageActor.perch` を使い、支持物を人物と別に描く。アリア・レオン・ミラ・フィンは共通アトラス36〜43番、リコの同じ番号は踏み台を含む専用姿勢。4-6の支え歩き・手帳と鞄の受け取りは `lib/story-stage-lico.ts`、頭幅・接地・手元と到着時刻の検査は `tests/story-stage-low-seats.test.mjs`。

3-5前半の運び手・手当て・椅子の移動は `lib/story-stage-stone-yard.ts`、候補の石と手元の配置は `lib/story-stage-stone-yard-items.ts`、接点・到着時刻・共通アトラスの回帰検査は `tests/story-stage-stone-yard.test.mjs`。物置での比較・控えの受け渡しは `lib/story-stage-stone-rest.ts`、同じ小物と席の状態は `lib/story-stage-stone-rest-items.ts`、カップ・やかん・四脚の移動は `lib/story-stage-stone-tea.ts`、接点・到着時刻・障害物を避ける経路は `tests/story-stage-stone-rest.test.mjs`、4-10の同じ椅子を譲る動作は `lib/story-stage-founding.ts`、五人で回す登録用紙は `lib/story-stage-registration-paper.ts`。検査は `tests/story-stage-office-seats.test.mjs`。アリアの筆記2コマは共通アトラスの17・18番を使い、`scripts/story-stage-review-art.mjs` で歩行と頭幅・身長・足元を揃える。4-7の踏み台・反射装置・煙・記録板は `lib/story-stage-lico-records.ts`、素材の登録は `scripts/story-stage-lico-art.mjs`、接地・縮尺・受け渡しは `tests/story-stage-lico.test.mjs` を参照する。

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

3-9後半の食堂導入は `lib/story-stage-restoration-dining.ts`。`StageActor.tea` は三人の共通アトラス48〜51番でカップを持つ／飲む座位を選ぶ。生成・旧48コマの保持は `scripts/story-stage-dining-tea-art.mjs`、共通13行の描画は `app/story-stage-motion.ts` と `app/story-stage.css`。控え返却の接点、渡してから下がる順序、座席とカップの重複防止、頭幅・接地・旧RGBAは `tests/story-stage-dining-return.test.mjs`。

4-1の昼食・依頼の紙・皿の片付け・往診鞄から封書を出す動作は `lib/story-stage-linde-requests.ts`。店主の接客姿勢12〜15番と皿・封書の登録は `scripts/story-stage-linde-art.mjs`。`StageItem.wristAnchor: "bottom"` は皿の底を手のひらへ合わせ、椅子姿勢の手元は `lib/story-stage-wrists.ts` で左右の表示へ対応する。旧店主12コマのRGBA・頭幅・足元、皿の接点と持ち上げの順、封書と三通の紙の保持は `tests/story-stage-linde-requests.test.mjs`。
