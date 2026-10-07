import type { Action } from "@/lib/game";
import type { AdventureInput } from "@/lib/adventure-presentation";

export type RendererStatus = "loading" | "ready" | "error";
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
};
export type AdventureRenderer = {
  destroy: () => void;
  resize: (width: number, height: number) => void;
  setPaused: (paused: boolean) => void;
};
export type RendererFactory = (parent: HTMLElement, bridge: AdventureBridge) => AdventureRenderer;

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
    status: (status) => {
      if (!disposed) bridge.status(status);
    },
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
