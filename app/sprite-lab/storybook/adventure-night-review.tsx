"use client";
import type { ReviewMode } from "./adventure-review-points";

export function NightPushReviewButton({
  quest,
  restart,
}: {
  quest: string;
  restart: (packing: boolean, mode: ReviewMode) => void;
}) {
  if (quest !== "keystone-night-road") return null;
  return (
    <button
      onClick={() => {
        restart(false, "night-push");
      }}
    >
      荷車の運搬から
    </button>
  );
}
