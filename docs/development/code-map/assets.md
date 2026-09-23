# 画像・動画・音の素材と生成物

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [素材の種類別案内](../../art/README.md) から原本へ。配信用生成は [背景](../../../scripts/optimize-scenery.mjs)、[スチル](../../../scripts/optimize-story-stills.mjs)、[動画](../../../scripts/optimize-story-videos.mjs)、[道中画像](../../../scripts/optimize-road-art.mjs)、[共有カード](../../../scripts/generate-social-card.mjs)、[BGM](../../../scripts/optimize-bgm.mjs)。表示条件は該当する `lib/`・`app/`。
- **仕様**: [アート・音の資料](../../art/README.md)。制作記録と現行の表示条件を区別する。
- **検証**: 変更した種類に対応する `npm run images:check` / `stills:check` / `videos:check` / `road-art:check` / `social-card:check` / `music:check` と、該当画面・再生を確認。
