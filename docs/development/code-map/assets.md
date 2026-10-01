# 画像・動画・音の素材と生成物

[作業別のコード案内](../code-map.md) に戻る。

- **編集元・主要関数**: [素材の種類別案内](../../art/README.md) から原本へ。配信用生成は [背景](../../../scripts/optimize-scenery.mjs)、[スチル](../../../scripts/optimize-story-stills.mjs)、[動画](../../../scripts/optimize-story-videos.mjs)、[道中画像](../../../scripts/optimize-road-art.mjs)、[共有カード](../../../scripts/generate-social-card.mjs)、[BGM](../../../scripts/optimize-bgm.mjs)。表示条件は該当する `lib/`・`app/`。
- **仕様**: [アート・音の資料](../../art/README.md)。制作記録と現行の表示条件を区別する。
- **検証**: 変更した種類に対応する `npm run images:check` / `stills:check` / `videos:check` / `road-art:check` / `social-card:check` / `music:check` と、該当画面・再生を確認。

旅団試作の部品は [アリアの生成](../../../scripts/build-guild-lab-aria.mjs) → [完成絵の切り出し](../../../scripts/guild-lab-master-layers.mjs)、[完全な衣服の位置合わせ](../../../scripts/guild-lab-completed-paint.mjs)、[曲げた腕脚](../../../scripts/guild-lab-bent-paint.mjs)。原本・測定点・生成指示と、比較画像の場所は [旅団試作](../../art/guild-lab.md) に記録する。
