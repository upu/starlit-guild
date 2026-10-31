"use client";
import type { ReviewMode } from "./adventure-review-points";
import { FoundingReviewButtons } from "./adventure-founding-review";

export function BrekkaChapterReviewButtons({
  quest,
  restart,
}: {
  quest: string;
  restart: (packing: boolean, mode: ReviewMode) => void;
}) {
  return (
    <>
      <BrekkaReviewButtons quest={quest} restart={restart} />
      <MossTrailReviewButton quest={quest} restart={restart} />
      <FoundingReviewButtons quest={quest} restart={restart} />
    </>
  );
}

export function BrekkaReviewButtons({
  quest,
  restart,
}: {
  quest: string;
  restart: (packing: boolean, mode: ReviewMode) => void;
}) {
  if (quest !== "brekka-arrival") return null;
  return (
    <>
      <button
        onClick={() => {
          restart(false, "battle");
        }}
      >
        戦闘から
      </button>
      <button
        onClick={() => {
          restart(false, "brekka-ledger");
        }}
      >
        仕入れ調査から
      </button>
    </>
  );
}

export function MossTrailReviewButton({
  quest,
  restart,
}: {
  quest: string;
  restart: (packing: boolean, mode: ReviewMode) => void;
}) {
  if (!["glowing-moss-trail", "glowing-moss-trail-next-day"].includes(quest)) return null;
  return (
    <>
      <button
        onClick={() => {
          restart(false, "trail-approach");
        }}
      >
        分かれ道の手前から
      </button>
      <button
        onClick={() => {
          restart(false, "arrival");
        }}
      >
        最後の追跡から
      </button>
    </>
  );
}
