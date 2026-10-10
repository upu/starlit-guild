import type { StoryStageCue } from "@/lib/story-stage";

export function StoryStageProps({ cue }: { cue: StoryStageCue }) {
  return (
    <>
      <span className="story-stage-cart" hidden={cue.hideCart} />
      {cue.merchant && (
        <>
          <div
            className="story-stage-merchant"
            data-pose={cue.merchant.pose}
            data-speaking={!!cue.merchant.speaking}
          >
            <span className="story-stage-shadow" />
            <span className="story-stage-merchant-sprite" />
            <span className="story-stage-merchant-name">取引先の人</span>
          </div>
          <div className="story-stage-table">
            <span className="story-stage-table-art" />
            {cue.background === "town-shop" && (
              <span className="story-stage-table-stock">
                <span />
                <span />
              </span>
            )}
          </div>
        </>
      )}
      <span className="story-stage-delivery-box" data-box={cue.box} hidden={!cue.box} />
    </>
  );
}
