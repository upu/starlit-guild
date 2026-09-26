# クエスト画像の生成

案内：[背景画像](background-images.md)

元画像は `assets/source/scenery/<名前>.png` に保存する。ゲームへ配信するのは `public/scenery/` のWebPだけで、元PNGを縮小表示しない。対象はクエストの背景12点。会話スチルや人物画像はこの処理の対象外。

## 更新手順

1. 英小文字・数字・ハイフンの名前で元PNGを置く。
2. `npm run images:optimize` を実行する。dev / build の開始時にも実行するが、起動中の監視は行わない。
3. 一覧・詳細・冒険背景の見え方を確認する。
4. 元PNG、生成WebP、`assets/scenery.manifest.json` を一緒にコミットする。

`config/scenery-images.json` がサイズと品質の正本。

| 用途 | 出力名 | サイズ | WebP品質 |
|---|---|---|---|
| クエスト一覧 | `<名前>-thumbnail.webp` | 320×320、中央で切り抜き | 74 |
| 選択後の詳細 | `<名前>-detail.webp` | 800×450、中央で切り抜き | 80 |
| 冒険背景 | `<名前>-background.webp` | 最大1672×1672、元の縦横比を保持 | 84 |

元画像より拡大しない。`Quest.background` は背景用WebPを指定し、`questScenery(quest, 'thumbnail' | 'detail' | 'background')` で用途別URLを得る。同じ背景を持つクエストは同じ用途別ファイルを共用する。章切り替えでは選んだ章のカードだけを描画する。

manifestは元PNG・設定・出力のSHA-256と容量を記録する。変更がなければ変換を省略し、元画像や設定の変更、出力の欠落・改変があれば元PNGから再生成する。生成WebPを再圧縮の入力にしない。変換処理の変更時はスクリプト内の `pipeline` 番号も更新する。sharpの版は判定に含めないため、依存更新だけでは再生成せず、生成物とmanifestも変わらない。新しいsharpの出力へ置き換えたいときは `pipeline` 番号を上げて再生成する。スチルと道中画像の生成も同じ判定を使う。

`npm run images:check` は書き換えずに整合性を確認する。CIでもチェックする。元画像の削除は自動処理せず、ゲームの参照先・対応する生成物・manifestを確認して一緒に整理する。

## クエストの選択と進行

操作・自動行先設定・保存仕様は [クエストの選択と進行](../gameplay/quest-navigation.md) へ移した。

## 検証

`node --test tests/scenery-images.test.mjs` と `npm run images:check` で画像生成の整合性を確認する。操作とブラウザーでの確認手順は [クエストの検証](../gameplay/quest-navigation.md#検証) を参照する。
