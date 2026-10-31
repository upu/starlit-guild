import type Phaser from "phaser";
import {
  groupRoadLabels,
  roadLabelBody,
  roadLabelWrapWidth,
  RoadLabelLayout,
  type RoadRect,
} from "@/lib/road-label-layout";
import type { RoadBattle } from "@/lib/road-view";
import type { RoadLook } from "@/lib/chapter-road-presentation";
import { enemyLabel, enemyArrived } from "./road-enemy-appearance";

type Figure = { image: Phaser.GameObjects.Image; label: Phaser.GameObjects.Text };

export class RoadEnemyLabels {
  private layout = new RoadLabelLayout();

  paint(
    state: RoadBattle,
    look: RoadLook,
    reduced: boolean,
    heroes: Map<string, Figure>,
    enemies: Map<number, Figure>,
    gathering: Phaser.GameObjects.Image,
    width: number,
    height: number,
    workCaption?: RoadRect,
    props: RoadRect[] = [],
  ) {
    const bodies: RoadRect[] = [...props];
    if (workCaption) bodies.push(workCaption);
    for (const hero of heroes.values()) {
      if (!hero.image.visible) continue;
      bodies.push(hero.image.getBounds());
      if (hero.label.visible) bodies.push(hero.label.getBounds());
    }
    if (gathering.visible) bodies.push(gathering.getBounds());
    const named = namedEnemies(state, look, reduced, enemies, bodies);
    const labels = groupRoadLabels(named).flatMap((group) => {
      const text = enemies.get(group.owner)?.label;
      if (!text) return [];
      text.setText(group.text).setWordWrapWidth(roadLabelWrapWidth(group.anchor.x, width), true);
      return [{ ...group, width: text.width, height: text.height }];
    });
    const positions = this.layout.place(labels, bodies, width, height);
    for (const group of labels) {
      const rect = positions.get(group.key);
      if (rect)
        enemies
          .get(group.owner)
          ?.label.setPosition(rect.x + rect.width / 2, rect.y)
          .setVisible(true);
    }
  }
}

function enemyBody(figure: Figure, enemy: RoadBattle["enemies"][number], look: RoadLook) {
  const frame = Object.hasOwn(look.enemies, enemy.id) ? look.enemies[enemy.id].frame : undefined;
  return roadLabelBody(figure.image.getBounds(), enemy.kind, !!look.storybookHeroes, frame);
}

function namedEnemies(
  state: RoadBattle,
  look: RoadLook,
  reduced: boolean,
  enemies: Map<number, Figure>,
  bodies: RoadRect[],
) {
  const named = [];
  for (const enemy of state.enemies) {
    const figure = enemies.get(enemy.id);
    if (!figure) continue;
    figure.label.setVisible(false);
    if (!enemyArrived(enemy, state.time, reduced) || (enemy.hp <= 0 && !enemy.pose)) continue;
    const body = enemyBody(figure, enemy, look);
    bodies.push(body);
    // Health bars extend slightly below the sprite's feet.
    bodies.push({
      x: figure.image.x - body.width / 2,
      y: figure.image.y + 4,
      width: body.width,
      height: 7,
    });
    // The 4-7 heading already names the apparatus; a detached nameplate can
    // otherwise be placed beneath Finn and appear to label him as the target.
    if (!enemy.pose && !(look.mossBeds?.records && enemy.kind === "lico"))
      named.push({ id: enemy.id, kind: enemy.kind, text: enemyLabel(enemy, look), body });
  }
  return named;
}
