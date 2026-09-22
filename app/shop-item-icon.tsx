import { Shield, Swords } from "lucide-react";
import type { ReactNode } from "react";
import type { Equipment } from "@/lib/equipment";

const artwork: Partial<Record<string, ReactNode>> = {
  "familiar-staff": (
    <>
      <path d="M13 35L25 11" stroke="#ab83bf" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 4A7 7 0 1 0 33 15A7 7 0 0 1 28 4Z" fill="#e4c889" stroke="#fff0bb" />
    </>
  ),
  "familiar-bow": (
    <>
      <path d="M12 5Q36 20 12 35" fill="none" stroke="#aa7950" strokeWidth="4" />
      <path
        d="M12 5L17 20 12 35M6 20H32M28 17L32 20 28 23"
        fill="none"
        stroke="#e3d4b2"
        strokeWidth="1.5"
      />
      <path d="M21 16V24" stroke="#624531" strokeWidth="3" />
    </>
  ),
  "familiar-sword": (
    <>
      <path d="M14 25L28 7 32 7 32 12 18 29Z" fill="#a4babd" stroke="#647f85" />
      <path d="M11 24L21 33" stroke="#ad9460" strokeWidth="3" />
      <path d="M15 29L9 35" stroke="#856043" strokeWidth="5" />
    </>
  ),
  "travel-clothes": (
    <>
      <path
        d="M14 7L20 10 26 7 35 16 29 21 27 18 28 35H12L13 18 11 21 5 16Z"
        fill="#9b9c7b"
        stroke="#d1c9a4"
        strokeWidth="1.5"
      />
      <path d="M16 8L20 16 24 8M12 27H28" fill="none" stroke="#646849" strokeWidth="2" />
    </>
  ),
  "ash-bow": (
    <>
      <path d="M12 5Q41 20 12 35" fill="none" stroke="#d6a566" strokeWidth="4" />
      <path
        d="M12 5L20 20 12 35M6 20H35M30 16L35 20 30 24"
        fill="none"
        stroke="#efe3b5"
        strokeWidth="1.5"
      />
      <path d="M23 16L25 20 23 24" stroke="#7a5335" strokeWidth="3" />
    </>
  ),
  "steel-sword": (
    <>
      <path d="M13 24L29 5 35 5 35 11 18 29Z" fill="#c5dce0" stroke="#698d97" />
      <path d="M17 25L32 8" stroke="#f5f5dd" strokeWidth="2" />
      <path d="M8 23L20 35" stroke="#d6b66c" strokeWidth="4" />
      <path d="M13 29L7 35" stroke="#ac794b" strokeWidth="5" />
    </>
  ),
  "leather-vest": (
    <>
      <path
        d="M13 6L18 9H22L27 6 30 15 34 18 30 35H10L6 18 10 15Z"
        fill="#aa754d"
        stroke="#dfb985"
        strokeWidth="1.5"
      />
      <path d="M17 8L20 15 23 8M20 15V34M11 28H29" fill="none" stroke="#583e32" strokeWidth="2" />
      <path d="M17 18H23M17 22H23" stroke="#e6d4a0" strokeWidth="1.5" />
    </>
  ),
  "gathering-coat": (
    <>
      <path
        d="M14 6L20 9 26 6 35 16 30 21 27 18 30 35H10L13 18 10 21 5 16Z"
        fill="#6b9170"
        stroke="#c1d49a"
        strokeWidth="1.5"
      />
      <path d="M16 7L20 15 24 7M20 15V35" fill="none" stroke="#d5c790" strokeWidth="2" />
      <path d="M12 24H17V29H12ZM23 24H28V29H23Z" fill="#365b48" stroke="#a8be86" />
    </>
  ),
};

// Small silhouettes stay distinct at 40px; unknown items retain a slot fallback.
export function ShopItemIcon({ item }: { item: Equipment }) {
  const family: Partial<Record<string, string>> = {
    "berne-bow": "ash-bow",
    "berne-sword": "steel-sword",
    "berne-staff": "familiar-staff",
    "berne-dagger": "familiar-sword",
    "familiar-dagger": "familiar-sword",
    "berne-jacket": "leather-vest",
    "berne-workcoat": "gathering-coat",
  };
  const art = artwork[family[item.id] ?? item.id];
  if (!art)
    return item.slot === "weapon" ? <Swords aria-hidden="true" /> : <Shield aria-hidden="true" />;
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      {art}
    </svg>
  );
}
