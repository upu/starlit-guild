# 冒険画面の描画・タップ

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [表示用投影](../../../lib/adventure-presentation.ts) の `adventureFrame` / `adventureAction` → [DOM操作](../../../app/map-stage.tsx) の `MapStage` → [Phaser接続](../../../app/phaser-adventure.tsx) の `PhaserAdventure`。味方の戦闘時の表示間隔は [隊形](../../../lib/road-party-formation.ts)、移動・作業コマの切替は [道中の姿勢](../../../app/phaser/road-poses.ts)。Canvas描画は [app/phaser/](../../../app/phaser/)。
- **仕様**: [Phaser冒険画面](../phaser-adventure.md)、[横スクロール戦闘](../../gameplay/scrolling-battle.md)。描画側へ進行・保存の判定を重複させない。
- **位置の連続性**: [道中の移動演出](../../../lib/road-motion.ts) の `RoadMotion` を `ChapterRoadPainter` ごとに保持し、隊形・作業地点・カメラの切替を補間する。表示位置はエフェクトと回復タップにも共有する。[移動検査](../../../tests/road-motion.test.mjs) で襲撃・撃破・次の地点への遷移、静止条件、表示位置への入力を確認する。
- **荷車の隊列**: [運搬時の配置](../../../lib/road-carrier-formation.ts) で引き手・押し手の画面上の位置と奥行きを決める。[運搬検査](../../../tests/road-transport.test.mjs) で人数・戦闘後の復帰・荷車との位置関係を確認する。
- **検証**: [投影・入力](../../../tests/adventure-presentation.test.mjs)、[描画部品](../../../tests/map-render.test.mjs)、[動作画像](../../../tests/hero-animation.test.mjs)、[リコの歩行・運搬](../../../tests/road-poses.test.mjs)。道中や第三章の画面は [手動テスト](../development.md#ローカルの手動テスト) の `chapter-road.browser.mjs` / `chapter-three.browser.mjs`。ブラウザー表示と実機は別に確認。
- **スマホの鮮明さ**: [描画解像度](../../../app/phaser/adventure-resolution.ts) でCanvas・カメラを高密度化し、[人物の縮小キャッシュ](../../../app/phaser/road-sprite-filter.ts) に描画密度を渡す。[解像度検査](../../../tests/adventure-resolution.test.mjs) / [縮小検査](../../../tests/road-sprite-filter.test.mjs) と、`TEST_DPR=3` を指定した道中のブラウザー検査でサイズ・リサイズ・タップを確認する。

作業ポイントの説明札は [作業画像の下端への追従](../../../app/phaser/road-work-caption.ts) を参照。

旅団は [全身コマのドット絵調描画](../../../app/phaser/home-room-art.ts)。[拡大・パン・タップ](../../../app/phaser/home-room-view.ts)、[動作](../../../lib/home-actor.ts)、[生活と経路](../../../lib/home-room-life.ts)、[マス配置](../../../lib/home-room-layout.ts)、[制作記録](../../art/guild-lab.md) を参照。部位を切り離す合成試作は廃止した。


作業ポイントの画像は [全作業文の対応](../../../lib/road-worksite-catalog.ts) → [素材と動作](../../../lib/road-worksite-art.ts) → [表示](../../../lib/chapter-road-work-look.ts)。[全章の点検記録](../../art/worksite-audit.md) と [未登録検査](../../../tests/road-worksites.test.mjs)、`tests/road-worksites.browser.mjs` で追加漏れと小表示を確認する。

歩行の制作見本は [見本の姿勢](../../../lib/home-walk-study.ts) → [比較ページ](../../../app/sprite-lab/walk/study.tsx) → [5人の実素材比較](../../../app/sprite-lab/walk/pilot.tsx)。制作ガイドにだけ関節描画を使い、ゲーム内の全身コマ切替は維持する。検査は `tests/home-walk-study.test.mjs` / `tests/home-walk-study.browser.mjs`。

作業台の制作見本は [手元と上半身の動き](../../../lib/home-work-study.ts) → [無地モデルと台](../../../app/sprite-lab/work/figure.tsx) → [再生と4姿勢](../../../app/sprite-lab/work/study.tsx) → [5人の実素材比較](../../../app/sprite-lab/work/residents.tsx)。[作業コマ生成](../../../scripts/home-work-frames.mjs) で同じ縮尺と足元を揃え、旅団と同じ `*-work.webp`・4姿勢の時刻を使う。事務机も同じ4コマを共用し、比較ページで台を切り替えられる。お茶と [再生処理](../../../app/sprite-lab/study-player.ts) を共有する。検査は `tests/home-work-study.test.mjs` / `tests/home-work-study.browser.mjs`。

菜園の制作見本は [水やりの4姿勢](../../../lib/home-garden-study.ts) → [無地モデルと植物](../../../app/sprite-lab/garden/figure.tsx) → [再生・左右・小表示](../../../app/sprite-lab/garden/study.tsx)。[5人の実素材比較](../../../app/sprite-lab/garden/residents.tsx) と旅団で `*-garden.webp`、[注ぎ口と水滴](../../../lib/home-garden-water.ts) を共用する。作業と共通の配信生成で足元を揃える。保存・生産の判定は既存処理のまま。検査は `tests/home-garden-study.test.mjs` / `tests/home-garden-study.browser.mjs`。

お茶・会話の制作見本は [座位とカップの軌跡](../../../lib/home-tea-study.ts) → [2人と家具の描画](../../../app/sprite-lab/tea/figure.tsx) → [再生・姿勢一覧](../../../app/sprite-lab/tea/study.tsx) → [5人の左右向き比較](../../../app/sprite-lab/tea/residents.tsx)。旅団と同じお茶アトラスと4姿勢の時刻を使い、利き手を反転せず切り替える。検査は `tests/home-tea-study.test.mjs` / `tests/home-tea-study.browser.mjs`。

歩行原本は各人の `*-walk-v9-a.png`（1〜4コマ）と `*-walk-v9-b.png`（5〜8コマ）。ミラ・フィンの後半だけは色味と頭身を合わせた `*-walk-v10-b.png` を使う。[読み取り](../../../scripts/home-walk-frames.mjs) の `walkSourceName` → [配信画像の生成](../../../scripts/build-home-pixel.mjs) を通す。比較ページの全8コマ一覧は配信画像をそのまま使い、クリックした位相で停止する。2人の頭幅・髪色の回帰検査は `tests/home-walk-identity.test.mjs`。

施設アイコンは [座標と型](../../../lib/home-room-markers.ts) → [React操作](../../../app/home-room-markers.tsx) → `app/phaser/home-room-game.ts` のカメラ投影。着席時の頭幅合わせと椅子・道具の位置は [表示寸法](../../../lib/home-room-presentation.ts)。実画面の幅・担当・拡大は `tests/guild.browser.mjs`、茶席の反応と回転なしの確認は `tests/home-room.browser.mjs`。
