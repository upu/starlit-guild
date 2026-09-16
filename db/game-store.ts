import { env } from "cloudflare:workers";
export function gameDb() {
  if (!env.DB) throw Error("Save database unavailable");
  return env.DB;
}
