import type { RoadViewport } from "./road-cart-layout.ts";
import type { Traveller } from "./road-view.ts";
import type { WaterwayActions } from "./road-waterway-contacts.ts";
import { housecallsLayout } from "./road-housecalls-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";

export const SURVEY_RETURN_FIGURE_SCALE = 1.33;
export const surveyReturnAssets = {
  gloves: "/storybook-study/finn-gloves-balanced-v2.webp",
  rucksack: "/storybook-study/tool-rucksack-v1.webp",
};
export function surveyReturnTarget(id: Traveller["id"]): [number, number] {
  const points: Partial<Record<Traveller["id"], [number, number]>> = {
    aria: [492, 726],
    leon: [724, 726],
    mira: [613, 579],
    finn: [978, 726],
  };
  return points[id] ?? [1200, 850];
}
export function surveyReturnScene(
  scene: WaterwayActions,
  view: RoadViewport,
  gardener: string,
  pot: string,
) {
  const l = housecallsLayout(view);
  const foot = l.world(1188, 461);
  scene.actors = [
    {
      id: "survey-gardener",
      point: foot,
      size: l.figureRatio * SURVEY_RETURN_FIGURE_SCALE,
      pose: { asset: gardener, cell: 128, rows: 2, frame: 6, square: { foot: 120, height: 95 } },
    },
  ];
  scene.poses.finn = { asset: surveyReturnAssets.gloves, frame: 0, rows: 2 };
  const plant = housecallProp(view, "survey-return-pot", pot, l.world(1160, 395), 66);
  plant.depth = foot.lane + 0.03;
  const bag = housecallProp(
    view,
    "survey-rucksack",
    surveyReturnAssets.rucksack,
    l.world(748, 660),
    72,
  );
  bag.depth = l.world(724, 726).lane - 0.03;
  scene.props.push(plant, bag);
}
