import Image from "next/image";
import { GuildItemIcon } from "./guild-item-icon";
import { UserRound } from "lucide-react";
export function GuildToolbar({
  garden,
  onHome,
  onGarden,
  onWorkbench,
  onShop,
  onRoles,
}: {
  garden: boolean;
  onHome: () => void;
  onGarden: () => void;
  onWorkbench: () => void;
  onShop: () => void;
  onRoles: () => void;
}) {
  return (
    <nav className="guild-toolbar" aria-label="旅団の操作">
      {garden ? (
        <button onClick={onHome} aria-label="旅団ホームへ戻る">
          <Image src="/ui/guild-banner.svg" width={32} height={32} alt="" unoptimized />
          <span>ホーム</span>
        </button>
      ) : (
        <button onClick={onGarden} aria-label="菜園">
          <GuildItemIcon id="herb-seed" />
          <span>菜園</span>
        </button>
      )}
      {garden ? (
        <button data-guild-control="roles" onClick={onRoles} aria-label="担当">
          <UserRound size={30} />
          <span>担当</span>
        </button>
      ) : (
        <button data-guild-control="workbench" onClick={onWorkbench} aria-label="作業台">
          <GuildItemIcon id="guild-tea" />
          <span>作業台</span>
        </button>
      )}
      <button data-guild-control="shop" onClick={onShop} aria-label="種・材料">
        <Image src="/ui/shop-stall.png" width={32} height={32} alt="" unoptimized />
        <span>種・材料</span>
      </button>
    </nav>
  );
}
