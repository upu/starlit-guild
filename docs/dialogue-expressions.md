# リファレンスシートに合わせた会話の表情

アリア、レオン、ミラ、プティの顔アイコンは、リファレンスシートに合わせた8表情を使う。制作には内蔵画像生成ツールを使用する。モデル名は取得できないため、特定のモデルで生成したとは記録しない。

## 採用画像と表示

| 人物 | 参照 | ゲーム用画像 |
| --- | --- | --- |
| アリア | [シート](characters/aria-reference-sheet.webp) | [表情一覧](../public/portraits/aria-expressions.webp) |
| レオン | [シート](characters/leon-reference-sheet.webp) | [表情一覧](../public/portraits/leon-expressions.webp) |
| ミラ | [シート](characters/mira-reference-sheet.webp) | [表情一覧](../public/portraits/mira-expressions.webp) |
| プティ | [シート](characters/pumpety-reference-sheet.webp) | [表情一覧](../public/portraits/pumpety-expressions.webp) |

各画像は1024×512px、4列×2行、1コマ256px角のWebP。上段は通常 `neutral`、笑顔 `smile`、驚き `surprised`、困り `worried`。下段は真剣 `serious`、照れ `shy`、疲れ `tired`、ニヤリ `mischievous`。書き出しはミラが可逆圧縮、他の3人が品質90。ミラは通常顔にも重い上まぶたと灰紫の目の下の影を持ち、疲れ顔でそれを強める。笑顔・驚き・真剣さは別々に描き分ける。顔がコマの大部分を占めるアップ構図。頭頂部・髪・飾りの端はコマから切れてよく、目・鼻・頬・口を大きく描く。表示時はコマ全体を使い、追加のズームや切り取りは行わない。背景は不透明なアイボリー。人物ごとの髪・耳・髪飾りと、表情差分の顔の位置を確認し、64px角の比較でも目と口の違いを確認した。

`StoryLine.expression` へ台詞ごとに指定する。句読点や単語から実行時に感情を推測しない。同じ文章でも場面によって違う表情を指定できる。省略時は通常顔で、地の文には顔を出さない。会話画面、思い出の読み返し、道中のチャット履歴は各発言の表情を保持する。キャラクター画面では通常顔を使い、対象外の人物には従来の顔画像を使う。

第一章1-1〜1-9、待機・道中の掛け合い、従来記録のミラ加入やプティの来客・クエストなどに表情を付けた（従来記録側の会話はその後 [削除した](gameplay.md#従来モードの扱い)）。ミラが自分の疲れを後回しにする発言は疲れ顔、プティのいたずらはニヤリ顔、アリアの早合点から謝る流れは笑顔→驚き→困り顔とした。台詞本文、シーンID、進行・セーブ形式は変更していない。

これは既存の会話への表示実装であり、新しい第二章のシナリオ実装ではない。プティの素顔画像は従来記録向け。第二章のパンプキンヘッド姿へこの素顔を流用しない。かぶり物の状態は第二章実装側で別に扱い、[人物設定](characters/pumpety.md) を守る。

## 小さなチャット用の表情

アリアとレオンは道中・待機中の40pxチャットだけ、[簡略化した16コマの表情](../public/portraits/chat-aria-leon-expressions.webp) を使う。通常の会話画面・思い出・キャラクター画面は従来の絵を維持する。他の人物のチャットも従来の表情画像を使う。

画像は1254×1254px・4列×4行の可逆WebP。上2行がアリア、下2行がレオンで、各8表情の順序は従来と同じ。細かな髪の線・陰影を減らし、目・眉・口を大きく整理した。アリアの金髪・緑の目・エルフ耳・白い花、レオンの茶髪・茶色の目・赤い襟元を維持する。`Portrait` の `variant="chat"` で切り替え、未知・未収録の表情は通常顔に戻す。

内蔵画像生成ツールで2026-09-21に制作。参照は既存の `aria-expressions.webp` と `leon-expressions.webp`。生成PNGを再描画・切り取りせず可逆WebPへ変換した。制作条件は [生成記録](art-generation/chat-portraits-generation.json) を参照。

## 登場に備えた素材

フィンの [9表情](../public/portraits/finn-expressions.webp) は [採用シート](characters/finn-reference-sheet.webp) をもとに制作した。768×768px・3列×3行の可逆WebPで、通常・笑顔・驚き／困り・真剣・照れ／疲れ・ニヤリ・思案を収録する。表情の意図は [人物資料](characters/finn.md#顔アイコン)、制作条件は [生成記録](art-generation/finn-expressions-generation.json) を参照。キャラクター登録と台詞への割り当ては未実装のため、上記の表示対象にはまだ含めない。

`expressionPortrait("finn", "thoughtful")` で右下の思案顔を取得できる。`lib/portrait-expressions.ts` のキャラ別定義が列数・行数・表情順を持つ。既存キャラは4列×2行のままで、未収録の表情を指定した場合は通常顔へ戻る。既存の数値IDによる呼び出しも維持する。フィンのゲーム内登録番号はまだ割り当てない。

## 生成記録

採用したアップ構図の参照画像・生成出力・最終プロンプトは [生成記録](art-generation/dialogue-expressions-generation.json) に保存する。内蔵画像生成ツールで、4人の外見・8表情・コマ順を維持して描き直した。参照シートの文字情報を人物設定として採用していない。
