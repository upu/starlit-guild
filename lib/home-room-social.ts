import type { Resident } from "./home-room-life.ts";

export type HomeExchange = {
  kind: "welcome" | "chat";
  role: "host" | "guest";
  peer: Resident["id"];
  startedAt: number;
  until: number;
};
export function beginHomeExchange(
  host: Resident,
  guest: Resident,
  now: number,
  kind: HomeExchange["kind"],
) {
  const common = { kind, startedAt: now, until: now + 3600 };
  host.exchange = { ...common, role: "host", peer: guest.id };
  guest.exchange = { ...common, role: "guest", peer: host.id };
  for (const person of [host, guest]) person.until = Math.max(person.until, now + 6500);
}
// Respond after a short listening beat; never bounce both people in unison.
export function homeSocialCue(r: Resident, now: number, reduced = false) {
  const exchange = r.exchange;
  if (!exchange || now >= exchange.until) return null;
  const elapsed = now - exchange.startedAt;
  const replying = elapsed >= 1300 && elapsed < 2400;
  const active = exchange.role === "host" ? elapsed < 1000 : replying;
  const together = elapsed >= 2700;
  const local = elapsed - (exchange.role === "guest" ? 1300 : 0);
  let symbol = together ? "♪" : null;
  if (active) symbol = exchange.role === "host" ? "♪" : "♥";
  return {
    symbol,
    wave: exchange.kind === "welcome" && exchange.role === "guest" && active,
    angle: reduced || !active ? 0 : Math.sin(Math.min(1, local / 900) * Math.PI) * 2,
  };
}
export function cancelHomeExchange(residents: Resident[], id: Resident["id"]) {
  for (const r of residents) if (r.id === id || r.exchange?.peer === id) r.exchange = undefined;
}
