# 冒険画面の描画・タップ

2-5の人形と道標、帰りの菓子包みと逃走は `lib/storybook/signpost-cue.ts`。掌へ付けた菓子は人形に追従し、動作の終了後に次の台詞へ進む。検査は `tests/storybook-puppets.test.mjs`、2-5・2-6前後と2-7前の両幅の再生範囲は[道標・工房の会話の補足](../../art/storybook-puppet-dialogue-review-20261031.md)。

2-1の二つのパンの包み・収納・食事は `lib/storybook/picnic-cue.ts`。昼食の座り姿勢と掌は `lunch-cue.ts` を共用し、出発時の荷物は `travel-packing.ts` の退出にも適用する。2-3の天板の布は `medicine-cue.ts`。検査は `tests/storybook-picnic.test.mjs` / `storybook-medicine.test.mjs`、両幅の確認範囲と続きは[2-1・2-3の補足](../../art/storybook-picnic-packing-dialogue-review-20261031.md)。

3-7の本編構成の一時データ見本は `app/sprite-lab/storybook/garden-reception-phone/page.tsx`。荷車を押す接点は `lib/road-garden-reception.ts` の足位置を基準にし、積み荷も荷車へ追従する。3-7の接点と到着、4-3の通常調査、4-4の筆記・追跡再開の両幅の確認範囲は[搬入・往診・追跡の補足](../../art/storybook-reception-brekka-trail-review-20261031.md)。

汎用作業画像の設定は `app/phaser/road-ground-work-image.ts` を `RoadPainter` から呼ぶ。専用舞台で非表示の論理作業は画像やアトラスのコマを参照せず、作業名・進捗を残す。`tests/road-ground-work-image.test.mjs` は非表示の不正コマと、再表示時の縮尺・位置・向きの設定を検査する。両幅の実表示と警告の修正は [接続の確認](../../art/storybook-departure-seams-review-20261031.md)。

4-9の苗荷車と人物の身体比率は `lib/road-cart-layout.ts` の `seedlingCartWidth`。`app/phaser/road-work-appearance.ts` の描画と持ち手・車体回避・籠の置き場へ共通で渡す。開始時の引き手と隊列は `road-carrier-formation.ts` / `road-seedling-cart-start.ts`。比率と描画接点は `tests/road-seedling-cart-scale.test.mjs`、冒頭と行動不能・合流は `tests/storybook-seedling-cart-start.test.mjs`。本編構成の全工程見本は `app/sprite-lab/storybook/transplant-phone/`、両画幅の再確認は [4-9の記録](../../art/storybook-transplant-sequence-review-20261031.md)。

敵名の透明余白を除く範囲と端での折り返しは `lib/road-label-layout.ts` の `roadLabelBody` / `roadLabelWrapWidth`、実描画は `app/phaser/road-enemy-labels.ts`。原画8コマ・両向きと長い名前の回避は `tests/road-label-body.test.mjs`。2-5〜2-7の両幅、2-7の休息・回復と見本の手助け修正は [実画面の再確認](../../art/storybook-puppet-fixed-sites-review-20261031.md)。

固定作業場の荷車も `app/phaser/road-journey-cart.ts` へ `RoadLook` を渡し、人物と同じ `roadFigureDepth` で並べる。実描画の前後順は `tests/road-journey-cart-depth.test.mjs`。1-8・2-3の本編構成の見本と両幅の再確認範囲、他の固定作業場の残件は [固定作業場の確認記録](../../art/storybook-fixed-sites-review-20261031.md)。

本編構成の一時データ見本で使う時計と一時停止は `app/sprite-lab/storybook/lantern-road-phone/phone-study.tsx`。`PhoneFrame.reviewPaused` から `AdventureTab` の描画停止へ渡し、通常ゲームの既定値はfalse。停止・再開・リセットと進行時計の保持は `tests/storybook-phone-trial.test.mjs`。

固定した作業場の縦長配置は `lib/road-fixed-layout.ts`、画面に投影した足元に基づく前後順は `lib/road-layout.ts` の `roadFigureDepth`。水路の地面の縁・苔・下ろした蓋は `WaterwayProp.layer` と `waterwayPropDepth`（`lib/road-waterway-contacts.ts`）で人物より下へ置く。実際の縦長寸法での背景への埋没・地面と運搬の層は `tests/road-waterway-layout.test.mjs`、実表示の確認範囲は [1-9の接続記録](../../art/storybook-moss-return-seam-review-20261031.md)。

1-9達成後の裏手の閉鎖・退出は `lib/storybook/waterway-hatch-closing.ts`、表の道具と着座は `waterway-completion.ts`、入口への往復は `waterway-front-door.ts`。`StageMoment.scenery` を `app/story-stage-motion.ts` で時刻に合わせ、`app/storybook/waterway-completion.css` が開いた扉と登録姿勢を選ぶ。接点・到着前の非表示・カメラ内座標・静止画の継続は `tests/storybook-waterway-completion.test.mjs`、両画幅の再生範囲と残件は [確認記録](../../art/storybook-waterway-completion-review-20261031.md)。

1-6の苔の瓶は `lib/road-forest-jar.ts` / `lib/road-handheld.ts` と `app/phaser/road-handheld-props.ts`、専用姿勢は `app/phaser/road-storybook-poses.ts`。完了待機は `lib/road-forest-completion.ts`、会話直前の背景・配置は `lib/road-forest-return.ts`。本編構成と配置の見本は `app/sprite-lab/storybook/forest-return-phone/` / `forest-return-view/`。`tests/road-forest-jar.test.mjs` と `docs/art/storybook-forest-jar-review-20261030.md` に確認範囲を記録する。

1-7の探索後の待機・出口への切り替えは `lib/road-waterway-search-completion.ts`、帰還会話と共通の配置は `lib/road-waterway-search-return.ts`、管理図・目印・管理人の登場は `lib/storybook/waterway-cue.ts`。素材の登録は `scripts/build-storybook-keeper-waterway-walk.mjs` / `scripts/build-storybook-waterway-marker.mjs`。見本は `waterway-search-phone/` / `waterway-search-return-view/` / `waterway-map-review/`、検査は `tests/road-waterway-search.test.mjs` / `tests/storybook-waterway.test.mjs`、実画面の範囲は `docs/art/storybook-waterway-search-review-20261027.md`。

4-9の出発会話から本編構成の冒険開始までの確認は `app/sprite-lab/storybook/transplant-seam/`。現在の荷物と隊列の連続性の残件は `docs/art/storybook-transplant-road-seam-20261029.md`。

4-10の帰路の荷車は `app/phaser/road-journey-cart.ts` が積み荷と車体を描き、`app/phaser/road-founding-wheel.ts` が遠近による横幅を保って車輪を回す。登録位置は `lib/road-founding-wheel.ts`、素材梱包は `scripts/build-storybook-founding-cart-body.mjs`、検査は `tests/road-founding-wheel.test.mjs`。実画面の範囲は `docs/art/storybook-founding-road-draft-20261029.md`。

荷車と戦闘の画角は `lib/road-journey-camera.ts` と `lib/road-brekka-cart-camera.ts`、4-10の描画上の優先位置は `lib/road-founding-formation.ts`。戦闘が荷車から離れた場合と復帰は `tests/road-founding-repeat-interruption.test.mjs`。

同じ荷車を引くフィンの姿勢と持ち手は `lib/road-founding-grip.ts`、冒険描画は `app/phaser/road-poses.ts` と `road-storybook-poses.ts`。姿勢素材の梱包は `scripts/build-storybook-finn-pull-{contact,rest}.mjs`、縮尺・手元・接地は `tests/road-founding-grip.test.mjs`。

4-10の引き棒周辺の移動制限とアリアの初回位置は `lib/road-founding-shafts.ts`、他の人物の初回位置は `lib/road-motion-targets.ts`、フィンの籠の回り込みは `lib/road-founding-pickup-route.ts`。冒頭のアリア・フィン、レオンの通常・途中開始、フィンの各籠の足元・手元は `tests/road-founding-shafts.test.mjs` で検査する。残件は上記レビュー記録を参照。

4-10の籠を持った四人の向き変えは `lib/road-founding-carry-turn.ts`、ミラの回収経路は `lib/road-founding-recovery-route.ts`、荷物の受け渡し座標は `lib/road-founding-item.ts`。フィンとミラの姿勢は `scripts/build-storybook-{finn,mira}-founding-turn.mjs` で登録し、`tests/road-founding-carry-turn.test.mjs` と `tests/road-founding-recovery-route.test.mjs` で姿勢の手と中断後の経路を検査する。拾い直し中の再中断とカメラの検査は `tests/road-founding-repeat-interruption.test.mjs`。代役の実画面見本は `app/sprite-lab/storybook/founding-interruption/`。

受け取り手の戦闘中の退避と仲間の回避は `lib/road-founding-recipient.ts` と `lib/road-scene-obstacles.ts`、中断時の継続表示は `lib/road-founding-interrupted-frame.ts`。両幅の退避・復帰と荷物取得前の中断は `tests/road-founding-recipient-battle.test.mjs`。

4-10の本編構成の一時データへ実際の戦闘を挿入する見本は `app/sprite-lab/storybook/founding-ambush-review.ts` と `lantern-road-phone/phone-study.tsx`。敵の接近・攻撃・撃破は `tests/storybook-founding-ambush-review.test.mjs`、一時停止中の挿入は `tests/storybook-phone-trial.test.mjs`。PC幅・スマートフォン幅の通常帰路と実戦中断の範囲は [確認記録](../../art/storybook-founding-sequence-review-20261031.md)。固定の敵を描く `founding-interruption` 見本と区別する。

2-4の本編構成の見本は `app/sprite-lab/storybook/mountain-phone/page.tsx`。狼・通常スライムの名前は `lib/road-label-layout.ts` と `app/phaser/road-enemy-labels.ts` が可視画像の範囲を使い、通常敵の表示フレームから狼を識別する。画素と名前の距離は `tests/road-label-body.test.mjs`、描画への接続・未指定時の名前は `tests/road-enemy-labels.test.mjs`。両幅の通常移動・戦闘・帰還会話への接続は [山道の確認記録](../../art/storybook-mountain-adventure-review-20261031.md)。全体の登録と確認の区別は [表示統一の状況](../../art/storybook-goal-status-20261031.md)。

落ちた籠の着地と描画順は `lib/road-founding-drop.ts` / `lib/road-founding-props.ts`、足元の影は `app/phaser/road-waterway.ts`。戦闘中は落下位置を人物の経路にも反映する。

1-9の回収中・運搬中の襲撃は `lib/road-moss-removal-actions.ts` と `lib/road-moss-basket-pause.ts`、籠を持った向き直りは `lib/road-moss-basket-turn.ts`。見本画面での一時データへの襲撃再現は `app/sprite-lab/storybook/moss-ambush-review.ts`、対象検査は `tests/road-moss-removal-actions.test.mjs` と `tests/storybook-moss-ambush-review.test.mjs`。確認範囲は `docs/art/storybook-moss-removal-adventure-review-20261027.md`。

4-7の苔床と仕掛けの試作は [位置・投影](../../../lib/road-lico-records.ts) と [確認記録](../../art/storybook-lico-records-adventure-draft-20261028.md)。介助と瓶の接触は `lib/road-lico-contacts.ts`、戦闘後の会話待ちは `app/phone-adventure-banter.tsx` / `lib/restoration-handoff.ts`。冒険と帰還会話の配置差などは確認記録の残件を参照する。

同冒険の記録の受け渡しは `lib/road-lico-documents.ts` を `RoadMossBeds` から呼び、板を避ける往復とレオンが受け取る写しを描画する。`tests/road-lico-documents.test.mjs` で接触・紙幅・帰着・戦闘中の抑止を検査する。通常進行と帰還31表示の両幅の確認範囲は [一連の確認](../../art/storybook-records-sequence-review-20261031.md)。

4-6の全工程・前後の会話の両幅確認は [苔床の通し確認](../../art/storybook-moss-beds-sequence-review-20261031.md)。`moss-beds-phone/page.tsx` の一時停止はゲームと描画を止め、「帰着の手前から」で最後の工程を再確認する。`tests/road-moss-beds.test.mjs` は15工程の順序と完了も検査する。帰還未読の間に待機の掛け合いを始めない制御は `app/phone-adventure-banter.tsx`、待機会話と演出の会話待ちを区別する検査は `tests/adventure-banter-return.test.mjs`。

4-6の苔床は `lib/road-moss-beds.ts`、PC・縦長の投影は `lib/road-moss-beds-layout.ts`。表示中の掛け合いからの連携は `app/phone-adventure-tab.tsx` と `lib/chapter-four-banter.ts`、見本は `app/sprite-lab/storybook/moss-beds/` と `moss-beds-phone/`。検査は `tests/road-moss-beds.test.mjs`、確認範囲と残作業は `docs/art/storybook-moss-beds-adventure-draft-20261028.md`。

3-8の夜道は `lib/road-night-bridge.ts`、3-9の塔の復旧は `lib/road-berne-restoration.ts`。本編のクエスト選択と完了演出の受け渡しは `app/phone-restoration-mode.ts` / `app/use-restoration-handoff.ts`、固定背景での人物・小物の前後関係は `lib/road-layout.ts`。対象の検査は `tests/road-night-bridge.test.mjs` / `tests/road-berne-restoration.test.mjs` / `tests/restoration-handoff.test.mjs`。

4-3の往診・仕入れは `lib/road-brekka-journey.ts` / `road-brekka-sequence.ts` / `road-brekka-ledger.ts`、両画幅の投影は `road-brekka-ledger-layout.ts`、検査は `tests/road-brekka-{journey,sequence,ledger}.test.mjs`。本編へ既定接続済みで、見本は `app/sprite-lab/storybook/brekka-arrival-phone/`。往診用荷車は `lib/road-trade-cart-wheels.ts` で車体と車輪を分けて移動に合わせて回す。素材は `scripts/build-storybook-brekka-medical-cart-body.mjs`、車輪の検査は `tests/storybook-trade-wheel.test.mjs`。実画面の確認範囲と残件は `docs/art/storybook-brekka-arrival-adventure-review-20261028.md`。

4-2の村道は `lib/road-lantern-road.ts` と `lib/road-lantern-layout.ts`。案内、灯籠の点検、草刈りを描画側の工程としてつなぎ、作業後にクリアと帰還会話へ進む。本編の既定表示に登録済み。両幅の工程・作業位置・描画完了とセーブ不変は `tests/road-lantern-road.test.mjs`、本編の完了待ちは `tests/restoration-handoff.test.mjs`。確認範囲と残件は `docs/art/storybook-lantern-road-review-20261028.md`。

3-6の屋敷の下見は `lib/road-manor-survey.ts`、帰還会話に合わせた庭師と荷物の配置は `lib/road-manor-survey-return.ts`、見本は `app/sprite-lab/storybook/manor-survey/`。鉢の着地、工程、到着の検査は `tests/road-manor-survey.test.mjs`、実表示と残件は `docs/art/storybook-manor-survey-review-20261028.md`。

3-3の調査は `lib/road-berne-foundation.ts`、帰還直前の背景・荷物は `lib/road-foundation-return.ts`、縦長の画角は `lib/road-housecalls-layout.ts` の `foundationLayout`。終了演出の待機は `restorationVisualInput` と `RoadSiteCompletion`、見本は `berne-foundation-phone/` と `berne-foundation-portrait/`。位置・道具回避・スキップ・負傷・減速・暗転は `tests/road-berne-foundation.test.mjs`。実表示の確認と残件は `docs/art/storybook-berne-foundation-review-20261028.md`。

3-4の屋敷の荷運びは `lib/road-manor-deliveries.ts`、展示台へ移った後の配置は `lib/road-manor-garden.ts`、縦長の画角は `lib/road-housecalls-layout.ts` の `manorDeliveryLayout`。見本は `app/sprite-lab/storybook/manor-deliveries/`、縦長は `manor-deliveries-portrait/`、帰還会話との接続は `manor-deliveries-phone/`。出発時と同じ勝手口で包みと鉢を運び、荷札を確認して庭へ向かう。品物の支点と着地後の保持、十五工程、暗転と達成、画面幅、減速設定は `tests/road-manor-deliveries.test.mjs`。実表示の確認範囲と残件は `docs/art/storybook-manor-deliveries-review-20261028.md`。

3-5の資材置き場の石選びは `lib/road-stone-selection.ts`、帰還会話に合わせた配置は `lib/road-stone-selection-return.ts`、見本は `app/sprite-lab/storybook/stone-selection/`、石の連続性と工程の検査は `tests/road-stone-selection.test.mjs`。実表示の確認範囲と残件は `docs/art/storybook-stone-selection-review-20261028.md`。

2-8の往診の支度の見本は `app/sprite-lab/storybook/housecalls/`。三軒・井戸・台の全景投影と人物寸法は `lib/road-housecalls-layout.ts`、舞台の選択は `road-housecalls.ts`、拾う・運ぶ・渡すの順序は `road-housecalls-actions.ts`、掌と四コマ・住民は `road-housecalls-contacts.ts`。`RoadGait` の任意の人物寸法を歩幅にも使う。本編の既定へ登録（全体19/37）。検査と確認範囲は `docs/art/storybook-housecalls-adventure-review-20261027.md`。

2-7の既定の作業場は `lib/road-blockade.ts`、配置と台上の接点は `road-blockade-layout.ts`、台を避ける登場・退場・引き寄せは `road-blockade-path.ts`。固定舞台の呼び分けは `road-fixed-presentation.ts`。`road-injury-pose.ts` が休息姿勢と不透明度、`road-puppet-strings.ts` が手・肩の接点を担当する。`app/phaser/road-waterway.ts` の正方形NPCは敵と同じ縮小処理を使い、表示境界を敵名の回避にも渡す。検査は `tests/road-blockade.test.mjs`、`road-injury-pose.test.mjs`、`road-puppet-strings.test.mjs`。実表示と残件は `docs/art/storybook-blockade-adventure-review-20261027.md`。

2-6の固定防衛の確認ページは `app/sprite-lab/storybook/golem/`。`lib/road-golem-defense.ts` が背景・人物・敵・三つの荷物を共通投影へ配置し、`road-puppet-attack.ts` が実攻撃の予定とイベントを姿勢へつなぐ。`tests/road-golem-defense.test.mjs` と `tests/road-puppet-attack.test.mjs` が三戦・全員の下端余白・固定荷物・着弾・攻撃の整合を検査する。本編の既定適用済み（17/37）。実表示の範囲と残件は `docs/art/storybook-golem-defense-review-20261027.md`。

2-5の固定した分かれ道の見本は `app/sprite-lab/storybook/signpost/`。背景と足元は `lib/road-signpost.ts`、工程の順序と所有者は `road-signpost-actions.ts`、拾う・向き直る・手で運ぶ・立て直す動作は `road-signpost-carry.ts`。固定舞台の効果の再投影は `road-fixed-effects.ts`。道具の握り位置は `WaterwayProp.origin` を `app/phaser/road-waterway.ts` が適用する。`tests/road-signpost.test.mjs` は両幅の9工程・荷物と道標の一意性・3回の回収・着弾を検査。登場・拾い上げ・退場は `road-signpost-owner.ts`。`tests/road-signpost-owner.test.mjs` が所有者交代と表示原点の連続を検査する。本編の既定表示へ適用済み（16/37）。実表示と残件は `docs/art/storybook-signpost-adventure-review-20261027.md`。見本の回収ボタンは `adventure-signpost-review.tsx`、五人見本の確認ボタンは `adventure-crew-review.tsx`。

手描きの人形・ゴーレム・覆面の操り手は `lib/road-storybook-enemy.ts` が歩幅・姿勢・列の分離を担当。Phaserのセルと足元の適用は `app/phaser/road-storybook-enemy.ts`、新旧素材の選択は `road-enemy-figure.ts`、体格と着弾は共通の `lib/road-enemy-layout.ts`。撤退時の列補間は `road-scene-presentation.ts` の描画専用 `sceneProgress` を使う。検査は `tests/road-storybook-enemy.test.mjs`、見本と残件は `docs/art/storybook-puppet-adventure-review-20261027.md`。見本の途中再開点は `app/sprite-lab/storybook/adventure-review-points.ts`、表示切り替えは `adventure-choice.tsx`、撤退のボタンは `adventure-puppet-review.tsx`。2-5は専用の固定舞台へ適用済み。2-6も固定防衛へ適用済み。2-7も作業場と荷物の固定舞台へ適用済み（全体18/37）。

2-1の昼食の手荷物見本は `app/sprite-lab/storybook/picnic/`。姿勢・掌・接敵距離は `lib/road-picnic.ts`、地面への置き直しと回収・待ち合わせ・到着位置の保持は `road-handheld.ts`、物の描画は `app/phaser/road-handheld-props.ts`。`tests/road-picnic.test.mjs` は両幅の15回の回収・接点・固定位置・4コマ歩行・到着位置を検査。本編へ既定適用済み。根拠と残件は `docs/art/storybook-picnic-adventure-review-20261027.md`。

2-3の包みの持ち上げ・向き直り・二袋への収納と最終閉鎖は `lib/road-packing-carrier.ts`、掌・袋の前後・収納位置は `road-packing-contacts.ts`。包装・荷札・袋の各状態は `road-packing-finish.ts`、素材梱包は `scripts/build-storybook-packing-finish.mjs`。`tests/road-packing-{storage,finish}.test.mjs` が両幅の五組、保存不変、所有者、接点と足元、各包装・閉鎖状態、出発前・完了後と既定適用を検査。最新の素材と確認範囲は `docs/art-generation/storybook-packing-finish-20261027.json`。

2-3の動作見本は `app/sprite-lab/storybook/packing/`。`lib/road-medicine-packing.ts` が背景と配置、`road-packing-actions.ts` が三工程の姿勢と品物、`road-fixed-layout.ts` が水路と共通の投影を担当。人物の素材梱包は `scripts/build-storybook-medicine-packing.mjs`、検査は `tests/road-medicine-packing.test.mjs`。本編へ既定適用済み。経過と残件は `docs/art/storybook-medicine-packing-review-20261027.md`。

1-7の探索は `lib/road-waterway-search.ts`、背景と人物の投影は共通の `road-waterway.ts` / `road-waterway-layout.ts`。図を持つ歩行と観察姿勢を到着後に切り替え、作業者や修理道具は出さない。見本は `app/sprite-lab/storybook/waterway/search/`、検査は `tests/road-waterway-search.test.mjs`、両幅の実表示は `docs/art/storybook-waterway-search-review-20261027.md`。

1-9の木べら・苔・籠の接点見本は `app/sprite-lab/storybook/waterway/moss/`。人物・背景の共通投影と手元は `lib/road-moss-removal-layout.ts`、素材梱包は `scripts/build-storybook-moss-removal.mjs`、検査は `tests/road-moss-removal-layout.test.mjs`。本編への既定接続と両幅の通し確認は実施済み。証跡と残作業は `docs/art/storybook-moss-removal-adventure-review-20261027.md`。

水路見本の `moss/adventure/` は実進行を使う回収と運搬の見本。`lib/road-moss-removal-actions.ts` が木べらから籠・レオンから作業者へ所有者をつなぎ、`road-moss-basket-pause.ts` が戦闘前後の置き直しを保持する。素材は `scripts/build-storybook-moss-cycle.mjs`、検査は `tests/road-moss-removal-actions.test.mjs`。蓋と冒頭を含む全行程は本編へ接続済み。人物の反転と原点補正は `app/phaser/road-hero-pose.ts` の `faceRoadHero`、固定作業場の奥行きは `road-party-spacing.ts` の `wideLane`。見本の説明と状態表示は `app/sprite-lab/storybook/adventure-description.ts`。

1-9の荷車への積み込み・空籠の往復・二籠目は `lib/road-moss-basket-shuttle.ts`。荷台に置いた籠の位置は原画座標で保持し、レオンへ返却してから二籠目の採取を再開する。`tests/road-moss-basket-shuttle.test.mjs` は両幅の一往復と二籠分、セーブ不変、出発指示との一致、敵と運搬路の分離を確認。荷車の梱包も `build-storybook-moss-cycle.mjs` に含む。蓋と次の点検口は `lib/road-moss-hatches.ts`、接点と開口の通行判定は `road-moss-hatch-layout.ts`。素材は `scripts/build-storybook-moss-hatches.mjs`、検査は `tests/road-moss-hatches.test.mjs`。出発前・完了後の描画は `AdventureInput.questComplete` を参照し、共通の外観型は `lib/road-look.ts`。

水路の固定作業場の配置見本は `app/sprite-lab/storybook/waterway/`、共通縮尺・画面/世界座標の投影は `lib/road-waterway-layout.ts`。背景3状態の梱包は `scripts/build-storybook-waterway.mjs`、検査は `tests/road-waterway-layout.test.mjs`。1-7〜1-9は本編へ適用済み。経過と残作業は `docs/art/storybook-waterway-adventure-review-20261027.md`。

1-8の実進行を使う冒険見本は同ディレクトリの `adventure/`。固定した作業地点・敵・効果の投影は `lib/road-waterway.ts`、道具荷車の保持と配送は `lib/road-waterway-motion.ts`、作業者は `app/phaser/road-waterway.ts`。車輪は `lib/road-trade-cart-wheels.ts`、車体は `scripts/build-storybook-waterway-cart-body.mjs`。`tests/road-waterway-{motion,art}.test.mjs` / `tests/storybook-trade-wheel.test.mjs` で進行・接点・車輪・素材を検査。本編の既定適用は `lib/storybook/adventure.ts`。1-7は下記の探索用処理。

同見本の籠と補修石は `lib/road-waterway-actions.ts` → `road-waterway-{basket,stone}.ts`、手と物の接点・寸法は `road-waterway-contacts.ts`。`RoadMotion` が作業位置への到着と実際の歩幅を渡し、`road-hero-pose.ts` / `road-waterway.ts` が同じ姿勢と持ち物を描く。`tests/road-waterway-handoffs.test.mjs` は二度の回収・手渡し・退避・設置・再開と保存不変を検査。追加歩行と作業者は `scripts/build-storybook-waterway-handoffs.mjs` で登録する。鋸の拾い上げと手離し後の固定は `lib/road-waterway-saw.ts`、登録は `scripts/build-storybook-waterway-saw.mjs`、検査は `tests/road-waterway-saw.test.mjs`。両幅の全行程記録は上記レビュー末尾。

手描きの林道・薬草採取は `lib/road-storybook-work.ts` の `arrangeStorybookForage`、`app/phaser/road-storybook-poses.ts`、`scripts/build-storybook-forage.mjs`。画面幅と作業物の比率・補正後の採取姿勢は `tests/storybook-forage.test.mjs`、実表示の範囲と残件は [林道の確認記録](../../art/storybook-forest-adventure-review-20261027.md) を参照。

[作業別のコード案内](../code-map.md) に戻る。

全章の地面の作業画像を通常の描画経路で点検するのは `scripts/audit-storybook-live-work.mjs`。結果と限界は `docs/art/storybook-live-work-audit-20261030.md`。素材種類の登録監査と、実画面の動作確認は区別する。

1-7末尾の灯りの設置と管理図への記録は `lib/storybook/waterway-notes-cue.ts`、記録姿勢の梱包は `scripts/build-storybook-leon-kneel-notes.mjs`。同じ `waterway-map-review/` の動作切替で確認する。

1-8出発会話の排水口への場面切替、籠の設置、図の出し入れと退場は `lib/storybook/waterway-repair-cue.ts`。籠の設置姿勢の梱包は `scripts/build-storybook-leon-basket-place.mjs`。検査は `tests/storybook-waterway.test.mjs`、実画面の範囲と残件は `docs/art/storybook-waterway-repair-dialogue-review-20261030.md`。

1-8冒頭の管理人からの籠の受け渡しは `lib/storybook/waterway-basket-handoff.ts`。管理人の手元と歩行は `scripts/build-storybook-keeper-motions.mjs`、接点と姿勢の検査は `tests/storybook-waterway-handoff.test.mjs`。1-7の管理人の歩行も同じ青灰色の上着と基準を使う。

1-8冒頭の取引先の人の荷下ろし、荷車と地面に残す縄、待機位置から籠を避けて戻るレオンは `lib/storybook/waterway-unloading.ts` / `waterway-basket-handoff.ts`。空荷車と既存8姿勢の梱包は `scripts/build-storybook-waterway-unload.mjs`、表示は `app/storybook/waterway-unload.css`。接点・引き手を避ける経路・画素と足元の維持は `tests/storybook-waterway-unloading.test.mjs`。

1-8達成後の布をしまってから籠を拾う順序、地面の籠と道具の継続、乾いた道への退場は `lib/storybook/waterway-return-cue.ts`。布自体の受け渡しは `waterway-cloth.ts`、接点と退場経路の検査は `tests/storybook-waterway-return.test.mjs`。

1-8達成後に石際の苔を見に行き、布の受け渡し前に戻る動きは `lib/storybook/waterway-bank-inspection.ts`。独立した苔の小物は使わず、`drain-inspection-dusk-v1.png` の石目に生えた苔を指す。管理人が石蓋へ近づいて印を付け、修理後の会話中に印を残す処理は `waterway-hatch-mark.ts`、手元・経路・姿勢の検査は `tests/storybook-waterway-hatch.test.mjs`。画像の登録は `scripts/build-storybook-waterway-dusk.mjs` と `build-storybook-keeper-motions.mjs`、全文指示は `docs/art-generation/storybook-waterway-hatch-mark-20261031.json`。翌日の可動石蓋は次項を参照する。

1-9冒頭の点検口は `lib/storybook/waterway-hatch-opening.ts`。背景から外した石蓋を独立した同じ小物として、管理人の把持→持ち上げ→横歩き→設置→帰還へつなぐ。左向きの作業姿勢の手元を移動方向で反転しない場合は `StageItem.wristUnmirrored` を指定する。印は蓋のCSS内に描き、苔の淡い光は蓋を動かしてから別の効果小物を追加する。`tests/storybook-waterway-opening.test.mjs` が手元・床との接点、到着時刻、足場・作業者・後のアリアの足との離れ、足元と歩行の縮尺を検査する。

- **編集元・主要関数**: [表示用投影](../../../lib/adventure-presentation.ts) の `adventureFrame` / `adventureAction` → [DOM操作](../../../app/map-stage.tsx) の `MapStage` → [Phaser接続](../../../app/phaser-adventure.tsx) の `PhaserAdventure`。味方の戦闘時の表示間隔は [隊形](../../../lib/road-party-formation.ts)、移動・作業コマの切替は [道中の姿勢](../../../app/phaser/road-poses.ts)。Canvas描画は [app/phaser/](../../../app/phaser/)。
- **仕様**: [Phaser冒険画面](../phaser-adventure.md)、[横スクロール戦闘](../../gameplay/scrolling-battle.md)。描画側へ進行・保存の判定を重複させない。
- **位置の連続性**: [道中の移動演出](../../../lib/road-motion.ts) の `RoadMotion` を `ChapterRoadPainter` ごとに保持し、隊形・作業地点・カメラの切替を補間する。戦闘の揺れと踏み込みは敵の胴体まで入り込まない表示間隔に収める。表示位置はエフェクトと回復タップにも共有する。[移動検査](../../../tests/road-motion.test.mjs) で襲撃・撃破・次の地点への遷移、静止条件、表示位置への入力を確認する。
- **味方のすれ違い**: [表示間隔](../../../lib/road-party-spacing.ts) で停止位置の顔・HP表示と、歩行中の足元の通行幅を分ける。[回り道](../../../lib/road-party-path.ts) は他の人物の足元を避け、荷車への復帰を妨げない経路を選ぶ。HPバーは各人物の描画深度に追従し、すれ違う手前の人物より奥へ描く。[隊列検査](../../../tests/road-party-spacing.test.mjs) で5人の入れ替え、横歩きの向き、画面幅変更、減速設定、各章の戦闘・作業復帰を検査する。
- **荷車の隊列**: [運搬時の配置](../../../lib/road-carrier-formation.ts) で引き手・押し手の画面上の位置と奥行きを決める。[運搬検査](../../../tests/road-transport.test.mjs) で人数・戦闘後の復帰・荷車との位置関係を確認する。
- **背景と奥行き**: [共通投影](../../../lib/road-layout.ts) は画面幅・高さから前後の間隔を決め、人物・物・エフェクト・入力へ共有する。[冒険用背景](../../../lib/road-background.ts) は街道とベルネを通行帯のある絵へ切り替え、会話の構図は変えない。[カメラ検査](../../../tests/rpg-camera.test.mjs) と実画面で背景の道との一致を確認する。
- **敵名の重なり**: [名前の配置](../../../lib/road-label-layout.ts) で同種・同表示の敵を数付きでまとめ、[実描画の境界](../../../app/phaser/road-enemy-labels.ts) を使って人物・HPバー・物を避ける。異なる行動予告は別に表示し、個別HPバーは維持する。[配置検査](../../../tests/road-label-layout.test.mjs) とコロタケ・ゴーレムの実再生で確認する。
- **検証**: [投影・入力](../../../tests/adventure-presentation.test.mjs)、[描画部品](../../../tests/map-render.test.mjs)、[静止ミニキャラ](../../../tests/hero-animation.test.mjs)、[リコの歩行・運搬](../../../tests/road-poses.test.mjs)。道中や第三章の画面は [手動テスト](../development.md#ローカルの手動テスト) の `chapter-road.browser.mjs` / `chapter-three.browser.mjs`。ブラウザー表示と実機は別に確認。
- **冒険の人物**: [共通のコマ規約](../../../lib/adventure-hero-art.ts) → [配信生成](../../../scripts/build-adventure-pixel.mjs) → [姿勢切替](../../../app/phaser/road-poses.ts)。歩行はホーム素材を共用し、待機・戦闘・採集・運搬は歩行の頭幅に合わせた専用コマ。[配信基準と検査](../../art/adventure-pixel.md)を参照。
- **4-3 往診と控え**: [庭での控え確認](../../../lib/road-brekka-notes.ts) と [醸造所の机・作業者](../../../lib/road-brekka-ledger.ts) を [描画順序](../../../lib/road-brekka-journey.ts) が切り替え、[終了時の描画入力](../../../lib/restoration-visual-input.ts) が帰還会話へつなぐ。[本編構成の一時見本](../../../app/sprite-lab/storybook/brekka-arrival-phone/page.tsx) と [引き継ぎ検査](../../../tests/road-brekka-handoff.test.mjs)、[全行程検査](../../../tests/road-brekka-journey.test.mjs) を使用。適用範囲と実画面の残件は [レビュー記録](../../art/storybook-brekka-arrival-adventure-review-20261028.md)。
- **4-4・4-5 荷車追跡**: [追跡表示](../../../lib/road-moss-trail.ts) が二人または四人と御者・荷車・車輪を動かす。[一日目](../../../tests/road-moss-trail.test.mjs)・[二日目](../../../tests/road-moss-second-day.test.mjs) の両画幅検査と [一日目の記録](../../art/storybook-moss-trail-adventure-draft-20261028.md)・[二日目の試作記録](../../art/storybook-moss-second-day-adventure-draft-20261028.md) に確認範囲と残件を記載する。
- **スマホの鮮明さ**: [描画解像度](../../../app/phaser/adventure-resolution.ts) でCanvas・カメラを高密度化する。味方と敵は[共通の画素密度](../../../lib/adventure-pixel-sampling.ts)とNEARESTで描き、敵の[独立した縮小キャッシュ](../../../app/phaser/road-sprite-filter.ts)はDPRに依存させない。[解像度検査](../../../tests/adventure-resolution.test.mjs) / [縮小検査](../../../tests/road-sprite-filter.test.mjs) / [輪郭と密度の検査](../../../tests/adventure-pixel-sampling.test.mjs) と、`TEST_DPR=3` を指定した道中のブラウザー検査でサイズ・リサイズ・タップを確認する。

作業ポイントの説明札は [作業画像の下端への追従](../../../app/phaser/road-work-caption.ts) を参照。

旅団は [全身コマのドット絵調描画](../../../app/phaser/home-room-art.ts)。[拡大・パン・タップ](../../../app/phaser/home-room-view.ts)、[動作](../../../lib/home-actor.ts)、[生活と経路](../../../lib/home-room-life.ts)、[マス配置](../../../lib/home-room-layout.ts)、[制作記録](../../art/guild-lab.md) を参照。部位を切り離す合成試作は廃止した。


作業ポイントの画像は [全作業文の対応](../../../lib/road-worksite-catalog.ts) → [素材と動作](../../../lib/road-worksite-art.ts) → [表示](../../../lib/chapter-road-work-look.ts)。[全章の点検記録](../../art/worksite-audit.md) と [未登録検査](../../../tests/road-worksites.test.mjs)、`tests/road-worksites.browser.mjs` で追加漏れと小表示を確認する。

歩行の制作見本は [見本の姿勢](../../../lib/home-walk-study.ts) → [比較ページ](../../../app/sprite-lab/walk/study.tsx) → [5人の実素材比較](../../../app/sprite-lab/walk/pilot.tsx)。制作ガイドにだけ関節描画を使い、ゲーム内の全身コマ切替は維持する。検査は `tests/home-walk-study.test.mjs` / `tests/home-walk-study.browser.mjs`。

作業台の制作見本は [手元と上半身の動き](../../../lib/home-work-study.ts) → [無地モデルと台](../../../app/sprite-lab/work/figure.tsx) → [再生と4姿勢](../../../app/sprite-lab/work/study.tsx) → [5人の実素材比較](../../../app/sprite-lab/work/residents.tsx)。[作業コマ生成](../../../scripts/home-work-frames.mjs) で同じ縮尺と足元を揃え、旅団と同じ `*-work.webp`・4姿勢の時刻を使う。事務机も同じ4コマを共用し、比較ページで台を切り替えられる。お茶と [再生処理](../../../app/sprite-lab/study-player.ts) を共有する。検査は `tests/home-work-study.test.mjs` / `tests/home-work-study.browser.mjs`。

菜園の制作見本は [水やりの4姿勢](../../../lib/home-garden-study.ts) → [無地モデルと植物](../../../app/sprite-lab/garden/figure.tsx) → [再生・左右・小表示](../../../app/sprite-lab/garden/study.tsx)。[5人の実素材比較](../../../app/sprite-lab/garden/residents.tsx) と旅団で `*-garden.webp`、[注ぎ口と水滴](../../../lib/home-garden-water.ts) を共用する。作業と共通の配信生成で足元を揃える。保存・生産の判定は既存処理のまま。検査は `tests/home-garden-study.test.mjs` / `tests/home-garden-study.browser.mjs`。

お茶・会話の制作見本は [座位とカップの軌跡](../../../lib/home-tea-study.ts) → [2人と家具の描画](../../../app/sprite-lab/tea/figure.tsx) → [再生・姿勢一覧](../../../app/sprite-lab/tea/study.tsx) → [5人の左右向き比較](../../../app/sprite-lab/tea/residents.tsx)。旅団と同じお茶アトラスと4姿勢の時刻を使い、利き手を反転せず切り替える。検査は `tests/home-tea-study.test.mjs` / `tests/home-tea-study.browser.mjs`。

歩行原本は各人の `*-walk-v9-a.png`（1〜4コマ）と `*-walk-v9-b.png`（5〜8コマ）。ミラ・フィンの後半だけは色味と頭身を合わせた `*-walk-v10-b.png` を使う。[読み取り](../../../scripts/home-walk-frames.mjs) の `walkSourceName` → [配信画像の生成](../../../scripts/build-home-pixel.mjs) を通す。比較ページの全8コマ一覧は配信画像をそのまま使い、クリックした位相で停止する。2人の頭幅・髪色の回帰検査は `tests/home-walk-identity.test.mjs`。

施設アイコンは [座標と型](../../../lib/home-room-markers.ts) → [React操作](../../../app/home-room-markers.tsx) → `app/phaser/home-room-game.ts` のカメラ投影。着席時の頭幅合わせと椅子・道具の位置は [表示寸法](../../../lib/home-room-presentation.ts)。実画面の幅・担当・拡大は `tests/guild.browser.mjs`、茶席の反応と回転なしの確認は `tests/home-room.browser.mjs`。

荷車の引き手・押し手は `lib/road-cart-layout.ts` で画像と手元の接点を同じ表示寸法から求め、`lib/road-carrier-formation.ts` で隊列へ投影する。引く一人・押す一人以外は同行し、4-9は本文どおりフィンが引く。`lib/road-motion.ts` は運搬中の同行者にも隊列を保つ。`tests/road-transport.test.mjs` と `tests/road-motion.test.mjs` で画面幅・交代・戦闘復帰・タップ位置・移動の連続性を検査する。
作業名のDOM表示矩形は `app/phaser/road-work-caption.ts` から敵名の配置へ渡す。作業と襲撃が同時に表示される場面でも文字を重ねない。折り返し・リサイズ・非表示は `tests/road-work-caption.test.mjs` で検査する。
- 冒険の作業物を避ける経路は `lib/road-work-layout.ts` の描画寸法・足元範囲と各場面の障害物を `lib/road-scene-obstacles.ts` で集め、`lib/road-motion.ts` へ渡す。`road-party-path.ts` は人物と物それぞれの幅・奥行きで回り道を探す。全18種類の作業位置への到達と、両方向からの通過は `tests/road-work-path.test.mjs`。
- 4-1の手紙配達は `lib/road-linde-presentation.ts` と `lib/road-linde-delivery.ts`、担当者の素材と手元は `lib/road-linde-couriers.ts` と `lib/road-linde-letter.ts`、交代時の拾得は `lib/road-linde-pickup.ts`、塞がれた受け渡し位置の反対側への切替は `lib/road-linde-handoff-side.ts`。本編への適用は `lib/storybook/adventure.ts` と `app/phone-game-frame.tsx`、担当者交代と完了待ちの確認は `tests/road-linde-delivery.test.mjs`。
- 4-2の村道の冒険試作は `lib/road-lantern-layout.ts` / `lib/road-lantern-road.ts` と `app/sprite-lab/storybook/lantern-road/`。高速進行時の描画順と帰着は `tests/road-lantern-road.test.mjs`、実画面と未完了事項は `docs/art/storybook-lantern-road-review-20261028.md`。本編への適用は未完了。
停止中の冒険リサイズは `app/phaser/adventure-resolution.ts` の描画のみの再実行と、`lib/road-motion.ts` の画角変更時の配置更新を確認する。解像度・停止の境界は `tests/adventure-resolution.test.mjs`、持ち手を保つ配置は `tests/road-motion.test.mjs`。
停止直前の描画は同ファイルの `freezeAdventureScene`。追加素材の完了時は `chapter-road-painter.ts` から再描画と停止状態を同期する。

絵本調見本の荷札確認は `lib/road-storybook-work.ts` で作業画像の手元と小包の寸法から位置を決める。`tests/storybook-work-contact.test.mjs` はPC・スマホ相当幅の連続フレームで両者の作業姿勢が維持されることを確認する。
同モジュールの `storybookWorkAppearance` が会話と共用する布付き木箱を選び、見本の素材一覧と冒険描画へ渡す。

絵本調の冒険見本の連続地面は `lib/road-scrolling-background.ts`。人物・荷物と同じ `roadScale` でカメラ移動を投影し、2枚の背景で横方向を覆う。`tests/road-scrolling-background.test.mjs` で地面と静止荷物の相対位置、継ぎ目通過時の被覆を検査する。通常の一枚絵背景は従来のパンを維持する。

冒険背景の描画は `app/phaser/road-scenery.ts`。一枚絵のパン、連続路面、見本専用の倉庫を担当する。倉庫は最初の荷札確認地点の座標を保持し、運搬中も荷車について移動しない。

見本の歩行・押し引きの足運びは `lib/road-gait.ts` で世界座標の移動距離を積算し、`road-poses.ts` から手描き4コマへ渡す。`tests/road-gait.test.mjs` は停止、描画頻度の差、縦移動、リサイズ時の位相保持を確認する。荷札確認の手作業と旧素材は時間基準を維持する。

本編の手描き冒険への適用範囲は `lib/storybook/adventure.ts`。`PhaserAdventure` の入口で描画専用入力を補い、読込・描画・入力判定で共有する。`tests/storybook-adventure.test.mjs` はクエスト選択・明示的比較OFF・状態不変を検証。倉庫ランドマークの冒険開始時の初期化と世界座標への固定は `tests/road-scenery.test.mjs`。

手描き山道の冒険見本は `app/sprite-lab/storybook/mountain/page.tsx`。本編への適用は `lib/storybook/adventure.ts`、背景選択とスクロールは `lib/road-scrolling-background.ts` / `app/phaser/road-scenery.ts`。三人の戦闘原本は `scripts/build-storybook-battle.mjs` で256×192へ登録し、`app/phaser/road-storybook-poses.ts` が歩行と同じ足元・縮尺で描く。検査は `tests/storybook-adventure.test.mjs` / `tests/road-poses.test.mjs` / `tests/road-scenery.test.mjs`。

五人の冒険見本は app/sprite-lab/storybook/crew/page.tsx。苗運搬では lib/road-carrier-formation.ts がフィンの引き手とアリアの押し手を選び、lib/road-cart-layout.ts が個別の手と苗荷車の縁・取っ手を投影する。tests/road-transport.test.mjs は複数幅で接点と状態不変を確認。手描きスライムと狼の表示・接地は tests/adventure-enemy-art.test.mjs。

4-3の往診・帳簿・町外れの試作は `lib/road-brekka-journey.ts`、帳簿の順序は `lib/road-brekka-sequence.ts`、戦闘場所の切り替えは `lib/road-brekka-battle-place.ts`。荷車は `lib/road-journey-cart.ts`、庭と戦闘の画角は `lib/road-brekka-cart-camera.ts`、戦闘確認地点を直接開くときの初期配置は `lib/road-brekka-initial-spacing.ts`。背景選択は `app/phaser/road-scenery.ts`、確認範囲と残件は `docs/art/storybook-brekka-arrival-adventure-review-20261028.md`。

最後の隊列は `lib/road-brekka-arrival.ts`、暗転と表示完了の順序は `lib/road-brekka-arrival-transition.ts`。両画幅の到着後と暗転・停止は `tests/road-brekka-journey.test.mjs` / `tests/road-brekka-arrival-transition.test.mjs`。

水路の埋め戻しはearthworkの作業動作と専用フレームをlib/road-storybook-work.tsで選び、lib/road-work-layout.tsで人物数に合わせた土の幅と通行を扱う。app/phaser/road-poses.tsはearthworkだけに移植ごて3姿勢を渡し、他の採取には適用しない。tests/storybook-earthwork.test.mjsで足元・立位との倍率・作業間隔・状態不変、tests/road-poses.test.mjsで減速設定とフレームの受け渡しを確認する。

手描き戦闘の弓・杖・瓶の発射点、放つまでの時間、着弾、サイズ・色・奥行きはlib/road-effect-layout.ts。app/phaser/road-painted-effects.tsが透明セルへ渡す。敵本体と着弾の共通高さはlib/road-enemy-layout.ts。敵名はlib/road-enemy-caption.tsで作業指示と区別し、固有名・攻撃予告を維持。検査はtests/road-effect-layout.test.mjsとtests/road-enemy-caption.test.mjs。

全章の会話・一枚絵・冒険・作業素材の登録状況は `node scripts/audit-storybook-coverage.mjs` で一覧化し、詳細を `work/storybook-coverage.json` に出力する。冒険は `scripts/storybook-adventure-coverage.mjs` で本編の演出選択・描画入力も通して背景を確認する。未登録の会話行と冒険ステージを探す入口であり、実画面の動き・接触・サイズの検証完了を示すものではない。

会話舞台の背景準備と次の背景の先読みは `app/use-story-stage-images.ts` / `lib/storybook/stage-images.ts`。準備中は `app/storybook/story-reader-stage.tsx` が舞台の再生を待ち、取得できない場合は既存背景へ切り替える。遅延・失敗の画面確認と残る範囲は `docs/art/storybook-stage-loading-review-20261029.md`。

1-3帰還後の倉庫・取引先の人・空の包み・控えの継続は `lib/storybook/town-return-cue.ts` と `app/storybook/town-return.css`。冒頭の包みの着地と手を離す順序、25表示と退出の小物保持は `tests/storybook-merchant-placement.test.mjs`。生成元とPC・スマホ幅の記録は `docs/art-generation/storybook-town-return-20261027.json`。

2-7帰還後の分かれ道は `lib/storybook/blockade-fork-cue.ts` / `app/storybook/blockade-fork.css`。道標を受け渡す角度・設置後の手離し、荷車の固定座標からNPC保持への接続、通行を空ける人物位置、手当ての手首を扱う。`tests/storybook-blockade-fork.test.mjs` は荷車の所有者が変わる瞬間にも車輪と荷が落ちないこと、包帯の手が患者の手首へ届くこと、人物の同一倍率と余白を確認。NPC保持の小物の `bottom` はNPCの基準高さからの補正で、単純な足し算ではない。原画と両幅の確認記録は `docs/art-generation/storybook-blockade-fork-20261027.json`。

2-8前後と2-9出発前の集落・患者室はlib/storybook/households-cue.ts、household-contacts.ts、homeward-cue.tsとapp/storybook/households.css。既存の生のキューを変更せず、二人の薬箱の接点、台の外を通る経路、椅子の独立表示、湯桶の持ち替え、翌朝の拾い上げと帽子の挨拶を登録する。tests/storybook-households.test.mjsで接点・継続・一枚絵維持・共通倍率を検査。帽子を戻す段階はStageExtra.hatGreetingのlowerで指定し、通常の挨拶12と戻す姿勢24を分ける。

2-9の手荷物は `lib/road-handheld.ts` の描画専用状態を `RoadMotion` へ渡し、`app/phaser/road-handheld-props.ts` / `road-hero-pose.ts` で同じ姿勢の手元へ投影する。対向の荷車は `lib/road-passing-traffic.ts` と `road-scenery.ts`。世界座標に置いた後の回収・状態不変・余白は `tests/road-handheld.test.mjs`、8セルの登録は `tests/road-poses.test.mjs`。両幅の証跡と未完了事項は `docs/art/storybook-homeward-adventure-review-20261027.md`。

1-4の畑と林の冒険は `lib/road-scrolling-background.ts` の丘の路面と `app/phaser/road-scenery.ts` の到着地点の塔を組み合わせる。梱包は `scripts/build-storybook-hill.mjs`。`tests/road-scenery.test.mjs` は世界座標への固定と両幅での人物比、`tests/storybook-forage.test.mjs` は薬草との接点と状態不変を検査。夜の丘の路面は1-5でも使用し、瓶と光は次項の処理で扱う。実画面の証跡は `docs/art/storybook-hill-adventure-review-20261027.md`。

1-5の瓶と布は `lib/road-handheld.ts` の苔灯状態、`app/phaser/road-handheld-props.ts` の接点と接地影、`road-hero-pose.ts` / `road-storybook-poses.ts` の布付き姿勢で扱う。`road-night-lights.ts` は描画された瓶の座標を再利用し、足元の光を床へ投影。`tests/storybook-night-road.test.mjs` で置き直し・足場・状態不変・余白、`tests/road-night-lights.test.mjs` で光の接点・床・別場面への残留を確認。梱包は `scripts/build-storybook-night-adventure.mjs`、証跡は `docs/art/storybook-night-adventure-review-20261027.md`。

交易路の継続する荷車は `lib/road-journey-cart.ts` と `app/phaser/road-journey-cart.ts`。`RoadMotion` で車体を避け、採取・戦闘中の固定と再出発時の持ち手を扱う。`lib/road-paint-key.ts` が同じ交易の帰着だけ描画の識別子を保ち、完了後の回収・接近をつなぐ。人物との共通倍率は `journeyCartWidth`、素材・作業バーの寸法の選択は `app/phaser/road-work-appearance.ts`。`tests/road-journey-cart.test.mjs` は両クエスト・両幅で状態不変と継続、向き、停止・減速設定、共通倍率を検査。1-1・1-2は本編の既定表示へ適用。残作業・証跡は `docs/art/storybook-trade-adventure-review-20261027.md`。

交易路の前後の車輪は `app/phaser/road-trade-wheels.ts`、車軸と大きさは `lib/road-trade-cart-wheels.ts`。苗の荷車と共通の `lib/road-wheel-rotation.ts` が移動距離から角度を求める。停止・縮尺変更・減速設定と荷台の持ち手は `tests/storybook-trade-wheel.test.mjs` / `tests/storybook-seedling-wheel.test.mjs` を参照する。

1-3の箱の共同運搬は `lib/road-town-parcel.ts` と `app/phaser/road-town-parcel.ts`。荷札確認から同じ箱の位置・幅を引き継ぎ、`lib/road-scene-obstacles.ts` で接近中の足元を箱から避ける。二人が持ち場へ着いてから持ち上げる。配達先での箱と控えは `lib/road-town-handoff.ts`、通常移動への接続は `lib/road-town-sync.ts`、商店と倉庫の建物は `app/phaser/road-town-landmarks.ts`。描画の位置・持ち上げはセーブへ書き戻さない。`/sprite-lab/storybook` の「冒険・倉庫前」には配達先手前からの再生操作がある。検査は `tests/road-town-parcel.test.mjs` と `tests/road-scenery.test.mjs`、確認範囲と残課題は `docs/art/storybook-town-delivery-adventure-review-20261029.md`。

1-3の最後の配達は、完了済みセーブとは別に `lib/restoration-handoff.ts` / `lib/restoration-visual-input.ts` で直前の描画入力を保持し、`TownParcelLift` と `chapter-road-painter.ts` の完了通知後にクリア画面へ渡す。途中表示からの復元と完了待ちの検査は `tests/restoration-handoff.test.mjs`、本編構成の一時データ確認は `/sprite-lab/storybook/town-delivery-phone`。

3-9復旧の試作は `app/sprite-lab/storybook/berne-restoration/page.tsx` と `lib/road-berne-restoration.ts`。位置・台詞に応じた姿勢は `lib/road-restoration-layout.ts`、石工の石の移動・姿勢は `lib/road-restoration-placement.ts` / `road-restoration-mason.ts`、石の描画は `lib/road-restoration-stone.ts`。持ち上げ姿勢・運搬歩行・石の側面の梱包は `scripts/build-storybook-mason-lift-stone.mjs` / `scripts/build-storybook-mason-replace-stone.mjs` / `scripts/build-storybook-stone-turn.mjs`。運搬歩行の試作版は `node scripts/build-storybook-mason-replace-stone.mjs carry v2`。試作の掛け合いは `app/sprite-lab/storybook/restoration-banter.tsx`、表示中の行の通知は `app/use-banter-line.ts`。完了後の一時描画は `app/sprite-lab/storybook/restoration-preview-state.ts`、描画完了の通知は `app/phaser/chapter-road-painter.ts` と `renderer-session.ts`、試作限定の連続手助けは `app/sprite-lab/storybook/restoration-assist.tsx`。`tests/road-berne-restoration.test.mjs` は姿勢の倍率・台詞による作業開始・完了後の継続・状態不変を検査する。試作の未完了事項と実画面の記録は `docs/art/storybook-berne-restoration-draft-20261028.md`。

3-9の帰還画面への接続試験は `app/sprite-lab/storybook/restoration-phone/page.tsx`。通常のゲーム画面の `PhoneFrame` を一時データで開き、`app/use-restoration-handoff.ts` / `lib/restoration-handoff.ts` が完了前の描画状態と帰還ダイアログを調整する。描画入力だけを `lib/restoration-visual-input.ts` / `app/restoration-map-renderer.tsx` で差し替える。スキップ・再読み込み・表示変更の分岐は `tests/restoration-handoff.test.mjs`。この接続は通常の本編でも対象クエストに自動適用する。

3-8の夜道・荷車は `app/sprite-lab/storybook/night-bridge/page.tsx` と `lib/road-night-bridge.ts`。荷車を押す新しい歩行素材は `scripts/build-storybook-finn-night.mjs push-v2` の後に `scripts/build-storybook-finn-night-push-v3.mjs` で梱包する。運搬開始点と掛け合いは `app/sprite-lab/storybook/adventure-review-points.ts` / `adventure-night-review.tsx` / `restoration-banter.tsx`、試作の進行状況表示は `adventure-status.tsx`、状態と縮尺は `tests/road-night-bridge.test.mjs`。本編と同じ操作枠での到着確認は `app/sprite-lab/storybook/night-bridge-phone/page.tsx` の一時データを使う。到着後に完了画面を開く受け渡しは3-9と共通の `lib/restoration-handoff.ts` / `lib/restoration-visual-input.ts` で、通常画面にも自動適用する。表示の確認範囲と未解決事項は `docs/art/storybook-night-bridge-draft-20261028.md`。

3-8のカメラは `nightBridgeLayout`（`lib/road-housecalls-layout.ts`）。背景・人物・敵・荷車・荷物に同じ倍率を使い、到着後は四人が収まる画角に切り替える。横長画面は上下を切って背景を画面幅まで広げ、人物を会話欄より上に置く。背景の表示位置は `nightBridgeBackdrop` が中央へ補正する。縦長用の夜道・橋の背景の選択と配置は `lib/road-night-portrait.ts`、描画は `app/phaser/road-scenery.ts`。原画と生成指示は `docs/art-generation/storybook-night-portrait-20261028.json`、範囲と画面確認は `docs/art/storybook-night-bridge-draft-20261028.md`。

3-8の掛け合いは `lib/chapter-three-banter.ts` が生存中の敵・休憩・橋への接近を判定し、`app/use-banter-exchange.ts` が状況の切り替わりに現在の会話を差し替える。中断された各会話の次の行と表示済みの履歴は保持し、会話が一巡した際の表示は `app/banter-tail.tsx`。通常の会話送りは `lib/banter-exchange.ts` にあり、`tests/banter-exchange.test.mjs` と `tests/road-night-bridge.test.mjs` が切り替えを検査する。連続手助けの操作は `app/sprite-lab/storybook/restoration-assist.tsx` を3-8と3-9の一時データ見本で共用する。

4-8の苗の積み出し口は `lib/road-seedling-battle.ts` で前後の会話と同じ地面位置へ投影し、メリルとコロタケの姿勢は `app/phaser/road-enemy-figure.ts`、会話側の回収位置は `lib/storybook/seedlings-actors.ts` / `seedlings-items.ts` で扱う。一時データの本編表示は `app/sprite-lab/storybook/merrill-seedlings-phone/page.tsx`、検証と未完了事項は [試作記録](../../art/storybook-merrill-seedlings-adventure-draft-20261029.md)。

同見本の「Lv35で通し確認」は、保存しない初期状態から通常速度で戦闘を再生する。操作欄は `app/sprite-lab/storybook/study-tools.tsx` のReactのstateで開閉し、3-8の見本でも共用する。通常戦闘・出発前35・帰還41表示の両幅確認と名前の修正は [一連の確認](../../art/storybook-seedlings-sequence-review-20261031.md)。3-8の五つの運搬区間・到着への接続と、3:2の人物配置の修正は [夜道の確認](../../art/storybook-night-bridge-sequence-review-20261031.md)。

4-8の召喚と演奏の台詞は `lib/chapter-four-battle-banter.ts` で行動に対応付け、`lib/banter-exchange.ts` の `interruptBanter` が未表示の台詞を保持して切り替える。メリルのHPが尽きた場合は未表示の台詞を破棄し、演奏が止まった文へ切り替える。表示中の歌は `app/use-garden-dialogue.ts` から描画入力へ渡し、`lib/road-seedling-battle.ts` が演奏姿勢を維持する。コロタケが残る間、HPが尽きたメリルもその場に描く。状態や戦闘の時刻は変更しない。切り替えと描画状態の検査は `tests/banter-exchange.test.mjs` / `tests/chapter-four-battles.test.mjs` / `tests/road-seedling-battle.test.mjs`。

4-8の前衛・帰還は `lib/road-seedling-melee.ts` が描画専用の位置と近接攻撃の再生順を管理し、`RoadMotion` が歩行・衝突回避を担当する。待機中の近接ダメージは表示HPと倒れる姿勢に着弾時から反映する。完了後は `restorationHandoffState` / `restorationVisualInput` が元の戦闘画面を一時的に保持し、`ChapterRoadPainter` の描画完了通知で帰還画面に切り替える。再生待ちや帰還は戦闘計算・セーブに書き戻さない。テストは `tests/road-seedling-battle.test.mjs` / `tests/restoration-handoff.test.mjs`、実画面と残課題は上記の試作記録を参照。

4-10の帰路は `/sprite-lab/storybook/founding-road` で作業ごとの演出を比較する。本編の既定表示と完了待ちに接続し、`/sprite-lab/storybook/founding-road-phone` で一時データを使って帰還会話への遷移を確認する。選択位置は `app/sprite-lab/storybook/adventure-review-points.ts`、描画専用の手渡しは `lib/road-founding-handoff.ts`・`lib/road-founding-queue.ts`、積荷の位置と残数は `lib/road-founding-cargo.ts`、受け取り手の出入りは `lib/road-founding-recipient.ts`、中断時の荷物は `lib/road-founding-drop.ts`、待機位置は `lib/road-founding-formation.ts`。検査は `tests/road-founding-phone-handoff.test.mjs` / `tests/road-founding-handoff.test.mjs` / `tests/road-founding-drop.test.mjs`。現状と残課題は [試作記録](../../art/storybook-founding-road-draft-20261029.md)。汎用の仲間の遊歩は `lib/road-roaming.ts`、連続した座標と衝突回避は `lib/road-motion.ts` にある。

同見本の倉庫到着と暗転は `lib/road-founding-arrival.ts`、帰還会話の表示は `app/sprite-lab/storybook/founding-return-review.tsx`。`tests/road-founding-arrival.test.mjs` は画像と切替時刻、`tests/storybook-founding-review.test.mjs` は進行と待機を検査する。冒険見本の再生位置と初期化は `adventure-review-points.ts`・`adventure-restart.tsx`。

4-9の最後のタップ後、アリアが荷車へ合流して退出する演出は `lib/storybook/transplant-departure-exit.ts`、確認見本は `app/sprite-lab/storybook/transplant-exit-review/`。押し姿勢の表示は `app/storybook/transplant-night.css`、待機と移動の同期は `tests/storybook-transplant-night.test.mjs`。

4-9でリコが持つ苗籠は `lib/road-transplant-basket.ts`、置き場所は `lib/road-transplant-basket-placement.ts`、回収時の荷車は `lib/road-transplant-cart-catchup.ts`。置き場所の予約と足元の固定は `lib/road-scene-obstacles.ts` / `lib/road-transplant-basket-lock.ts`。`tests/road-transplant-basket.test.mjs` と `tests/road-transplant-basket-placement.test.mjs`、実画面の確認範囲と残件は上記レビュー記録を参照。

1-7出発前の二つの瓶・試料の移し替え・同じ布による比較・管理図と写し・石の台を避ける経路は `lib/storybook/waterway-opening-{cue,cast,items,motion}.ts` と `app/storybook/waterway.css`。`tests/storybook-waterway-opening-study.test.mjs` が接点・寸法・紙の受け渡し・退出と経路を検査する。両幅の全26表示と退出は `docs/art/storybook-late-dialogue-review-20261031.md`。
