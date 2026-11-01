// Registration data is a build/test input, never a public game asset.
export function storybookMetricsPath(asset) {
  if (!asset.startsWith("public/storybook-study/") || !asset.endsWith(".webp"))
    throw new Error(`Not a storybook delivery atlas: ${asset}`);
  return asset
    .replace("public/storybook-study/", "assets/metadata/storybook/")
    .replace(/\.webp$/, "-metrics.json");
}
