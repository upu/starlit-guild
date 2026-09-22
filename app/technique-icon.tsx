import {
  SquareDashed,
  BowArrow,
  Leaf,
  Sprout,
  Crosshair,
  Swords,
  ShieldPlus,
  Shield,
  Sword,
  Sparkles,
  HeartPlus,
  type LucideIcon,
} from "lucide-react";
import type { TechniqueSlot } from "@/lib/techniques";

const icons: Partial<Record<string, LucideIcon>> = {
  "finn-opening": Crosshair,
  "mira-care": HeartPlus,
  "aria-double": BowArrow,
  "aria-gather": Leaf,
  "aria-herbs": Sprout,
  "aria-aim": Crosshair,
  "leon-step": Swords,
  "leon-guard": ShieldPlus,
  "leon-ready": Shield,
  "leon-sword": Sword,
};

export function TechniqueIcon({ id, slot }: { id?: string | null; slot: TechniqueSlot }) {
  if (!id) return <SquareDashed className="empty-slot-icon" aria-hidden="true" />;
  const Icon = icons[id] || (slot === "active" ? Sparkles : Shield);
  return <Icon className={`technique-icon technique-icon-${slot}`} aria-hidden="true" />;
}
