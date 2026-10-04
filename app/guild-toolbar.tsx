import Image from "next/image";
import { GuildItemIcon } from "./guild-item-icon";
export function GuildToolbar({
  garden,
  onHome,
  onGarden,
  onShop,
}: {
  garden: boolean;
  onHome: () => void;
  onGarden: () => void;
  onShop: () => void;
}) {
  return (
    <nav className="guild-toolbar" aria-label="旅団の操作">
      <button onClick={onHome} aria-label="旅団ホーム" aria-pressed={!garden}>
        <Image src="/ui/guild-banner.svg" width={32} height={32} alt="" unoptimized />
        <span>ホーム</span>
      </button>
      <button onClick={onGarden} aria-label="菜園" aria-pressed={garden}>
        <GuildItemIcon id="herb-seed" />
        <span>菜園</span>
      </button>
      <button data-guild-control="shop" onClick={onShop} aria-label="種・材料">
        <Image src="/ui/shop-stall.png" width={32} height={32} alt="" unoptimized />
        <span>種・材料</span>
      </button>
    </nav>
  );
}
