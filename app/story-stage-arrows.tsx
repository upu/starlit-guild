import type { StoryStageCue } from "@/lib/story-stage";
import { sampleStageArrow } from "@/lib/story-stage-arrow";

export function StoryStageArrows({ cue }: { cue: StoryStageCue }) {
  return cue.arrows?.map((_, index) => (
    <svg key={index} data-stage-arrow={index} className="story-stage-arrow" viewBox="0 0 40 8">
      <path d="M2 2L8 4L2 6M6 4H37M33 1L39 4L33 7" fill="none" stroke="#34291e" strokeWidth="3" />
      <path d="M2 2L8 4L2 6M6 4H37" fill="none" stroke="#e4d4a5" strokeWidth="1.4" />
      <path d="M33 1L39 4L33 7Z" fill="#dce4d6" />
    </svg>
  ));
}

export function paintStageArrows(
  stage: HTMLElement,
  cue: StoryStageCue,
  elapsed: number,
  reduced: boolean,
) {
  cue.arrows?.forEach((arrow, index) => {
    const element = stage.querySelector<SVGElement>(`[data-stage-arrow="${String(index)}"]`);
    if (!element) return;
    const at = sampleStageArrow(arrow, elapsed, reduced);
    element.style.display = at.visible ? "block" : "none";
    element.style.left = `${String(at.x)}%`;
    element.style.bottom = `${String(at.bottom)}%`;
    element.style.transform = `translate(-100%, 50%) rotate(${String(at.angle)}deg)`;
  });
}
