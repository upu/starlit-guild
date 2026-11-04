import { env } from "cloudflare:workers";
import { importMedia } from "@/lib/media-import";
import { mediaError } from "@/lib/media-response";

export const dynamic = "force-dynamic";
export async function PUT(request: Request) {
  try {
    return await importMedia(request, env.BUCKET, env.ASSET_UPLOAD_TOKEN);
  } catch {
    return mediaError(503);
  }
}
export const HEAD = PUT;
