# 搬入・往診・追跡の通常進行の確認（2026-10-31）

対象は3-7 `garden-reception`、4-3 `brekka-arrival`、4-4 `glowing-moss-trail`。照合表に残っていた持ち手の接点、通常速度の調査、筆記から追跡への復帰を補った。地理・台詞・報酬・セーブは変更していない。以下の証跡は `work/goal-audit-20261031/` に置く。

## 3-7：フィンと持ち手の接点

立った歩行の2〜5番は揃っていたが、手と荷車の横木に隙間があった。`lib/road-garden-reception.ts` の荷車に対する足位置を `{x:169,y:35}` から `{x:139,y:30}` へ調整した。人物・荷車の画像や縮尺を変えず、荷車と積み荷の追従も同じ基準を使う。

PC幅と390×844 CSS pxで修正前18秒・修正後8秒を約120ms間隔で記録し、脚の切り替えと手元を比較した。修正後は立位から押し歩きへ移っても体格が大きく変わらず、両手が横木に接したまま荷車が進む。証跡は `reception-grip-fixed-{pc,mobile}.json` と同名の `-contact.png`。

本編と同じ `PhoneFrame` の一時データを開く `/sprite-lab/storybook/garden-reception-phone` を追加した。両幅で帰着手前から展示台の裏、最後の景色を保持したクリア画面、帰還会話「予定と違う手」の冒頭へ進めた。PCは `reception-arrival-pc.json`、スマホ幅は `reception-arrival-mobile-final.json`、帰還は `reception-return-{pc,mobile}.json`。`reception-arrival-mobile.json` は準備直後の操作が反映されず冒頭を記録したため、帰着の証拠に使わない。

## 4-3：運搬と5回の調査

`/sprite-lab/storybook/brekka-arrival-phone` で、PC 1280×900と390×844 CSS pxを通常速度・連続手助けなしで最初からクリアまで再生した。画像確認に一時停止を挟む分割記録であり、中断なしの一本の動画ではない。各幅317枚、約300ms間隔の画像と画面本文を `brekka-normal-{pc,mobile}.json` に記録した。

最初の4回は往診先に荷車と仲間を残してフィンが控えを読み、荷車へ戻る。最後は暗転して醸造所へ移り、机の帳簿と向こう側の作業者を表示する。運搬から戦闘への切り替え、戦闘後の持ち手への復帰、到着時に四人が収まること、クリアから帰還会話「元気になるために」の冒頭への接続を両幅で確認した。人物が台や荷車へ埋まる、頭や足元が切れる、大きく体格が跳ねる問題は今回の抜粋で見つからなかった。

全体の抜粋は `brekka-normal-{pc,mobile}-contact.png`。PCの運搬・戦闘・控え・帳簿の拡大は `brekka-normal-pc-focus.png`、帰還冒頭は `brekka-normal-return-{pc,mobile}.json`。全歩行コマの手元を一枚ずつ網羅する記録ではない。

## 4-4：追跡・筆記・再開

`/sprite-lab/storybook/moss-trail-phone` を同じ両幅・通常速度・連続手助けなしで、冒頭から分岐・追跡終了・クリア・帰還会話「持ち帰った道順」まで再生した。PC275枚、スマホ幅276枚を約250ms間隔で記録した（`moss-trail-normal-{pc,mobile}.json`）。全体は一時停止を挟む分割記録である。青い布のある分かれ道への暗転、御者と荷車が先行し二人が間隔を保つこと、車輪の回転と踏み替え、画面端と会話欄との間隔を確認した。

確認用の一時停止中も掛け合いの自動送りは進むため、分割記録だけで筆記のタイミングを証明しない。帰着手前の一時データから、両幅で筆記区間を一時停止せず約150ms間隔で追加記録した（`moss-trail-note-flow-{pc,mobile}.json`、PC70枚・スマホ幅71枚）。レオンの「曲がるたびに書いてる」の表示で二人が立ち止まり、手帳の姿勢になり、アリアの返事で通常の歩きへ戻って荷車を追う。姿勢間の頭身の大きな跳ねは見られなかった。`moss-trail-note-flow-{pc,mobile}-focus.png` はその抜粋である。

帰還冒頭は `moss-trail-normal-return-{pc,mobile}.json`。前後の全会話の新規通し確認ではなく、既存の会話記録へ冒険との接続を補うもの。

## 検証と残る範囲

荷車・控え・帳簿・到着待ち・追跡・筆記の連動に関する64テスト、型検査、変更した実装・テスト・見本ルートのlint・整形、`vinext build` が成功。ログは `reception-brekka-trail-{tests,types,lint,format,build}.log`。ビルドには既存のVite設定とチャンク容量等の警告がある。確認タブで取得した警告・エラーは0件（`reception-brekka-trail-browser-log.json`）。

スマートフォン幅はブラウザーのCSS pxであり実機とは区別する。今回で全37ステージの完了とはせず、[照合表](storybook-verification-matrix-20261031.md)に残る会話記録の判定、全体の品質検査とGitHubへの集約を続ける。確認済みの持ち手・通常調査・筆記の区間を無条件の再撮影待ちへ戻さない。
