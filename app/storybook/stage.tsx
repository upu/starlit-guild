import { useMemo, type ComponentProps, type CSSProperties } from "react";
import { StoryStage } from "../story-stage";
import { StagePaintCover } from "./stage-paint-cover";
import { storybookPresentation, storybookStageAttributes } from "@/lib/storybook/presentation";
import { storybookPropCue } from "@/lib/storybook/shared-prop-art";
import "./stage-art.css";
import "./common-props.css";
import "./shared-poses.css";
import "./conversation-actors.css";
import "./reactions.css";
import "./packing.css";
import "./night.css";
import "./forest.css";
import "./waterway.css";
import "./perches.css";
import "./tea-kit.css";
import "./puppets.css";
import "./berne.css";
import "./ground-rest.css";
import "./porch-tray.css";
import "./foundation.css";
import "./manor-door.css";
import "./manor-display.css";
import "./stone-yard.css";
import "./stone-rest.css";
import "./stone-rest-seats.css";
import "./survey-door.css";
import "./survey-garden.css";
import "./reception-well.css";
import "./reception-display.css";
import "./finn-actors.css";
import "./mira-actors.css";
import "./lico-actors.css";
import "./office-extras.css";
import "./night-hand.css";
import "./restoration.css";
import "./linde.css";
import "./lantern.css";
import "./brekka-dining.css";
import "./brekka-visit.css";
import "./moss-trail.css";
import "./moss-second-day.css";
import "./moss-beds.css";
import "./registry.css";
import "./records-field.css";
import "./seedlings.css";
import "./seedling-actions.css";
import "./crew-reactions.css";
import "./transplant-return.css";
import "./transplant-loading.css";
import "./transplant-night.css";
import "./transplant-wheel.css";
import "./founding-departure.css";
import "./founding-return.css";
import "./walnuts.css";
import "./merchant-placement.css";
import "./waterway-unload.css";
import "./waterway-hatch.css";
import "./waterway-opening.css";
import "./waterway-completion.css";
import "./town-return.css";
import "./blockade-fork.css";
import "./households.css";
import "./homeward-office.css";
import "./overlook.css";
import "./lunch.css";
import "./stage.css";
import "./cast-fallback.css";

export function StorybookStage({
  storyId,
  line,
  fallback = false,
  ...props
}: ComponentProps<typeof StoryStage> & {
  storyId: string;
  line: number;
  fallback?: boolean;
}) {
  const paintedCue = useMemo(() => storybookPropCue(props.cue), [props.cue]);
  const presentation = storybookPresentation(storyId, props.cue.background, line);
  if (!presentation) return <StoryStage {...props} />;
  const background = fallback
    ? `/story-stage/${props.cue.background ?? "meeting-path"}.webp`
    : `/storybook-study/${presentation.art}.png`;
  return (
    <div
      className="story-art-space storybook-presentation storybook-reader-stage"
      data-mode={presentation.mode}
      data-art={presentation.art}
      data-story={storyId}
    >
      <div
        className="storybook-painted-stage"
        {...storybookStageAttributes(storyId, line)}
        style={{ "--study-background": `url(${background})` } as CSSProperties}
      >
        <StoryStage {...props} cue={paintedCue} />
      </div>
      {props.cue.cut && (
        <StagePaintCover key={`${presentation.art}:${String(line)}:${String(fallback)}`} />
      )}
    </div>
  );
}

export function StorybookStageLoading() {
  return (
    <div className="story-art-space storybook-reader-stage">
      <div className="storybook-painted-stage storybook-stage-loading" role="status">
        舞台を準備しています…
      </div>
    </div>
  );
}
