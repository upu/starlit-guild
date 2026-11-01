import { roadBackdrop, roadScale } from "./road-layout.ts";

export const STORYBOOK_ROAD = "/storybook-study/village-lane-loop-v1.png";
export const STORYBOOK_MOUNTAIN = "/storybook-study/mountain-lane-loop-v1.png";
export const STORYBOOK_TRANSPLANT = "/storybook-study/transplant-lane-loop-v1.png";
export const STORYBOOK_WAREHOUSE = "/storybook-study/warehouse-landmark-v1.png";
export const STORYBOOK_FOREST = "/storybook-study/forest-lane-loop-v1.png";
export const STORYBOOK_DUSK_FOREST = "/storybook-study/forest-dusk-lane-loop-v1.png";
export const STORYBOOK_MOON_FOREST = "/storybook-study/forest-moon-lane-loop-v1.png";
export const STORYBOOK_WORKSHOP = "/storybook-study/workshop-landmark-v1.webp";
export const STORYBOOK_HILL = "/storybook-study/hill-lane-loop-v1.png";
export const STORYBOOK_HILL_NIGHT = "/storybook-study/hill-night-lane-loop-v1.png";
export const STORYBOOK_HILL_TOWER = "/storybook-study/hill-tower-landmark-v1.webp";
export const STORYBOOK_BERNE_ROAD = "/storybook-study/berne-road-loop-v1.png";

export const isScrollingStorybookRoad = (background: string) =>
  [
    STORYBOOK_ROAD,
    STORYBOOK_MOUNTAIN,
    STORYBOOK_TRANSPLANT,
    STORYBOOK_FOREST,
    STORYBOOK_DUSK_FOREST,
    STORYBOOK_MOON_FOREST,
    STORYBOOK_HILL,
    STORYBOOK_HILL_NIGHT,
    STORYBOOK_BERNE_ROAD,
  ].includes(background);

/** Alternating landscape tiles meet the same painted edge, without a visible cut. */
export function roadForestTileFlip(
  background: string,
  camera: number,
  width: number,
  tileWidth: number,
  stage: string,
) {
  if (
    ![
      STORYBOOK_FOREST,
      STORYBOOK_DUSK_FOREST,
      STORYBOOK_MOON_FOREST,
      STORYBOOK_TRANSPLANT,
      STORYBOOK_MOUNTAIN,
      STORYBOOK_HILL,
      STORYBOOK_HILL_NIGHT,
      STORYBOOK_BERNE_ROAD,
    ].includes(background)
  )
    return null;
  return Math.abs(Math.floor((camera * roadScale(width, stage)) / tileWidth) % 2) === 1;
}

export function roadSceneBackdrop(input: {
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
  camera: number;
  stage: string;
  length: number;
  scrolling: boolean;
}) {
  const { width, height, imageWidth, imageHeight, camera, stage, length, scrolling } = input;
  return scrolling
    ? scrollingRoadBackdrop(width, height, imageWidth, imageHeight, camera, stage)
    : roadBackdrop(width, height, imageWidth, imageHeight, camera / length);
}

/** A repeating ground plane shares the world-to-screen scale of props and feet. */
export function scrollingRoadBackdrop(
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number,
  camera: number,
  stage: string,
) {
  const view = roadBackdrop(width, height, imageWidth, imageHeight, 0);
  const travel = camera * roadScale(width, stage);
  return { ...view, x: -(((travel % view.width) + view.width) % view.width) };
}
