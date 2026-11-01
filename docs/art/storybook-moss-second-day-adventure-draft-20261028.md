# 4-5 二日目の追跡の冒険見本

用語集の `glowing-moss-trail-next-day`。前日にアリアとレオンが通った醸造所の裏から、四人で空籠の荷車を追う。青い布のある裏通りを通り、荷車が曲がる先を確かめるのは帰還会話の冒頭。既存の地図帳・4-5台本を照合し、地名や経路を追加していない。

`/sprite-lab/storybook/moss-second-day-adventure` と縦長見本で、4-4の背景・御者・荷車・車輪を再利用。四人を荷車の後ろの二列に置き、画面幅に応じて全員が見える範囲で移動する。醸造所の裏から洗い場と青い布のある道へ暗転を挟んで移り、追跡の先は帰還会話に残す。ゲームのセーブや隊員は描画側から変更しない。

PC幅 `work/moss-second-day-fork-pc/` と390×844ブラウザー枠 `work/moss-second-day-fork-mobile/` で隊列と場面転換の前後を確認した。`tests/road-moss-second-day.test.mjs` は両幅の15地点で四人の隊列、画面内の位置、人物同士の距離、背景の順序とセーブ不変を検査する。スマートフォン実機では確認していない。

本編の冒険表示へ接続し、最後の移動と暗転の後に帰還会話へ渡す。帰還会話の分かれ道でも同じ二列を使い、塔の石段まで人物と荷車の縮尺を揃えた。前列の名前は後列の人物を隠さない位置へ置く。スマホ幅では石段上の人物が上端で切れないよう、帰還会話の舞台の拡大を解除した。

帰還会話11行は `work/moss-second-day-sequence-pc/` と `work/moss-second-day-sequence-mobile-fixed/` で順に再生し、石段を上る動きとフィンの退出も確認した。本編と同じ画面の `/sprite-lab/storybook/moss-second-day-phone` では、`work/moss-second-day-phone-handoff-pc/` と `work/moss-second-day-phone-handoff-mobile/` の終盤からクリアと帰還会話への遷移を確認した。

追跡中の序盤と背景切り替え後をPC幅と390px幅で再確認した。両日の通常進行を全15地点まで実行し、敵が現れずHPが変化せず、全滅による休憩にも入らないことを `tests/moss-trail.test.mjs` で確認した。以前のセーブなどで休憩状態から始まる場合は別途確認が必要。休憩時の掛け合いには椅子への言及がある。

青い布の台詞は分かれ道への切り替え後に表示されるが、390px幅では背景の中央切り取りによって布が画面外に出ていた。縦長の分かれ道だけ左端を見せ、追跡中はスマホ幅とPC幅の両方で地名と進行状況を布から離した。試作用の操作ボタンを外した実ゲームと同じ画面構成で、320×700・390×844 CSS pxとPC幅で布・台詞・操作ボタンの位置を確認した（`work/moss-second-day-cloth-320.png`、`work/moss-second-day-cloth-390-clear.png`、`work/moss-second-day-cloth-pc-clear.png`）。道中の全歩行コマの連続確認、スマートフォン実機での確認は残っている。
