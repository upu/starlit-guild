"use client";
import type { RefObject } from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { StoryAdvance } from "./use-story-advance";

export function StoryHeading({
  title,
  description,
  readerRef,
}: {
  title: string;
  description: string;
  readerRef: RefObject<StoryAdvance | null>;
}) {
  return (
    <DialogHeader className="story-heading">
      <button
        type="button"
        aria-label={`${title}：会話を進める`}
        onClick={(event) => {
          if (event.button === 0 && !event.ctrlKey) readerRef.current?.advance();
        }}
        onKeyDown={(event) => {
          if (event.repeat && (event.key === "Enter" || event.key === " ")) event.preventDefault();
        }}
      >
        <DialogTitle asChild>
          <span>{title}</span>
        </DialogTitle>
        <DialogDescription asChild>
          <span>{description}</span>
        </DialogDescription>
      </button>
    </DialogHeader>
  );
}
