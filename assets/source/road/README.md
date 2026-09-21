# 横スクロール戦闘の画像原本

採用したPNG原本をこのフォルダーに置く。`npm run road-art:optimize` が同名のWebPを `public/animations/road/` へ生成する。開発起動・ビルドの前にも自動実行し、CIでは `npm run road-art:check` が原本・変換条件・配信ファイルのハッシュを照合する。

スプライトのコマ位置が変わらないよう、サイズを変えずロスレスWebPへ変換する。透明度と可視画素の一致はテストで確認する。配信用のWebPを手で編集せず、原本を更新して再生成する。

生成条件は `docs/art-generation/` の横スクロール画像の制作記録を参照。作業地点の簡略版は `road-worksites-simple.json`。
