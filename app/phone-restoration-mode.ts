import type { PhoneFrameModel } from "./phone-game-types";
import type { RendererStatus } from "./phaser/renderer-session";

export function waitsForScene(quest: string, active: boolean, status: RendererStatus) {
  return (
    active &&
    status === "loading" &&
    ["berne-restoration", "keystone-night-road", "missing-keystone"].includes(quest)
  );
}

export function seedlingHandoffNotice(
  quest: string,
  active: boolean,
  waiting: boolean,
  running: boolean,
) {
  if (quest !== "merrill-seedlings" || !active || running) return undefined;
  return waiting ? "みんなが集まっている。" : "みんなが集まった。";
}

export function berneRestorationHandoff(m: PhoneFrameModel, study: boolean, otherStudy: boolean) {
  const selected = m.squad.run?.quest ?? m.ending?.quest ?? m.quest.id;
  return study || (!otherStudy && selected === "berne-restoration");
}

export function chapterThreeHandoffs(
  m: PhoneFrameModel,
  berneStudy: boolean,
  nightStudy: boolean,
  otherStudy: boolean,
) {
  const selected = m.squad.run?.quest ?? m.ending?.quest ?? m.quest.id;
  return {
    berne: berneRestorationHandoff(m, berneStudy, nightStudy || otherStudy),
    night: nightStudy || (!berneStudy && !otherStudy && selected === "keystone-night-road"),
    foundation: !berneStudy && !nightStudy && !otherStudy && selected === "missing-keystone",
  };
}

export function handoffQuest(
  night: boolean,
  lantern: boolean,
  linde: boolean,
  brekka = false,
  trail = false,
  secondDay = false,
  records = false,
  seedlings = false,
  founding = false,
  town = false,
  moss = false,
  foundation = false,
  forest = false,
  waterwaySearch = false,
) {
  const choices = [
    [waterwaySearch, "old-waterway"],
    [forest, "forest-wetland"],
    [foundation, "missing-keystone"],
    [moss, "tower-moss-removal"],
    [town, "town-deliveries"],
    [night, "keystone-night-road"],
    [lantern, "lantern-detour"],
    [brekka, "brekka-arrival"],
    [trail, "glowing-moss-trail"],
    [secondDay, "glowing-moss-trail-next-day"],
    [records, "lico-records"],
    [seedlings, "merrill-seedlings"],
    [founding, "starlit-guild-founding"],
    [linde, "linde-requests"],
  ] as const;
  return choices.find(([enabled]) => enabled)?.[1] ?? "berne-restoration";
}

export function chapterFourHandoff(
  m: PhoneFrameModel,
  restoration: boolean,
  night: boolean,
  lindeStudy: boolean,
  lanternStudy: boolean,
) {
  const selected = m.squad.run?.quest ?? m.ending?.quest ?? m.quest.id;
  const automatic = !restoration && !night;
  return chapterFourModes(selected, automatic, lindeStudy, lanternStudy);
}

function chapterFourModes(
  selected: string,
  automatic: boolean,
  lindeStudy: boolean,
  lanternStudy: boolean,
) {
  const regular = automatic && !lindeStudy && !lanternStudy;
  return {
    linde: lindeStudy || (automatic && !lanternStudy && selected === "linde-requests"),
    lantern: lanternStudy || (automatic && !lindeStudy && selected === "lantern-detour"),
    brekka: regular && selected === "brekka-arrival",
    trail: regular && selected === "glowing-moss-trail",
    secondDay: regular && selected === "glowing-moss-trail-next-day",
    records: regular && selected === "lico-records",
    seedlings: regular && selected === "merrill-seedlings",
    founding: regular && selected === "starlit-guild-founding",
  };
}
