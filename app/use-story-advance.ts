import { useRef, type ComponentProps } from "react";
import type { DialogContent } from "@/components/ui/dialog";

export type StoryAdvance = { advance: () => void };

export function useStoryAdvance() {
  const readerRef = useRef<StoryAdvance>(null);
  const onPointerDownOutside: NonNullable<
    ComponentProps<typeof DialogContent>["onPointerDownOutside"]
  > = (event) => {
    event.preventDefault();
    const pointer = event.detail.originalEvent;
    if (pointer.button !== 0 || pointer.ctrlKey) return;
    readerRef.current?.advance();
  };
  return { readerRef, onPointerDownOutside };
}
