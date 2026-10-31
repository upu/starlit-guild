import type Phaser from "phaser";
import {
  ROAD_CARGO,
  ROAD_DESTINATION,
  ROAD_WORKSITES,
  ROAD_BERNE_WORKSITES,
  ROAD_LEDGER_DESK,
  ROAD_SIGNPOST,
} from "./road-art";

export function registerRoadWorkArt(scene: Phaser.Scene) {
  scene.textures.get(ROAD_SIGNPOST).add("signpost", 0, 470, 340, 370, 605);
  scene.textures.get(ROAD_DESTINATION).add("marker", 0, 209, 86, 874, 1144);
  const work = scene.textures.get(ROAD_WORKSITES);
  const berne = scene.textures.get(ROAD_BERNE_WORKSITES);
  berne.add("stonework", 0, 53, 271, 788, 433);
  berne.add("records", 0, 933, 250, 797, 468);
  scene.textures.get(ROAD_LEDGER_DESK).add("ledger", 0, 15, 240, 1230, 930);
  const objects = [
    [133, 215, 497, 339],
    [798, 147, 564, 433],
    [1504, 195, 538, 398],
  ];
  for (const [index, name] of ["moss", "waterway", "parcels"].entries()) {
    const [x, y, w, h] = objects[index];
    work.add(name, 0, x, y, w, h);
  }
  scene.textures.get(ROAD_CARGO).add("cart", 0, 48, 344, 1164, 582);
}
