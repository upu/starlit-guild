import type { Action } from "@/lib/game";
import type { AdventureInput } from "@/lib/adventure-presentation";
import type { TownActivity } from "@/lib/road-town-activity";
export type { TownActivity } from "@/lib/road-town-activity";

export type RendererStatus = "loading" | "ready" | "error";
export type LindeProgress = { node: number; complete: boolean; phase?: "move" | "work" };
export type RuntimeState = {
  disposed: boolean;
  paused: boolean;
  created: boolean;
  reduced: boolean;
};
export type AdventureBridge = {
  read: () => AdventureInput;
  act: (action: Action) => void;
  status: (status: RendererStatus) => void;
  visualComplete?: (quest: string) => void;
  nightPushFrame?: (frame: number | null) => void;
  lindeProgress?: (progress: LindeProgress) => void;
  townActivity?: (activity: TownActivity) => void;
};
export type AdventureRenderer = {
  destroy: () => void;
  resize: (width: number, height: number) => void;
  setPaused: (paused: boolean) => void;
};
export type RendererFactory = (parent: HTMLElement, bridge: AdventureBridge) => AdventureRenderer;

function guardedStatus(bridge: AdventureBridge, disposed: () => boolean) {
  return (status: RendererStatus) => {
    if (!disposed()) bridge.status(status);
  };
}

// Cancels a pending dynamic import and disposes exactly the renderer it created.
export function rendererSession(
  parent: HTMLElement,
  bridge: AdventureBridge,
  load: () => Promise<RendererFactory>,
) {
  let disposed = false,
    renderer: AdventureRenderer | undefined,
    paused = false,
    size = { width: 0, height: 0 };
  const currentBridge: AdventureBridge = {
    read: bridge.read,
    act: (action) => {
      if (!disposed && !paused) bridge.act(action);
    },
    status: guardedStatus(bridge, () => disposed),
    visualComplete: (quest) => {
      if (!disposed) bridge.visualComplete?.(quest);
    },
    nightPushFrame: (frame) => {
      if (!disposed) bridge.nightPushFrame?.(frame);
    },
    lindeProgress: (progress) => !disposed && bridge.lindeProgress?.(progress),
    townActivity: (activity) => !disposed && bridge.townActivity?.(activity),
  };
  const started = load()
    .then((factory) => {
      if (disposed) return;
      renderer = factory(parent, currentBridge);
      if (size.width > 0 && size.height > 0) renderer.resize(size.width, size.height);
      renderer.setPaused(paused);
    })
    .catch((error: unknown) => {
      renderer?.destroy();
      renderer = undefined;
      if (!disposed) {
        console.error("Adventure renderer failed", error);
        bridge.status("error");
      }
    });
  return {
    started,
    resize(width: number, height: number) {
      if (disposed || width <= 0 || height <= 0) return;
      size = { width, height };
      renderer?.resize(width, height);
    },
    setPaused(value: boolean) {
      if (disposed) return;
      paused = value;
      renderer?.setPaused(value);
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      renderer?.destroy();
      renderer = undefined;
    },
  };
}
