# 第二章の道標・工房の会話の補足（2026-10-31）

2-5前11・後15表示、2-6前11・後18表示、2-7前22表示を、PC幅1280×720とスマートフォン幅390×844 CSS pxで順次再生した。各会話の最後の操作も含む。計154表示の訪問と506枚の記録であり、一本の連続動画やスマートフォン実機の記録ではない。2-7後の確認は[既存の補足](storybook-early-dialogue-gaps-review-20261031.md)と[工房の受け渡し](storybook-workshop-handoff-review-20261030.md)を維持する。

## 今回の修正

- 2-5後、包みの中を確かめるアリアが道標の方へ進み、レオンと重なっていた。包みの横へしゃがむ位置に変更し、途中の足位置の距離も検査した。
- 二つの菓子包みが大きすぎ、一方が厚い畳み布になっていた。小さな同寸の包みを使い、中身がなくなる台詞で空の包みに切り替える。切り替えで位置や大きさを変えない。
- 菓子を抱えた小さな人形が枝へ跳ねる10表示目に、人形自体の演出がなかった。菓子を持った人形が木々の方へ移動して画面外へ抜ける演出を追加し、その終了を待って会話を進める。道標と二つの包みは残す。

修正は `lib/storybook/signpost-cue.ts`。必要な人形の素材は `stage-images.ts` で先読みする。元のシナリオ・地理・保存データは変更していない。人形の小さい表示の画像補間も比較したが、改善を確認できなかったため実験は採用せず、既存の人形素材を維持した。

## 実画面で確かめた範囲

2-5は人形と道標の登場、お辞儀、包みを調べる位置と立位への復帰、菓子を持って逃げる動き、退出を両幅で確認した。2-6は工房の前の人数と大型ゴーレムの収まり、薬箱、食べ物と布の受け渡し、膝をつく姿勢とお辞儀、会話の終わりを確認した。既存の一枚絵への切り替えを維持している。2-7前は登場、身構えと立位への復帰、人物同士の間隔と最後の操作まで確認し、この範囲に新たな修正箇所は見つからなかった。

記録は `work/goal-audit-20261031/chapter-two-{pc,mobile}-{spinning-signpost-departure,spinning-signpost-return,begging-golem-departure,begging-golem-return,sweet-blockade-departure}.json` と参照PNG。`puppet-dialogue-audit.json` で10組・154表示・506枚のページ番号、画像寸法、最後の操作後の状態を検査した。要所の比較画像は各IDの `-pc-contact.png` / `-mobile-contact.png`。通常の会話操作によるReaderの再生で、本編の完了画面の再検証へ読み替えない。

関連1,307テスト、型検査、変更箇所のlint、ビルドが成功した。ログは `puppet-dialogue-{regression,lint,build}.log` と `signpost-return-types.log`。ビルドには既存のVite設定・チャンク容量・ルート分類等の警告がある。確認タブの警告・エラーは0件（`puppet-dialogue-browser-log.json`）。

## フィンの現在の表示の再確認

3-3前の8表示目を開始位置に選び、フィンが歩いて立ち止まる姿をスマートフォン幅で再確認した。修正済みの `finn-walk-balanced-v3.webp` から `finn-conversation-balanced-v3.webp` へ切り替わり、立ち止まって頭だけが大きく戻る様子はなかった。通常のPC幅へ戻した後も、アリア・レオンと並ぶ修正済みの立位を確認した。`finn-current-standing-mobile.png` は移動途中、`finn-current-settled-mobile.png` は停止後、`finn-current-standing-pc.png` と `finn-current-live.json` はPC幅の停止後の記録。これは開始位置を指定した補足確認であり、3-3全体の通し再生ではない。[頭身調整の記録](storybook-finn-proportions-review-20261028.md)も併用する。

第二章のこの会話範囲を再確認待ちへ戻さず、照合表に残る第三・第四章の会話記録の判定と、全体の品質検査・GitHubへの集約を続ける。全体ゴールは未完了。
