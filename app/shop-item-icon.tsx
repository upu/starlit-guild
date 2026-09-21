import { Shield, Swords } from "lucide-react";
import type { ReactNode } from "react";
import type { Equipment } from "@/lib/equipment";

const artwork: Partial<Record<string, ReactNode>> = {
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
  const art = artwork[item.id];
  if (!art)
    return item.slot === "weapon" ? <Swords aria-hidden="true" /> : <Shield aria-hidden="true" />;
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      {art}
    </svg>
  );
}
