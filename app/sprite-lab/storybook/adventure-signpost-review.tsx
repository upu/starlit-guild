"use client";
export function SignpostReviewButton({
  quest,
  restart,
}: {
  quest: string;
  restart: (packing: boolean, mode: "arrival") => void;
}) {
  if (quest !== "spinning-signpost") return null;
  return (
    <button
      onClick={() => {
        restart(false, "arrival");
      }}
    >
      道標を戻すところから
    </button>
  );
}
