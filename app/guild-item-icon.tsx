import { consumableById } from "@/lib/consumables";
import { ShopItemIcon } from "./shop-item-icon";

function MaterialArt({ id }: { id: string }) {
  if (id === "carrot" || id === "carrot-seed")
    return (
      <>
        <path d="m16 14 15 8-20 15Z" fill="#e9a14c" stroke="#945427" strokeWidth="2" />
        <path d="m27 18 2-13m-1 13 8-8m-9 7-5-9" stroke="#88b368" strokeWidth="3" />
      </>
    );
  if (id === "dried-moss" || id === "moss-spore")
    return (
      <>
        <path
          d="M5 31Q3 22 11 21Q10 10 20 16Q27 7 31 20Q40 18 36 31Z"
          fill="#789f7a"
          stroke="#b4d29b"
          strokeWidth="2"
        />
        <path d="m12 28 4-7m6 7 3-9m5 10 3-4" stroke="#476449" strokeWidth="2" />
      </>
    );
  if (id === "herb-seed")
    return (
      <>
        <path d="M19 35V15M19 26 8 16m11 7L31 10" stroke="#cbdc9d" strokeWidth="3" />
        <ellipse cx="11" cy="18" rx="7" ry="4" fill="#89b46c" transform="rotate(35 11 18)" />
        <ellipse cx="27" cy="15" rx="9" ry="5" fill="#aed184" transform="rotate(-40 27 15)" />
      </>
    );
  return <PantryArt id={id} />;
}
function PantryArt({ id }: { id: string }) {
  if (id === "walnut")
    return (
      <>
        <ellipse cx="20" cy="22" rx="13" ry="14" fill="#ab784a" stroke="#edca8b" strokeWidth="2" />
        <path
          d="M20 9q-6 8 0 14t0 12M13 13q-6 7 0 16m14-16q6 7 0 16"
          fill="none"
          stroke="#714c35"
          strokeWidth="2"
        />
      </>
    );
  if (id === "honey")
    return (
      <>
        <path d="M11 13h18l4 8v14H7V21Z" fill="#d4a441" stroke="#f2d690" strokeWidth="2" />
        <path d="M11 7h18v7H11Z" fill="#aa7747" />
        <path d="m19 19 7 4v7l-7 4-7-4v-7Z" fill="#f4d080" />
      </>
    );
  if (id === "butter")
    return (
      <>
        <path d="m5 25 23-7 9 9-23 8Z" fill="#c0cec0" />
        <path d="m10 17 16-5 6 6v10l-16 5-6-6Z" fill="#f3d78e" stroke="#bc9148" strokeWidth="2" />
        <path d="m10 17 6 6 16-5m-16 5v10" fill="none" stroke="#ffeabd" strokeWidth="2" />
      </>
    );
  return (
    <>
      <path
        d="M13 8h14l-3 8q12 8 9 18H7q-3-10 9-18Z"
        fill="#dac293"
        stroke="#90714c"
        strokeWidth="2"
      />
      <path d="M12 15h16M20 20v11m-5-7 5 4 5-4" fill="none" stroke="#9e804d" strokeWidth="2" />
    </>
  );
}
export function GuildItemIcon({ id }: { id: string }) {
  const item = consumableById(id);
  if (item) return <ShopItemIcon item={item} />;
  const seed = id.endsWith("seed") || id === "moss-spore";
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      {seed && <path d="M7 3h26v34H7Z" fill="#bfa77b" stroke="#f1dbac" strokeWidth="2" />}
      <g transform={seed ? "translate(6 5) scale(.7)" : undefined}>
        <MaterialArt id={id} />
      </g>
    </svg>
  );
}
