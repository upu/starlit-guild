# データ形式 v1

UTF-8 JSON。座標は右が東、下が南の共通作図座標。実距離の単位ではない。`north` は `true`（北を確定）か `false`（紙面上の北も案）。地図間で地点の座標をコピーしない。

- `version`: 1
- `title`, `subtitle`, `notice`: 表題、補足、常時表示する確度・縮尺の注意。
- `north`: boolean
- `defaultMap`: 初期表示する地図ID
- `maps`: `{id, name, parent, bounds:[x,y,width,height], level, note}`。親がない場合 `parent:null`。子図の範囲は親図内。`level` が大きいほど細部の地点を表示する。
- `places`: `{id, name, kind, x, y, level, status, placement, note, sources, labelOffset?, labelAnchor?}`。
  - IDは英小文字・数字・ハイフン。改名しても維持。
  - `kind`: `town`, `village`, `tower`, `site`, `junction`, `bridge`。
  - `status` と `placement`: `established`, `proposal`, `unknown`。存在と配置の確度を独立管理する。
  - `sources`: `[{ref, detail}]`。資料のパス／URL／章IDと、何を裏づけるか。空配列は制作案等で使用。既存資料のリンクはデータファイル基準で記録する。UIには安全なテキストとして表示する。
  - `labelOffset:[dx,dy]`: 記号に対するラベルの距離。画面用の単位で拡大率に合わせる。省略時 `[12,-12]`。`labelAnchor`: `start`, `middle`, `end`。
- `routes`: `{id, name, stops:[placeId,...], level, status, note, sources}`。存在する行路の接続と、通る地形上の厳密な線形は分ける。線は地点を結ぶ模式表現。`status` は接続の確度。地点を移動すると経路も追従する。
- `terrain`: `{id, name, kind, points:[[x,y],...], status, note, sources, level?}`。`kind`: `forest`, `mountain`, `plain`, `water`, `river`, `land`。river以外は閉じた多角形。装飾の森や山も位置・範囲を未確定なら `proposal` にする。

`level` は0〜5の整数。ルートが表示される地図では、その端点も同じか小さいlevelにする。地方図は既存世界図内へ範囲を置く。世界を広げる場合は親のboundsを拡張する。全項目は文字列のHTML実行をせず描画する。

画面で編集できるのは場所の追加・名称・メモ・座標・配置確度。地点移動は `placement:proposal` に戻す。既存設定の `status`、資料根拠、ルート、地形、地図の追加や改定はJSONを編集する。保存したJSONを次回読み込み、必要ならHTMLも保存して共有する。
