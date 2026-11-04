import { env } from "cloudflare:workers";
import manifest from "virtual:starlit-media";
import { mediaError, readMedia } from "@/lib/media-response";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const entry = manifest[new URL(request.url).pathname];
  if (!entry) return mediaError(404);
  try {
    return await readMedia(request, entry, env.BUCKET);
  } catch {
    return mediaError(503);
  }
}
export const HEAD = GET;
