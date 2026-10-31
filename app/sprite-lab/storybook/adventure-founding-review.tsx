import type { ReviewMode } from "./adventure-review-points";

export function FoundingReviewButtons({
  quest,
  restart,
}: {
  quest: string;
  restart: (packing: boolean, mode: ReviewMode) => void;
}) {
  if (quest !== "starlit-guild-founding") return null;
  return (
    <>
      {(
        [
          ["founding-letter", "返事の手紙から"],
          ["founding-loan", "借り物を返すところから"],
          ["founding-third-basket", "三つ目の籠から"],
          ["founding-warehouse", "倉庫への道から"],
          ["founding-travel", "荷車の移動から"],
          ["founding-arrival", "リンデ到着前から"],
        ] as const
      ).map(([mode, label]) => (
        <button
          key={mode}
          onClick={() => {
            restart(false, mode);
          }}
        >
          {label}
        </button>
      ))}
    </>
  );
}
