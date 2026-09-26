# リファレンスシートに合わせた会話の表情

案内：[人物画像](character-images.md)

会話への割り当てと完了時の確認は、[執筆指針の台詞ごとの表情指定](../story/story-writing.md#台詞ごとの表情指定) に従う。本書は採用画像と共通APIの仕様を扱う。

アリア、レオン、ミラ、プティの顔アイコンは、リファレンスシートに合わせた8表情を使う。制作には内蔵画像生成ツールを使用する。モデル名は取得できないため、特定のモデルで生成したとは記録しない。

## 採用画像と表示

第二章2-7の戦闘チャットでは `masked-pumpety` を共通Portrait APIへ渡し、[パンプキンヘッドの4コマ](../../public/portraits/masked-pumpety-expressions.webp) を使う。2列×2行で左上から `neutral` / `mischievous` / `surprised` / `worried`。顔の穴は黒いまま、頭と手の仕草で気分を表す。素顔の `pumpety` と区別し、話者名は「カボチャ頭の少女」。[制作プロンプト](../art-generation/masked-pumpety-portrait.md) と [表示条件](../gameplay/chapter-two-gameplay.md#2-72-9と第二章の完結) を参照する。

| 人物 | 参照 | ゲーム用画像 |
| --- | --- | --- |
| アリア | [シート](../characters/aria-reference-sheet.webp) | [共用の表情・上2行](../../public/portraits/aria-leon-expressions-v2.webp) |
| レオン | [シート](../characters/leon-reference-sheet.webp) | [共用の表情・下2行](../../public/portraits/aria-leon-expressions-v2.webp) |
| ミラ | [シート](../characters/mira-reference-sheet.webp) | [表情一覧](../../public/portraits/mira-expressions.webp) |
| プティ | [シート](../characters/pumpety-reference-sheet.webp) | [表情一覧](../../public/portraits/pumpety-expressions.webp) |

初版の各画像は1024×512px、4列×2行、1コマ256px角のWebP。ミラ・プティは引き続きこの形式を使い、アリア・レオンは下記の共用アップ画像へ更新した。上段は通常 `neutral`、笑顔 `smile`、驚き `surprised`、困り `worried`。下段は真剣 `serious`、照れ `shy`、疲れ `tired`、ニヤリ `mischievous`。初版の書き出しはミラが可逆圧縮、他の3人が品質90。現在の配信用画像は下記の軽量化方針を使う。ミラは通常顔にも重い上まぶたと灰紫の目の下の影を持ち、疲れ顔でそれを強める。笑顔・驚き・真剣さは別々に描き分ける。顔がコマの大部分を占めるアップ構図。頭頂部・髪・飾りの端はコマから切れてよく、目・鼻・頬・口を大きく描く。表示時はコマ全体を使い、追加のズームや切り取りは行わない。背景は不透明なアイボリー。人物ごとの髪・耳・髪飾りと、表情差分の顔の位置を確認し、64px角の比較でも目と口の違いを確認した。

`StoryLine.expression` へ台詞ごとに指定する。句読点や単語から実行時に感情を推測しない。同じ文章でも場面によって違う表情を指定できる。省略時は通常顔で、地の文には顔を出さない。会話画面、思い出の読み返し、道中のチャット履歴は各発言の表情を保持する。キャラクター画面では通常顔を使い、対象外の人物には従来の顔画像を使う。

第一章1-1〜1-9、待機・道中の掛け合いなどに表情を付けた。ミラが自分の疲れを後回しにする発言は疲れ顔、プティのいたずらはニヤリ顔、アリアの早合点から謝る流れは笑顔→驚き→困り顔とした。台詞本文、シーンID、進行・セーブ形式は変更していない。

これは既存の会話への表示実装であり、新しい第二章のシナリオ実装ではない。第二章のパンプキンヘッド姿へプティの素顔画像を流用しない。かぶり物の状態は第二章実装側で別に扱い、[人物設定](../characters/pumpety.md) を守る。

## チャットとシナリオで共用するアップの表情

アリアとレオンは [共用の16コマ](../../public/portraits/aria-leon-expressions-v2.webp) を、チャット・シナリオ会話・思い出・キャラクター画面で使う。チャット専用画像への分岐は廃止した。他の人物の画像は維持する。

画像は1024×1024px・4列×4行のWebP（品質82）。上2行がアリア、下2行がレオンで、各8表情の順序は従来と同じ。二人のリファレンスシートを直接参照し、頭身を低くしたデフォルメではなく、元の顔立ち・髪型・色・衣装に寄せる。顔を大きくし、頭頂部・髪・耳・飾りの端が枠外に切れることを許容する。目・鼻・頬・口が読み取れる構図を優先する。

アリアの `mischievous` は、従来のニヤリ顔から、少し顎を上げたかわいく得意げなどや顔に変更した。悪巧みや嘲笑に見える片側の笑み・鋭い眉は避ける。台詞の表情キーと割り当ては変更せず、人物に合った表現として描き分ける。レオンは控えめで親しみのある笑みを使う。

内蔵画像生成ツールで2026-09-21に制作。生成PNGの構図を保ち、1コマ256pxへ縮小してWebP品質82で配信用に圧縮した。制作条件は [生成記録](../art-generation/shared-portraits-generation.json) を参照。40pxのチャットと大きな会話用表示で同じ表情を確認する。

## 登場に備えた素材

フィンの [9表情](../../public/portraits/finn-expressions.webp) は [採用シート](../characters/finn-reference-sheet.webp) をもとに制作した。768×768px・3列×3行のWebP（品質82）で、通常・笑顔・驚き／困り・真剣・照れ／疲れ・ニヤリ・思案を収録する。表情の意図は [人物資料](../characters/finn.md#顔アイコン)、制作条件は [生成記録](../art-generation/finn-expressions-generation.json) を参照。会話との接続範囲は[第三章の実装仕様](../gameplay/chapter-three-gameplay.md#実装状況)を参照する。

`expressionPortrait("finn", "thoughtful")` で右下の思案顔を取得できる。`lib/portrait-expressions.ts` のキャラ別定義が列数・行数・表情順を持つ。ミラ・プティは4列×2行、アリア・レオンは共用の4列×4行を使い、未収録の表情を指定した場合は通常顔へ戻る。既存の数値IDによる呼び出しも維持する。

### リコ

[リコの9表情](../../public/portraits/lico-expressions.webp) は [採用シート](../characters/lico-reference-sheet.webp) と [人物資料の指定](../characters/lico.md#顔アイコン) をもとに制作。上段は通常 `neutral`・笑顔 `smile`・驚き `surprised`、中段は困り `worried`・真剣 `serious`・照れ `shy`、下段は疲れ `tired`・怪しい笑み `mischievous`・叫び `shouting`。丸メガネは円形の細いフレームへ修正した。

怪しい笑みは片側の口の端が上がる好奇心の表情。叫びは「あーーっ！」と何かを発見した顔で、普通の驚きより大きく口と目を開ける。画像内に台詞は入れない。768×768px、1コマ256px、WebP品質82・effort 6で147,630バイト。40pxと72pxの表示サイズで確認する。最終プロンプトと修正指示は [生成記録](../art-generation/lico-expressions-generation.json) に保存。

`<Portrait index="lico" expression="mischievous" />` / `<Portrait index="lico" expression="shouting" />` で共通部品から表示できる。`expressionPortrait("lico", "shouting")` は右下のコマを返す。リコの `thoughtful`、他の人物の `shouting` のように未収録の表情は通常顔へ戻る。リコの数値IDや登場シーンは今回追加しない。

### メリル

[メリルの8表情](../../public/portraits/merrill-expressions.webp)は[採用シート原本](../characters/merrill-reference-sheet.png)から制作。4列×2行、1024×512px、1コマ256px、WebP品質82・effort 6で100,426バイト。不透明なアイボリー背景。頭頂部・髪・花の外側や肩を切り、目・頬・口が枠を大きく占めるアップへ修正した。40px・72pxの縮小表示で表情と舌なめずりを目視確認。

| 位置 | 表情キー | 意図 |
| --- | --- | --- |
| 上段左 | `neutral` | 親しみのある通常顔 |
| 上段2番目 | `smile` | 目を閉じて満面の笑顔 |
| 上段3番目 | `surprised` | 目を見開き、小さく口を開けた驚き |
| 上段右 | `mischievous` | 横目でニヤリ |
| 下段左 | `savoring` | 目を閉じて味わう満足 |
| 下段2番目 | `excited` | 食べ物を見つけた期待と喜び |
| 下段3番目 | `serious` | 注意を向ける真剣な顔 |
| 下段右 | `predatory` | 食べ物候補を見定める捕食者の目と舌なめずり |

`<Portrait index="merrill" expression="predatory" />` または `expressionPortrait(12, "predatory")` で共通のアトラスから取得する。未収録の表情は通常顔へ戻る。他の人物に `predatory`・`savoring`・`excited` を指定しても、その人物の通常顔になる。会話への接続と台詞ごとの指定は、[第四章の実装仕様](../gameplay/chapter-four-gameplay.md#数値と確認)を参照する。

元シートの6表情と、追加した真剣・捕食者の目を収録する。石榴の花・緑のボブ・瞳・旅装を維持し、花は頭から生える体の一部として扱う。内蔵画像生成ツールで制作し、生成PNGをLanczos3で縮小した。最終プロンプトと参照・画像情報は[生成記録](../art-generation/merrill-expressions-generation.json)を参照。

## 生成記録

採用したアップ構図の参照画像・生成出力・最終プロンプトは [生成記録](../art-generation/dialogue-expressions-generation.json) に保存する。内蔵画像生成ツールで、4人の外見・8表情・コマ順を維持して描き直した。参照シートの文字情報を人物設定として採用していない。

## ミラ・フィンのアップ画像と配信容量

ミラもチャット・シナリオ会話・キャラクター画面で共用する顔のアップへ更新した。通常や笑顔にも目の下の青紫・灰紫の血色の悪さを残し、疲れ顔では強める。年齢は [人物設定](../characters/mira.md) の20代半ばを正とする。フィンは採用シートの顔立ち・日焼け・無精髭・垂れ目を残し、思案を含む9表情をアップにした。キャラクター登録・登場条件は追加していない。制作条件は [生成記録](../art-generation/mira-finn-closeups-generation.json) を参照。

アリア・レオン、ミラ、フィンの配信画像は1コマ256px、Lanczos3縮小、WebP品質82・effort 6を使用する。40pxチャットと72px会話を高密度画面で表示する余裕を残す。容量はアリア・レオン393,320バイト（従来2,260,668バイトから約83%削減）、ミラ103,076バイト、フィン217,748バイト。原画をそのまま配信せず、再生成時も表示サイズで表情を確認する。
