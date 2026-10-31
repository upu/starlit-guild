# 画像・動画・音の素材と生成物

絵本調の共通小物15種類は `scripts/build-storybook-common-props.mjs` で登録する。原本・全プロンプト・再利用元・ハッシュは [制作記録](../../art-generation/storybook-common-props-20261031.json)。旧表示の可視範囲と底の接点に収める値は `public/storybook-study/common-props-v1-metrics.json`、検査は `tests/storybook-common-props.test.mjs`。適用表は `lib/storybook/shared-prop-art.ts`、旅行荷物の描画は `app/storybook/common-props.css`。

1-9達成後の空の点検口・夕暮れの塔前・開いた扉と、灯り・籠運び・低い着座の再登録は `scripts/build-storybook-waterway-completion.mjs`。上を指す管理人2姿勢は `scripts/build-storybook-keeper-motions.mjs keeper-tower-signal-v1`。原本・全文プロンプト・既存素材の登録元は [制作記録](../../art-generation/storybook-waterway-completion-20261031.json)、実表示と検査は [確認記録](../../art/storybook-waterway-completion-review-20261031.md)。

1-6の瓶を持つアリアの昼用姿勢は `scripts/build-storybook-forest-handheld.mjs` で登録する。原画と生成指示は `docs/art-generation/storybook-forest-jar-20261030.json`。
帰還会話で瓶から苔を移す姿勢と開いた瓶は `scripts/build-storybook-forest-sample.mjs` で登録する。原画と生成指示は `docs/art-generation/storybook-forest-sample-20261030.json`。
森の苔を木べらで運ぶ立位と４歩の原画は `scripts/build-storybook-forest-carry.mjs` で登録する。生成指示とハッシュは `docs/art-generation/storybook-forest-carry-20261030.json`。
2-7のミラの受け取り姿勢は `scripts/build-storybook-mira-workshop-reach.mjs`。原画と生成指示は `docs/art-generation/storybook-mira-workshop-reach-20261030.json`。

1-9のレオンの籠を持った向き直りは `scripts/build-storybook-leon-basket-turn.mjs` で登録する。生成の参照・指示と採用姿勢は `docs/art-generation/storybook-leon-basket-turn-20261029.json`、接点と退避は `tests/road-moss-removal-actions.test.mjs`。

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [素材の種類別案内](../../art/README.md) から原本へ。配信用生成は [背景](../../../scripts/optimize-scenery.mjs)、[スチル](../../../scripts/optimize-story-stills.mjs)、[動画](../../../scripts/optimize-story-videos.mjs)、[道中画像](../../../scripts/optimize-road-art.mjs)、[共有カード](../../../scripts/generate-social-card.mjs)、[BGM](../../../scripts/optimize-bgm.mjs)。背景・スチル・動画・道中画像・BGMのハッシュ・manifest・ロック・一時ファイル経由の置き換え・画像サイズ設定の検査は [共通処理](../../../scripts/asset-pipeline.mjs) にまとめる。`npm run assets:optimize` が全種類の配信用生成を順に実行し、`dev`・`build` の前にも自動で走る。表示条件は該当する `lib/`・`app/`。
- **仕様**: [アート・音の資料](../../art/README.md)。制作記録と現行の表示条件を区別する。
- **アリア・ミラの動作コマの整列**: [共通の整列処理](../../../scripts/prepare-mini-animation.mjs)を[アリア](../../../scripts/prepare-aria-animation.mjs)・[ミラ](../../../scripts/prepare-mira-animation.mjs)から実行 → [道中画像の配信生成](../../../scripts/optimize-road-art.mjs)。原本・セルと足元・静止ミニキャラの切り出しは [動作画像](../../art/hero-animation-art.md) を参照。
- **検証**: 変更した種類に対応する `npm run images:check` / `stills:check` / `videos:check` / `road-art:check` / `social-card:check` / `music:check` と、該当画面・再生を確認。

旅団のドット絵調素材は `assets/source/home-pixel/` → [配信生成](../../../scripts/build-home-pixel.mjs) → `public/home-pixel/`。[制作と確認](../../art/guild-lab.md) に指示・フレーム規約・検証を記録する。

絵本調の見本は `app/sprite-lab/storybook/`。原本は `assets/source/storybook/`、人物の配信生成は `scripts/build-storybook-study.mjs`・`scripts/build-storybook-contacts.mjs`、確認状況は [舞台見本](../../art/storybook-stage-study.md)。`/sprite-lab/storybook/mobile` は幅390pxの表示確認用で、本編の保存データを使わない。

同見本の机・箱は `scripts/build-storybook-props.mjs` で配信生成し、見本内のCSSで切り替える。
同ビルダーの `chair-v1` は人物比較の屋内座位用。`characters.tsx` の座位条件と `storybook-seat-chair` の共通配置で腰・足元を揃える。
二人の会話4姿勢は `scripts/build-storybook-conversation.mjs`。原本 `conversation-pair-v1.png` から同じ足元・人物ごとの単一縮尺で配信し、`conversation-metrics.json` に登録値を出力する。
アリアの挨拶・驚きの追加姿勢は `node scripts/build-storybook-work.mjs aria reaction v1` で登録し、見本の `conversation-actors.css` から会話フレーム1・2へ接続する。
署名と紙を支える姿勢は同ビルダーの `aria paper v1`。屋内36行目の `data-paper-study` 内だけで筆記17/18・停止保持14/15へ適用する。
紙運搬歩行は `node scripts/build-storybook-walk-strip.mjs aria v1 paper-walk` で停止姿勢の頭幅に登録し、同じ36行目だけ会話8/9/22/23へ接続。手位置は `lib/storybook/paper-cue.ts`。
会話見本への立位4姿勢の接続は `app/storybook/conversation-actors.css`。対応外の動作は元の素材を使用し、段階的な置き換えの確認範囲を舞台見本の記録へ残す。
二人の歩行コマの再生・停止・コマ送りは `app/sprite-lab/storybook/walk-review.tsx`。人物を選び、立位と並べて本編へ採用する前のつながりを確認する。
アリアの通常歩行は `scripts/build-storybook-aria-walk.mjs` から `aria-walk-v1.webp` と登録寸法を生成し、会話見本へ接続する。運搬歩行・冒険への適用状況は舞台見本の記録を参照。
`scripts/build-storybook-contacts.mjs` は同じ登録済み4コマから `leon-walk-v1.webp` も生成し、会話見本の通常歩行へ接続する。運搬歩行とは分けて確認する。
背景上の移動と立位への復帰は同ディレクトリの `walk-travel.tsx`・`use-walk-travel.ts`。任意時刻へ移動して足元と背景の縮尺を比較する。
取引先の4姿勢は `scripts/build-storybook-merchant.mjs`。`poses keeper` 引数では屋内の大家の会話4姿勢を生成する。8姿勢・4姿勢の透明境界抽出は `scripts/storybook-sprite-bounds.mjs` を共用する。

会話の舞台は `assets/source/story-stage/` → [配信生成](../../../scripts/build-story-stage-art.mjs) → `public/story-stage/`。[素材と演出](../../art/story-stage.md) に原本・プロンプト・共通縮尺を記録する。第二章〜第四章の素材は `scripts/build-story-stage-later.mjs` が切り出し・共通縮尺への登録を担当する。`story-stage-art:check` で鮮度を確認する。

冒険の5人はホームの歩行と `assets/source/adventure-pixel/` の専用動作 → [配信生成](../../../scripts/build-adventure-pixel.mjs) → `public/adventure-pixel/`。待機・押し引きの切り出しは `scripts/adventure-travel-frames.mjs`、会話と共通の頭幅・接地合わせは `scripts/hero-pose-registration.mjs`。[冒険のミニキャラ](../../art/adventure-pixel.md)を参照。`adventure-art:check` で鮮度を検査する。


3-7の井戸・厨房と展示台裏の背景、縄・留め具・荷車へ掛ける布は `scripts/story-stage-reception-art.mjs` で登録する。背景の寸法と素材の透明領域は `tests/story-stage-reception.test.mjs`、原本の出自は `docs/art-generation/story-stage-reception-20261023.json`。
冒険見本の二人の立位・通常歩行は `app/phaser/road-storybook-poses.ts`。描画専用の `storybookHeroes` 指定で切り替え、`chapterRoadAssets` が必要素材を読み込む。作業・運搬・戦闘の未置換範囲は舞台見本へ記録する。

フィンの通常歩行と包帯を巻いた夜道の歩行は `scripts/build-storybook-finn-balanced.mjs` で足元と頭位置を揃える。新しい原画と参照は `docs/art-generation/storybook-finn-walk-proportions-20261028.json`、頭幅・各コマの高さは `tests/road-berne-journey.test.mjs` で確認する。

4-8のメリルの戦闘姿勢は `scripts/build-storybook-merrill-battle.mjs`、倒れたコロタケは `scripts/build-storybook-korotake-rest.mjs`。配置・会話との接続は `lib/road-seedling-battle.ts` と [試作記録](../../art/storybook-merrill-seedlings-adventure-draft-20261029.md)、生成指示は `docs/art-generation/storybook-seedling-battle-20261029.json`。

4-3前のフィンの飲酒姿勢も同ビルダーで登録し、`app/storybook/brekka-dining.css` から表示する。頭幅・足元と杯の配置は `tests/storybook-brekka-dining.test.mjs`、原画・採否は `docs/art-generation/storybook-finn-drinks-proportions-20261029.json`。

夜道の荷車押しは同スクリプトの `night-push-balanced-v4` で静止姿勢を登録し、`scripts/build-storybook-finn-night-push-balanced-v5.mjs` で交互に踏み替える４歩を合成する。生成履歴は `docs/art-generation/storybook-finn-night-push-proportions-20261028.json`、接地と包帯の手の位置は `tests/road-night-bridge.test.mjs` で確認する。

夜道で包帯を巻いたフィンの戦闘姿勢は `scripts/build-storybook-finn-balanced.mjs night-battle-balanced-v2`。原画と生成指示は `docs/art-generation/storybook-finn-night-battle-proportions-20261028.json`、基準の足元と頭位置は `tests/road-night-bridge.test.mjs` で確認する。
レオンの引く歩行見本は `scripts/build-storybook-transport.mjs` で4コマを登録し、冒険見本の `applyWorkPose` から接続する。アリアの押す生成案は未採用。
アリアの押す4コマは `scripts/build-storybook-aria-push.mjs`。通常歩行の各姿勢から個別生成し、同じ姿勢の高さ・足元へ登録する。見本内の接続と残る細部の差は舞台見本に記録する。
屋内見本の低い机 `office-table-v1` も `build-storybook-props.mjs` で384×128へ登録し、既存のdining-table表示枠に適用する。椅子は同見本に限り `chair-v1` を使う。
レオンの荷札確認見本は `scripts/build-storybook-work.mjs` が立位基準の共通倍率で登録する。`road-storybook-poses.ts` のworkAssetsが見本の作業素材を選ぶ。
絵本調の屋内見本の紙は `lib/storybook/indoor-cue.ts` で新座位への補正と保持・机上の共通寸法を指定する。`tests/storybook-indoor-props.test.mjs` が机上範囲・原シーン不変・手放した際の寸法を確認する。

レオンの紙運搬歩行は `node scripts/build-storybook-walk-strip.mjs leon v2 paper-walk`。停止姿勢に合わせた共通倍率で、頭幅と最大身長を制限する。屋内36行目だけに適用し、`paper-cue.ts` に手位置を登録する。v1は不採用、理由は生成記録を参照。

ミラの紙運搬歩行は `node scripts/build-storybook-walk-strip.mjs mira v1 paper-walk`。`paper-cue.ts` の任意 `carryWalkFrames` で試作限定の4コマ周期を指定。生成記録は `storybook-mira-paper-walk-20261025.json`。

フィン着座受け渡しは `node scripts/build-storybook-work.mjs finn paper-seat v1`。`paper-cue.ts` が屋内36行目に準備・終了時刻を追加し、`finn-actors.css` が29/25を新素材へ接続する。生成記録は `storybook-finn-paper-seat-20261025.json`。

冒険見本の横連続路面は `public/storybook-study/village-lane-loop-v1.png`。原本は同名の `assets/source/storybook/`、生成プロンプトは `docs/art-generation/storybook-village-lane-loop-20261025.json`。built-in image_genで生成した不透明素材をそのまま配置する。

倉庫の独立素材は `public/storybook-study/warehouse-landmark-v1.png`。原本と生成記録は `assets/source/storybook/warehouse-landmark-v1.png`、`docs/art-generation/storybook-warehouse-landmark-20261025.json`。背景から分離した透過素材として冒険見本に配置する。

手描き塔背景は `public/storybook-study/tower-base-v1.png`。本編適用の一覧は `lib/storybook/presentation.ts`、苔の発光位置は `app/storybook/stage-art.css`。レオンの挨拶・驚き・しゃがみは `app/storybook/reactions.css` と `leon-reaction-v1.webp`。`node scripts/build-storybook-work.mjs leon reaction` が同じ倍率・足元で登録する。

待ち合わせ・夕方の帰路・街の出口は `meeting-path-v1.png` / `meeting-dusk-v1.png` / `town-exit-v1.png`。荷造り2名は `node scripts/build-storybook-work.mjs aria packing` と `leon packing`。`app/storybook/packing.css` と `lib/storybook/travel-packing.ts` が姿勢、手荷物への向き、出発の引き手、荷直し終了順を扱う。

手描き荷車は `node scripts/build-storybook-cart.mjs` で元の透明余白と車輪の足元を保持して生成する。会話は `app/storybook/stage-art.css`、冒険は `lib/road-storybook-work.ts` が素材を選び、`lib/road-cart-layout.ts` が描画された手と引き手の接点を合わせる。苗の専用荷車は別素材のまま。

1-8達成後の排水口の夕暮れ版は `node scripts/build-storybook-waterway-dusk.mjs`。採用済みの昼の構図を編集した原本を拡縮せずPNGへ登録し、他の作業日の背景を置き換えない。全文プロンプトと編集対象は `docs/art-generation/storybook-drain-cleared-dusk-20261030.json`。

同じ夕暮れ版に翌日の点検口と足場を合わせた現行版は `node scripts/build-storybook-waterway-dusk.mjs drain-inspection-dusk-v1`。管理人の印付け4姿勢は `node scripts/build-storybook-keeper-motions.mjs keeper-hatch-mark-v2` で、基準の立位と同じ倍率・足元へ登録する。旧版は保持し、現行の配信・原本・全生成指示は `docs/art-generation/storybook-waterway-hatch-mark-20261031.json` に記録する。印そのものはCSSの短い線2本で描く。

1-9の可動石蓋と蓋を描き込まない昼の排水口は `node scripts/build-storybook-inspection-lid.mjs`。把持・半立位・保持と専用の4歩行コマは `build-storybook-keeper-motions.mjs keeper-hatch-open-v1` / `keeper-hatch-carry-walk-v2`。原本・配信画像・全生成指示・比較用の旧歩行は `docs/art-generation/storybook-waterway-opening-20261031.json` にまとめる。旧来の閉じた背景と蓋を立て掛けた背景は比較用に保持する。

1-8冒頭の空荷車・取引先の人の8姿勢は `node scripts/build-storybook-waterway-unload.mjs`。荷車は既存の道具荷車から荷物だけを外した原本を車輪の接地へ登録し、人物は既存の128pxセルを拡縮せず梱包する。縄は既存の `prop-rope-coil.webp` の同じバイトを使う。編集指示と参照元は `docs/art-generation/storybook-waterway-unloading-20261030.json`。

リコの後ろ髪は scripts/build-storybook-lico-ponytail.mjs の共通素材へ揃える。登録場面の標本保持・ラベル書きは scripts/build-storybook-founding-return.mjs が lico-label-ponytail-v3.png を配信素材へ登録する。生成履歴は docs/art-generation/storybook-lico-label-hair-20261026.json。

4-7の冒険から帰還会話へつなぐリコの着座中間姿勢は `scripts/build-storybook-lico-records-sit.mjs` で共通の足元・倍率に登録する。原本と指示は `docs/art-generation/storybook-lico-records-sit-20261028.json`、描画は `lib/road-lico-records.ts`。

後ろ髪をさらに細いポニーテールへ揃えた最終素材は `scripts/build-storybook-lico-slim-hair.mjs`。旧アトラス生成スクリプトを実行した場合は最後にこのスクリプトを実行する。立ち・歩行・作業・戦闘と章固有のポーズを既存の配信名へ梱包し、原画とプロンプトは `docs/art-generation/storybook-lico-slim-hair-20261027.json` へ記録する。

胡桃の幕間はscripts/build-storybook-walnuts.mjs。二人の8姿勢をそれぞれ立位基準の共通倍率で登録し、菓子三色・半分・底面・欠片、低いベンチ、平らな布、水筒を透明WebPへ切り出す。採用した原画と不採用の座位サイズ、再制作したベンチ・布の理由はdocs/art-generation/storybook-walnuts-20261027.json。配信CSSはapp/storybook/walnuts.css。

五人の冒険素材は scripts/build-storybook-road-crew.mjs、苗入り荷車は scripts/build-storybook-seedling-cart.mjs。冒険の手描きスライムは scripts/build-storybook-road-slime.mjs が会話の採用素材を敵の足裏基準へ梱包する。素材の採否と未解決は docs/art-generation/storybook-adventure-crew-20261027.json。冒険への展開対象は lib/storybook/adventure.ts、確認用の五人の運搬・戦闘は /sprite-lab/storybook/crew。

1-1・1-2の交易路の荷台は `scripts/build-storybook-trade-cart-body.mjs` で車輪を分離した原画から生成する。原画・生成指示・ハッシュは `docs/art-generation/storybook-trade-cart-wheels-20261029.json`、回転する車輪は苗の荷車と同じ既存素材を使う。

冒険の土を埋め戻す姿勢は scripts/build-storybook-earthwork.mjs。五人の立位較正と3作業姿勢を同じ倍率で梱包し、低いミラ・リコはv2原画を使う。土の面はearthwork-patch-v1.webp。生成・再制作の記録はdocs/art-generation/storybook-earthwork-20261027.json。表示用の選択と配置はlib/road-storybook-work.ts、検査はtests/storybook-earthwork.test.mjs。

冒険の通常戦闘エフェクトは scripts/build-storybook-road-effects.mjs が矢・斬撃・光点・土の粒を4セルの透明アトラスへ梱包する。光点を塊から分離した再制作とプロンプトはdocs/art-generation/storybook-road-effects-20261027.json。描画はapp/phaser/road-painted-effects.ts。専用の歌・煙・キノコと人形指示は別の既存処理であり、通常エフェクトだけの変換を全体の統一済みとはしない。

2-8の家の人・子どもと寝台・台所の人、および2-9の帽子をかぶる運び手と持ち運び用の小物はscripts/build-storybook-households.mjs。原画と全プロンプトはdocs/art-generation/storybook-households-20261027.json、背景はstorybook-household-backgrounds-prepared-20261027.json。人物はセルごとに拡大せず、足元を基準に共通倍率で梱包する。

3-1の街道・ベルネの門・フィンの荷物運搬は `scripts/build-storybook-berne-journey.mjs`。原画とプロンプトは `docs/art-generation/storybook-berne-journey-20261027.json`、実表示の確認は `docs/art/storybook-berne-road-review-20261027.md` を参照。

3-2のベルネ往診は `assets/source/storybook/berne-calls-street-v1.png` を同名の `public/storybook-study/` へ配置する。演出と経路は `lib/road-berne-calls.ts`、生成条件と実表示の確認は `docs/art-generation/storybook-berne-calls-20261027.json` と `docs/art/storybook-berne-calls-review-20261027.md` を参照。

3-3の塔の石組み調査は `lib/road-berne-foundation.ts`。根は `scripts/build-storybook-foundation-roots.mjs` で梱包し、生成条件は `docs/art-generation/storybook-foundation-roots-20261027.json`、実表示の確認は `docs/art/storybook-berne-foundation-review-20261028.md` に記録する。
