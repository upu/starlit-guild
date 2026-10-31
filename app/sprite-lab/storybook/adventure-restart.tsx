import type { Dispatch, SetStateAction } from "react";
import type { LindeProgress } from "../../phaser/renderer-session";
import type { ReviewMode } from "./adventure-review-points";

export function adventureRestart(
  controls: {
    setPaused: Dispatch<SetStateAction<boolean>>;
    setReplay: Dispatch<SetStateAction<number>>;
    setLindeProgress: Dispatch<SetStateAction<LindeProgress | null>>;
    reset: (packing?: boolean, mode?: ReviewMode) => void;
  },
  resetDialogue: () => void,
) {
  return (packing = false, mode?: ReviewMode) => {
    controls.setPaused(!!mode);
    controls.setReplay((replay) => replay + 1);
    controls.setLindeProgress(null);
    resetDialogue();
    controls.reset(packing, mode);
  };
}

export function RestartButtons({
  restart,
  packing = true,
}: {
  restart: (packing?: boolean, mode?: ReviewMode) => void;
  packing?: boolean;
}) {
  return (
    <>
      <button
        onClick={() => {
          restart();
        }}
      >
        最初から
      </button>
      <button
        disabled={!packing}
        onClick={() => {
          restart(true);
        }}
      >
        荷札確認から
      </button>
      {packing && (
        <>
          <button
            onClick={() => {
              restart(false, "town-delivery");
            }}
          >
            配達先の手前から
          </button>
          <button
            onClick={() => {
              restart(false, "town-final");
            }}
          >
            最後の配達から
          </button>
        </>
      )}
    </>
  );
}
