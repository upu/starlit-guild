# ストーリー動画の元ファイル

Grokなどから取得した元動画をこのフォルダーへ置く。ファイル名は `medicine-delivered.mp4` のような英小文字・数字・ハイフン。MP4 / MOV / WebM / MKVに対応し、サブフォルダーは使わない。同じ名前で拡張子だけ違う動画は置かない。

`npm run videos:optimize`、`npm run dev`、`npm run build` で `public/stories/videos/<名前>.mp4` を生成する。起動後に追加した場合はコマンドを再実行する。

元動画を配信用MP4で上書きしない。詳しい設定・導入・削除方法は [動画素材の管理](../../../docs/story-videos.md) を参照。
