import { Plus } from "lucide-react";
import { heroes } from "@/lib/game";
import { Portrait } from "./portrait";

export function GuildDutyFace({ id }: { id?: string }) {
  const hero = heroes.find((item) => item.id === id);
  return (
    <span className="guild-duty-face">
      {hero ? <Portrait index={hero.sprite} size={36} /> : <Plus size={25} />}
    </span>
  );
}
