# 変更履歴

`package.json` のバージョンが上がったPRだけを、新しい順に1行ずつ記録する。表示バージョンはスタート画面に出るため、番号から「何が入った版か」をたどれるようにする。

- バージョンを上げるPR（`game-change`、または章の区切りの `minor-release`）は、マージ時の版へ1行足す。行はPRタイトルと番号をそのまま転記する。
- バージョンを据え置くPR（`no-game-change`）は記載しない。変更の経緯はGit履歴とIssueを正本とする。
- 判定と番号の規則は [開発と運用](docs/development/development.md#prごとのゲームバージョン) を参照する。

`main` の履歴は `ffc849e`（`0.1.4` 時点）で作り直されている。`0.1.3` 以前のコミットは `main` からたどれないため、PRのhead参照から版を上げたコミットを特定して記載した。`0.1.2` 以前はPRを経由しない `main` への直接コミットのため、PR番号ではなくコミットを示す。

## 0.5.x（第五章の開発）

- 0.5.9: 1-1と1-2に会話舞台と読みやすい台詞表示を追加する (#261)

- 0.5.8: タイトルと設定にDiscordコミュニティへの導線を追加する (#257)

- 0.5.7: 冒険の味方と敵の描画をホームと同じドット絵調にそろえる (#250)

- 0.5.6: 第五章の詳細台本を書き、星章院と倉庫の大家に呼び名を改める（#235）

- 0.5.5: 旅団ホームをドット絵化し、仲間の暮らしと栽培・加工UIを整える (#239)

- 0.5.4: PCで顔アイコンが粗く見える枠線と背景色を外す（#246）

- 0.5.3: キャラ設定画・顔アイコン・スチルとアリア・ミラの動作を更新する（#243）

- 0.5.2: スタート画面の塔の紫の灯りとリンデ周辺の地形を修正する（#238）

- 0.5.1: 薬草などのアイテム登録・購入・冒険中の自動使用を追加する（#236）

- 0.5.0: 第五章計画と旅団の拠点機能の設計案を追加 (#231)

## 0.4.x（第四章の開発）

- 0.4.34: 第四章の会話と作業ポイントを見直し、メリル戦を一戦にまとめる (#223)

| 版 | 日付 | 変更 |
| --- | --- | --- |
| 0.4.33 | 2026-09-27 | 作業説明を作業ポイントのすぐ下に固定 (#222) |
| 0.4.32 | 2026-09-27 | 出発後に作業説明が画面上部へずれる不具合を修正 (#220) |
| 0.4.31 | 2026-09-27 | 作業対象の近くにチャットを避ける説明札を表示 (#216) |
| 0.4.30 | 2026-09-27 | 4-1で手紙を押して進まないようにする (#217) |
| 0.4.29 | 2026-09-27 | 冒険画面上部の周回数表示を削除 (#215) |
| 0.4.28 | 2026-09-27 | 待機中のフィンの台詞を自然にする (#214) |
| 0.4.27 | 2026-09-27 | 作業説明の重なりと道沿いの草の表現を改善 (#213) |
| 0.4.26 | 2026-09-27 | 第四章の判断・対立・場面のつながりを補う (#212) |
| 0.4.25 | 2026-09-27 | 第三章の人物の判断と行動のつながりを明確にする (#211) |
| 0.4.24 | 2026-09-27 | ブレッカでの往診理由と医者の呼び分けを明確にする（[#209](https://github.com/upu/starlit-guild/pull/209)） |
| 0.4.23 | 2026-09-27 | スマホの冒険ミニキャラを鮮明に表示する（[#208](https://github.com/upu/starlit-guild/pull/208)） |
| 0.4.22 | 2026-09-27 | 荷物運搬中の向きと4人以上の隊列を整える（[#207](https://github.com/upu/starlit-guild/pull/207)） |
| 0.4.21 | 2026-09-26 | 第二章の空き瓶運搬とプティ戦の演出を整える（[#205](https://github.com/upu/starlit-guild/pull/205)） |
| 0.4.20 | 2026-09-26 | 冒険中もスキルの付け替えと取り外しを可能にする（[#206](https://github.com/upu/starlit-guild/pull/206)） |
| 0.4.19 | 2026-09-26 | 冒険中の位置飛びを抑え、移動と戦闘に奥行きを加える（[#204](https://github.com/upu/starlit-guild/pull/204)） |
| 0.4.18 | 2026-09-26 | 1-1の導入と幼なじみの会話、納品時の確認を自然にする（[#202](https://github.com/upu/starlit-guild/pull/202)） |
| 0.4.17 | 2026-09-26 | クエスト一覧の章選択を開放済みの章だけにし、開いた直後に展開しない（[#185](https://github.com/upu/starlit-guild/pull/185)） |
| 0.4.16 | 2026-09-26 | 旅の手帳から「旅の記録（旅団の足あと）」の画面をなくす（[#183](https://github.com/upu/starlit-guild/pull/183)） |
| 0.4.15 | 2026-09-26 | 第四章「苦い灯りと、名前のない旅団」を実装する（[#178](https://github.com/upu/starlit-guild/pull/178)） |
| 0.4.14 | 2026-09-26 | 留守中の進行をなくし、冒険は画面を開いている間だけ進める（[#182](https://github.com/upu/starlit-guild/pull/182)） |
| 0.4.13 | 2026-09-26 | Auto-Next: クリア後に次のステージへ自動で出発し、クリア済みステージからも順に進む（[#181](https://github.com/upu/starlit-guild/pull/181)） |
| 0.4.12 | 2026-09-26 | 出発と帰還を画像アイコンに揃える（[#180](https://github.com/upu/starlit-guild/pull/180)） |
| 0.4.11 | 2026-09-25 | 技の呼び名をスキルにし、枠ラベルを「アクティブ」「パッシブ」に短くする（[#179](https://github.com/upu/starlit-guild/pull/179)） |
| 0.4.10 | 2026-09-25 | アルバム一覧のタイトルを絵の上に重ねてコンパクトに表示する（[#177](https://github.com/upu/starlit-guild/pull/177)） |
| 0.4.9 | 2026-09-25 | ボタンの黄色いホバーをマウス操作の標準ボタンだけにし、下部ナビの長押しで文字が選択されないようにする（[#175](https://github.com/upu/starlit-guild/pull/175)） |
| 0.4.8 | 2026-09-25 | 道中の掛け合いで一度表示した会話を繰り返さない（[#176](https://github.com/upu/starlit-guild/pull/176)） |
| 0.4.7 | 2026-09-25 | 従来モードの資料と実装の名残を削除する（[#172](https://github.com/upu/starlit-guild/pull/172)） |
| 0.4.6 | 2026-09-24 | 第四章の詳細台本を作成し、既存の物語にリンデの地名を反映（[#167](https://github.com/upu/starlit-guild/pull/167)） |
| 0.4.5 | 2026-09-24 | 第一章〜第三章の会話の矛盾を直し、布と胡桃の小さな伏線を回収する（[#168](https://github.com/upu/starlit-guild/pull/168)） |
| 0.4.4 | 2026-09-24 | 荷車運搬中のキャラの足元を揃える（[#165](https://github.com/upu/starlit-guild/pull/165)） |
| 0.4.3 | 2026-09-24 | 荷車の運搬を引き手と押し手に分ける（[#162](https://github.com/upu/starlit-guild/pull/162)） |
| 0.4.2 | 2026-09-23 | キャラクター画面で左右スワイプによる切り替えを追加（[#161](https://github.com/upu/starlit-guild/pull/161)） |
| 0.4.1 | 2026-09-23 | キャラクター画面に経験値と次レベルまでの進捗を表示する（[#159](https://github.com/upu/starlit-guild/pull/159)） |
| 0.4.0 | 2026-09-23 | docs: 第四章計画（苦い灯りと、名前のない旅団）を追加（[#155](https://github.com/upu/starlit-guild/pull/155)） |

## 0.3.x（第三章の開発）

| 版 | 日付 | 変更 |
| --- | --- | --- |
| 0.3.10 | 2026-09-22 | 第三章の幕間・ベルネの装備・全9ステージを実装（[#135](https://github.com/upu/starlit-guild/pull/135)） |
| 0.3.9 | 2026-09-22 | 戦闘画面のチャット件数・進捗位置・半透明表示を整える（[#138](https://github.com/upu/starlit-guild/pull/138)） |
| 0.3.8 | 2026-09-21 | 第一章・第二章の会話を自然につなぎ、三人で蜜を取り返す掛け合いを描く（[#131](https://github.com/upu/starlit-guild/pull/131)） |
| 0.3.7 | 2026-09-21 | 初期装備と第二章のパッシブ習得時期を整える（[#129](https://github.com/upu/starlit-guild/pull/129)） |
| 0.3.6 | 2026-09-21 | キャラクター画面の選択・装備・スキルをコンパクトにする（[#128](https://github.com/upu/starlit-guild/pull/128)） |
| 0.3.5 | 2026-09-21 | ショップをアイコン一覧と下部固定の詳細表示にする（[#127](https://github.com/upu/starlit-guild/pull/127)） |
| 0.3.4 | 2026-09-21 | チャット欄のタップによる拡大表示を取り除く（[#126](https://github.com/upu/starlit-guild/pull/126)） |
| 0.3.3 | 2026-09-21 | クエストを縦1列に整理し、選択中の行先を下部に固定する（[#125](https://github.com/upu/starlit-guild/pull/125)） |
| 0.3.2 | 2026-09-21 | チャットをコンパクトにし、透過背景でフィールドを広げる（[#124](https://github.com/upu/starlit-guild/pull/124)） |
| 0.3.1 | 2026-09-20 | 第一章・第二章を完全放置の横スクロール戦闘へ切り替える（[#121](https://github.com/upu/starlit-guild/pull/121)） |
| 0.3.0 | 2026-09-19 | 第三章の計画を追加し、フィンの人物設定を作り直す（[#120](https://github.com/upu/starlit-guild/pull/120)） |

## 0.2.x（第二章の開発）

| 版 | 日付 | 変更 |
| --- | --- | --- |
| 0.2.24 | 2026-09-18 | キャラクター画面のアリア・レオン・ミラの紹介を第一章以降の描写に合わせる（[#109](https://github.com/upu/starlit-guild/pull/109)） |
| 0.2.23 | 2026-09-18 | 第一章・第二章の会話を整える（レオンの敬語、ミラの口癖、未使用の決め台詞、表記統一）（[#108](https://github.com/upu/starlit-guild/pull/108)） |
| 0.2.22 | 2026-09-18 | 採取・運搬に耐性を適用し、作業ゲージを残量表示にする（[#107](https://github.com/upu/starlit-guild/pull/107)） |
| 0.2.21 | 2026-09-18 | スチルとBGMを圧縮し、元素材からの生成を自動化（[#104](https://github.com/upu/starlit-guild/pull/104)） |
| 0.2.20 | 2026-09-18 | 用語集を追加し、章とステージの呼び名を揃える（[#100](https://github.com/upu/starlit-guild/pull/100)） |
| 0.2.19 | 2026-09-17 | 保存形式の従来モード専用フィールドと従来記録の画像素材を削除する（#88 の第四段）（[#99](https://github.com/upu/starlit-guild/pull/99)） |
| 0.2.18 | 2026-09-17 | 旧クエストと旧仲間のデータを削除する（#88 の第三段）（[#98](https://github.com/upu/starlit-guild/pull/98)） |
| 0.2.17 | 2026-09-17 | 従来モードの画面と処理を削除する（#88 の第二段）（[#97](https://github.com/upu/starlit-guild/pull/97)） |
| 0.2.16 | 2026-09-17 | v1〜v3の保存形式と移行コードを削除し、削除の判断基準を定める（[#95](https://github.com/upu/starlit-guild/pull/95)） |
| 0.2.15 | 2026-09-17 | 1-9のスチルをフードを外したアリアと淡紫の塔灯りに差し替え（[#94](https://github.com/upu/starlit-guild/pull/94)） |
| 0.2.14 | 2026-09-16 | 従来記録を読み込まないようにする（#88 の第一段）（[#92](https://github.com/upu/starlit-guild/pull/92)） |
| 0.2.13 | 2026-09-16 | アルバムを正方形3列と軽量サムネイルに変更（[#90](https://github.com/upu/starlit-guild/pull/90)） |
| 0.2.12 | 2026-09-16 | 従来モードを維持しない方針を定め、新規に作られる経路を閉じる（[#89](https://github.com/upu/starlit-guild/pull/89)） |
| 0.2.11 | 2026-09-16 | 第2章の回復・育成バランスとプレビュー用開始データを調整（[#69](https://github.com/upu/starlit-guild/pull/69)） |
| 0.2.10 | 2026-09-16 | 第二章の人形戦を短い連携戦と覆面プティとの決戦に変更（[#66](https://github.com/upu/starlit-guild/pull/66)） |
| 0.2.9 | 2026-09-16 | 1-4のスチルをアップにし、設定画へ合わせる（[#67](https://github.com/upu/starlit-guild/pull/67)） |
| 0.2.8 | 2026-09-16 | ミラの話し方を二つの「〜を」で言い切る形に統一（[#65](https://github.com/upu/starlit-guild/pull/65)） |
| 0.2.7 | 2026-09-15 | 第二章2-7〜2-9とストーリー動画の圧縮・再生を実装（[#63](https://github.com/upu/starlit-guild/pull/63)） |
| 0.2.6 | 2026-09-15 | セーブ記録を削除できるようにする（[#64](https://github.com/upu/starlit-guild/pull/64)） |
| 0.2.5 | 2026-09-15 | 第二章2-3〜2-6：ミラ加入と人形の山賊騒ぎ（[#62](https://github.com/upu/starlit-guild/pull/62)） |
| 0.2.4 | 2026-09-15 | 1-6のスチルを提供画像へ差し替え、可逆WebPで軽量化（[#61](https://github.com/upu/starlit-guild/pull/61)） |
| 0.2.3 | 2026-09-15 | 第二章 Stage 2-1・2-2と技の習得・セットを実装（[#59](https://github.com/upu/starlit-guild/pull/59)） |
| 0.2.2 | 2026-09-15 | 会話の顔アイコンを参照シートに合わせ、台詞ごとに表情を切り替える（[#60](https://github.com/upu/starlit-guild/pull/60)） |
| 0.2.1 | 2026-09-14 | 初回クエストの出発導線を案内（[#56](https://github.com/upu/starlit-guild/pull/56)） |
| 0.2.0 | 2026-09-14 | docs: plan chapter two and start v0.2.0 development（[#53](https://github.com/upu/starlit-guild/pull/53)） |

## 0.1.x（最初の実装と第一章の開発・公開）

| 版 | 日付 | 変更 |
| --- | --- | --- |
| 0.1.22 | 2026-09-13 | クエスト操作を48px列内に収める（[#52](https://github.com/upu/starlit-guild/pull/52)） |
| 0.1.21 | 2026-09-13 | 戦闘に育成差の減衰と複数敵を導入し、第一部後半の育成を必要にする（[#51](https://github.com/upu/starlit-guild/pull/51)） |
| 0.1.20 | 2026-09-13 | 冒険下部の操作列を48pxに圧縮（[#50](https://github.com/upu/starlit-guild/pull/50)） |
| 0.1.19 | 2026-09-13 | 第一章にキャラクター・共有バッグ・装備のお店を追加（[#48](https://github.com/upu/starlit-guild/pull/48)） |
| 0.1.18 | 2026-09-13 | Gate test tools behind explicit runtime environment setting（[#49](https://github.com/upu/starlit-guild/pull/49)） |
| 0.1.17 | 2026-09-13 | Add member-based party names（[#46](https://github.com/upu/starlit-guild/pull/46)） |
| 0.1.16 | 2026-09-13 | Fix dialogue to the lower half of story scenes（[#45](https://github.com/upu/starlit-guild/pull/45)） |
| 0.1.15 | 2026-09-13 | Improve quest retap destination selection（[#44](https://github.com/upu/starlit-guild/pull/44)） |
| 0.1.14 | 2026-09-13 | Implement stage 1 finale and restored tower light（[#43](https://github.com/upu/starlit-guild/pull/43)） |
| 0.1.13 | 2026-09-13 | feat: 第一部1-7・1-8を実装し口癖に合わせて台詞を調整（[#39](https://github.com/upu/starlit-guild/pull/39)） |
| 0.1.12 | 2026-09-13 | fix: 会話の連打を安定させ、枠外クリックでも進められるようにする（[#42](https://github.com/upu/starlit-guild/pull/42)） |
| 0.1.11 | 2026-09-13 | fix: 持ち物から仲間加入用の希少素材欄を削除（[#40](https://github.com/upu/starlit-guild/pull/40)） |
| 0.1.10 | 2026-09-13 | feat: 第一部1-6と行先選択・待機会話を実装（[#36](https://github.com/upu/starlit-guild/pull/36)） |
| 0.1.9 | 2026-09-13 | HPの数値表示を省く（[#38](https://github.com/upu/starlit-guild/pull/38)） |
| 0.1.8 | 2026-09-13 | HPをキャラクターごとに管理する（[#34](https://github.com/upu/starlit-guild/pull/34)） |
| 0.1.7 | 2026-09-13 | fix: iPhoneで開幕の会話ウィンドウが画面外にずれる問題を修正（[#33](https://github.com/upu/starlit-guild/pull/33)） |
| 0.1.6 | 2026-09-13 | 小さく見分けやすい顔アイコンとセリフごとのチャット表示（[#32](https://github.com/upu/starlit-guild/pull/32)） |
| 0.1.5 | 2026-09-13 | 第一部1-4・1-5：塔への寄り道と苔灯の帰り道を実装（[#31](https://github.com/upu/starlit-guild/pull/31)） |
| 0.1.4 | 2026-09-13 | fix: 冒険待機中に同じ会話が繰り返し追加される不具合を修正（[#25](https://github.com/upu/starlit-guild/pull/25)） |
| 0.1.3 | 2026-09-12 | fix: bound story dialogs to mobile viewport and simplify continuation cues（[#23](https://github.com/upu/starlit-guild/pull/23)） |
| 0.1.2 | 2026-09-11 | fix: avoid installed iOS viewport inset bug（`3fd8921`） |
| 0.1.1 | 2026-09-11 | fix: pin mobile navigation to viewport（`8f1cf84`） |
| 0.1.0 | 2026-09-10 | Build Starlit Guild idle RPG with durable player saves（`8511871`・最初のコミット） |
