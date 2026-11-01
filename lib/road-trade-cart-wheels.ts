export const tradeCartBodies: Record<string, string> = {
  "/storybook-study/loaded-cart-v1.webp": "/storybook-study/loaded-cart-body-v2.webp",
  "/storybook-study/return-cart-v1.webp": "/storybook-study/return-cart-body-v2.webp",
  "/storybook-study/brekka-medical-cart-v1.webp":
    "/storybook-study/brekka-medical-cart-body-v1.webp",
  "/storybook-study/waterway-tool-cart-v1.webp": "/storybook-study/waterway-tool-cart-body-v1.webp",
};
export const tradeWheelAsset = "/storybook-study/brekka-cart-wheel-v1.webp";

// Wheel centres are registered to the original 420x280 cart, whose origin is (210, 268).
export const tradeWheelLayout = {
  front: { x: (86 - 210) / 420, y: (195 - 268) / 420, diameter: 120 / 420 },
  rear: { x: (194 - 210) / 420, y: (209 - 268) / 420, diameter: 88 / 420 },
};

/** The far wheel of the medical cart sits higher in its original perspective. */
export const tradeWheelLayoutFor = (asset?: string) => {
  if (
    asset !== "/storybook-study/waterway-tool-cart-v1.webp" &&
    asset !== "/storybook-study/brekka-medical-cart-v1.webp"
  )
    return tradeWheelLayout;
  const rearY = asset === "/storybook-study/waterway-tool-cart-v1.webp" ? 195 : 197;
  return { ...tradeWheelLayout, rear: { ...tradeWheelLayout.rear, y: (rearY - 268) / 420 } };
};
