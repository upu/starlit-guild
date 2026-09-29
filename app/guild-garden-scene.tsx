import { ArrowLeft, Sprout, ShoppingBasket } from "lucide-react";
import type { State } from "@/lib/game";
import { GuildResidents } from "./guild-residents";
import { GuildPlant } from "./guild-plant";

export type GardenSite = "linde" | "brekka";
export const gardenSites = { linde: "リンデの菜園", brekka: "ブレッカの栽培所" };
type GardenSceneProps = {
  state: State;
  now: number;
  site: GardenSite;
  onSite: (site: GardenSite) => void;
  onHome: () => void;
  onTend: () => void;
  onShop: () => void;
};

export function GuildGardenScene({
  state,
  now,
  site,
  onSite,
  onHome,
  onTend,
  onShop,
}: GardenSceneProps) {
  return (
    <>
      <GardenNavigation site={site} onSite={onSite} onHome={onHome} />
      <div className={`guild-scene guild-garden-scene garden-${site}`}>
        <div className="guild-scene-art" aria-hidden="true" />
        <span className="guild-location guild-location-loft">
          {site === "linde" ? "倉庫の裏 · 薬草と野菜" : "塔から離れた栽培所 · 苔の記録と乾燥"}
        </span>
        {site === "linde" ? (
          <>
            <GuildPlant plot={state.guild?.plots["linde-1"]} index={0} now={now} />
            <GuildPlant plot={state.guild?.plots["linde-2"]} index={1} now={now} />
          </>
        ) : (
          <GuildPlant plot={state.guild?.plots["brekka-1"]} index={0} now={now} />
        )}
        <GuildResidents state={state} site={site} />
        <button
          className="guild-hotspot hotspot-tend"
          onClick={onTend}
          aria-label="菜園の世話をする"
        >
          <span>
            <Sprout size={16} aria-hidden="true" />
            {site === "linde" ? "プランター" : "苔床"}
          </span>
          <small>{state.guild?.roles[site] ? "育ち具合・担当" : "世話係を決める"}</small>
        </button>
        <button
          className="guild-hotspot hotspot-garden-shop"
          onClick={onShop}
          aria-label="種・材料"
        >
          <span>
            <ShoppingBasket size={16} aria-hidden="true" />
            種・材料
          </span>
          <small>買い足す</small>
        </button>
      </div>
    </>
  );
}

function GardenNavigation({
  site,
  onSite,
  onHome,
}: Pick<GardenSceneProps, "site" | "onSite" | "onHome">) {
  return (
    <nav className="guild-location-nav" aria-label="栽培地を選ぶ">
      <button onClick={onHome} aria-label="旅団ホームへ戻る">
        <ArrowLeft size={18} aria-hidden="true" />
        ホーム
      </button>
      {Object.entries(gardenSites).map(([id, label]) => (
        <button
          key={id}
          aria-pressed={site === id}
          onClick={() => {
            onSite(id as GardenSite);
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
