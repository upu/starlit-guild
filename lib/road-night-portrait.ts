import type { RoadViewport } from "./road-cart-layout.ts";
import { nightBridgeLayout } from "./road-housecalls-layout.ts";
import { nightBridgeAssets } from "./road-night-bridge.ts";

/** Portrait-only backgrounds are aligned to the same ground coordinates as the landscape scene. */
export function nightPortraitBackdrop(view: RoadViewport, section?: number) {
  if (section === undefined || section < 0 || section > 2 || view.height <= view.width) return null;
  const layout = nightBridgeLayout(view, section);
  const width = layout.backdrop.width;
  const height = Math.max(view.height, width * 1.5);
  const scale = width / 1536;
  const y = Math.max(
    view.height - height,
    Math.min(0, layout.backdrop.y - [280, 200, 320][section] * scale),
  );
  return {
    asset: [
      nightBridgeAssets.bankPortrait,
      nightBridgeAssets.approachPortrait,
      nightBridgeAssets.bridgePortrait,
    ][section],
    x: Math.min(
      0,
      Math.max(view.width - width, layout.backdrop.x + (section === 1 ? 65 : 0) * scale),
    ),
    y,
    width,
    height,
  };
}
