# ストーリー動画の管理

## 使い方

1. 元動画を `assets/source/story-videos/` へ置く。英小文字・数字・ハイフンのファイル名を使う（例：`medicine-delivered.mp4`）。MP4 / MOV / WebM / MKVに対応。同名・別拡張子はエラー。
2. `npm run videos:optimize` を実行する。`npm run dev` / `npm run build` の開始時にも自動実行する。開発サーバー起動中の監視は行わないので、追加後はコマンドを再実行する。
3. `public/stories/videos/<名前>.mp4` をローカルで確認する。例：`http://localhost:5173/stories/videos/medicine-delivered.mp4`。
4. 元動画・配信用MP4・`assets/story-videos.manifest.json` を一緒にコミットする。

元動画は配信対象外の `assets`、配信用は `public` に置く。ゲーム内へ追加するときは `lib/story-art.ts` の該当シーンに `videoSrc` を指定し、`src` は読み込み中・再生不可時の静止画として残す。

## ゲーム内の再生

2-8の服薬シーンは `revealAtLine: 4` から動画を表示する。会話・思い出の読み返し・拡大鑑賞で、無音のインライン再生を1回行い、最後のフレームで停止する。画面内のリプレイアイコンでもう一度最初から再生でき、再生中は一時停止／再生アイコンを使う。動画の終了で会話は進まない。拡大中は背後の動画を停止し、アルバム一覧は静止画だけを読み込む。

OSの「動きを減らす」設定中、タブ非表示中、再生エラーや自動再生の拒否時には静止画を表示する。表示対象になるまで動画要素を作らず、画面を閉じる際には再生を止める。セーブ形式や読了・アルバム解放条件は動画の有無に依存しない。

`npm run build` 後、PlaywrightとChromiumを用意して `node tests/story-video.browser.mjs` でブラウザー検証を実行できる。必要に応じて `PLAYWRIGHT_MODULE` にパッケージの絶対パス、`CHROME_PATH` にChrome実行ファイルを指定する。実際の会話・鑑賞コンポーネントを独立したポートで表示し、既存のセーブに接続せず確認する。

## 圧縮設定

[`config/story-video.json`](../config/story-video.json) が設定の正本。標準は H.264（libx264）、CRF26、preset slow、yuv420p、最大1280×720、最大24fps、音声なし、faststart付きMP4。縦横比を保ち、解像度・fpsは元より増やさない。音声・字幕・添付カバー画像・チャプター・付加メタデータは配信用に含めない。

CRFは品質基準なので、一定の容量・ビットレートや必ず小さくなることは保証しない。元から強く圧縮された素材も初回は指定設定で生成する。HDR・正方形でないピクセルの素材は、SDR・正方形ピクセルへ整えてから追加する。

## 繰り返し圧縮しない仕組み

manifestは現在の元動画SHA-256、圧縮設定のハッシュ、出力SHA-256とサイズ、検査した映像情報を持つ。全て一致した動画は、FFmpegを起動せずスキップする。元動画・設定を変更した場合、出力が欠落・改変された場合だけ元動画から再生成する。配信用動画を次の圧縮入力に使わない。

設定ファイルを変更すると再生成の対象になる。スクリプトの変換処理自体を変更する場合は `optimize-story-videos.mjs` 内の `pipeline` 番号も上げる。

一時ファイルへ変換し、映像形式・音声・解像度・fps・長さを検査してから差し替える。変換失敗時は既存出力とmanifestを維持する。複数本ある場合、成功済みの動画は保存される。同時実行はロックで防ぐ。異常終了で `assets/.story-videos.lock` が残った場合は、処理が停止していることを確認してそのファイルを削除する。

動画を削除・改名するときは、対応する元動画、配信用MP4、manifestの該当項目を揃えて削除・改名する。スクリプトは不要になったファイルを自動削除しない。管理対象外の同名出力も上書きしない。

## FFmpegの用意

初回生成・変更時だけ、libx264を含むFFmpegとffprobeが必要。両方をPATHへ登録するか、`FFMPEG_PATH` / `FFPROBE_PATH` に実行ファイルの絶対パスを指定する。Windowsでは `winget install --id Gyan.FFmpeg -e` で導入した配置も検出する。

```powershell
$env:FFMPEG_PATH = 'C:\tools\ffmpeg\bin\ffmpeg.exe'
$env:FFPROBE_PATH = 'C:\tools\ffmpeg\bin\ffprobe.exe'
npm run videos:optimize
```

CIの `npm run videos:check` は元動画・設定・出力ハッシュの一致を確認し、古い素材があれば失敗する。生成済み素材をGitへ含めるため、通常のビルドやCIでFFmpegの追加インストールは不要。ビルド時に素材が古ければ再生成を試み、FFmpegがない環境では理由を表示して停止する。

実装の参照：[FFmpeg変換オプション](https://ffmpeg.org/ffmpeg.html)、[scale / fpsフィルター](https://ffmpeg.org/ffmpeg-filters.html)、[MP4 faststart](https://ffmpeg.org/ffmpeg-formats.html)。
