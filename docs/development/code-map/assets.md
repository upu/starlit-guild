# 画像・動画・音の素材と生成物

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [素材の種類別案内](../../art/README.md) から原本へ。配信用生成は [背景](../../../scripts/optimize-scenery.mjs)、[スチル](../../../scripts/optimize-story-stills.mjs)、[動画](../../../scripts/optimize-story-videos.mjs)、[道中画像](../../../scripts/optimize-road-art.mjs)、[共有カード](../../../scripts/generate-social-card.mjs)、[BGM](../../../scripts/optimize-bgm.mjs)。表示条件は該当する `lib/`・`app/`。
- **仕様**: [アート・音の資料](../../art/README.md)。制作記録と現行の表示条件を区別する。
- **アリア・ミラの動作コマの整列**: [共通の整列処理](../../../scripts/prepare-mini-animation.mjs)を[アリア](../../../scripts/prepare-aria-animation.mjs)・[ミラ](../../../scripts/prepare-mira-animation.mjs)から実行 → [道中画像の配信生成](../../../scripts/optimize-road-art.mjs)。原本・セルと足元・静止ミニキャラの切り出しは [動作画像](../../art/hero-animation-art.md) を参照。
- **検証**: 変更した種類に対応する `npm run images:check` / `stills:check` / `videos:check` / `road-art:check` / `social-card:check` / `music:check` と、該当画面・再生を確認。

旅団のドット絵調素材は `assets/source/home-pixel/` → [配信生成](../../../scripts/build-home-pixel.mjs) → `public/home-pixel/`。[制作と確認](../../art/guild-lab.md) に指示・フレーム規約・検証を記録する。

冒険の5人はホームの歩行・待機と `assets/source/adventure-pixel/` の専用動作 → [配信生成](../../../scripts/build-adventure-pixel.mjs) → `public/adventure-pixel/`。[冒険のミニキャラ](../../art/adventure-pixel.md)を参照。`adventure-art:check` で鮮度を検査する。
