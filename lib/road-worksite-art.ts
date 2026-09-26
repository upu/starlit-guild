import type { RoadBattle } from "./road-view.ts";

export type WorksiteArt = {
  asset: string;
  frame?: string;
  cargo: boolean;
  task: NonNullable<RoadBattle["gathering"]>["task"];
};
const atlas = (asset: string, frame: string, task: WorksiteArt["task"]): WorksiteArt => ({
  asset: `/animations/road/${asset}-v1.webp`,
  frame,
  task,
  cargo: false,
});
const icon = (name: string, task: WorksiteArt["task"] = "inspect"): WorksiteArt => ({
  asset: `/animations/road/work-${name}-v1.webp`,
  frame: "__BASE",
  task,
  cargo: false,
});

export const worksiteArt = {
  cart: { asset: "/animations/road/cargo-v1.webp", frame: "cart", cargo: true, task: "inspect" },
  herb: { asset: "/animations/road/herb-v2.webp", cargo: false, task: "gather" },
  "moss-lamp": { asset: "/items/moss-lamp.png", cargo: false, task: "inspect" },
  moss: atlas("worksites", "moss", "gather"),
  waterway: atlas("worksites", "waterway", "gather"),
  parcels: atlas("worksites", "parcels", "pack"),
  stonework: atlas("berne-worksites", "stonework", "gather"),
  records: atlas("berne-worksites", "records", "inspect"),
  ledger: atlas("ledger-desk", "ledger", "inspect"),
  signpost: {
    asset: "/animations/road/signpost-v2.webp",
    frame: "signpost",
    cargo: false,
    task: "inspect",
  },
  letters: icon("letters"),
  lantern: icon("lantern"),
  medicine: icon("medicine", "pack"),
  route: icon("route"),
  grass: icon("grass", "gather"),
  earthwork: icon("earthwork", "gather"),
  "moss-basket": icon("moss-basket"),
  "seedling-cart": { ...icon("seedling-cart"), cargo: true },
  "empty-bottles": icon("empty-bottles", "pack"),
} satisfies Record<string, WorksiteArt>;
export type WorksiteKind = keyof typeof worksiteArt;
