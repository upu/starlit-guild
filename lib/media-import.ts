import { timingSafeEqual } from "node:crypto";
import type { MediaEntry } from "./media-types";
import { mediaError } from "./media-response";

function authorized(request: Request, secret?: string) {
  if (!secret || secret.length < 32) return false;
  const actual = new TextEncoder().encode(request.headers.get("authorization") ?? "");
  const expected = new TextEncoder().encode(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function uploadEntry(request: Request): MediaEntry | null {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  const match = /^media\/([a-f0-9]{64})\.(png|webp|jpg|jpeg|svg|mp4|m4a|mp3|ogg|wav|json)$/.exec(
    key,
  );
  const size = Number(request.headers.get("x-asset-size"));
  if (!match || !Number.isSafeInteger(size) || size < 1 || size > 64 * 1024 * 1024) return null;
  const types: Record<string, string> = {
    png: "image/png",
    webp: "image/webp",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
    wav: "audio/wav",
    json: "application/json",
  };
  return { key, sha256: match[1], size, type: types[match[2]] };
}

export async function importMedia(request: Request, bucket?: R2Bucket, secret?: string) {
  if (!authorized(request, secret)) return mediaError(404);
  const entry = uploadEntry(request);
  if (!entry) return mediaError(400);
  if (!bucket) return mediaError(503);
  const existing = await bucket.head(entry.key);
  const present = existing?.size === entry.size && existing.customMetadata?.sha256 === entry.sha256;
  if (request.method === "HEAD") return mediaError(present ? 200 : 404);
  if (request.method !== "PUT") return mediaError(405);
  if (request.headers.get("content-length") !== String(entry.size) || !request.body)
    return mediaError(400);
  if (present) return mediaError(204);
  // R2 verifies SHA-256 while consuming the stream; mismatched bytes are never stored.
  await bucket.put(entry.key, request.body, {
    sha256: entry.sha256,
    httpMetadata: { contentType: entry.type },
    customMetadata: { sha256: entry.sha256 },
  });
  return mediaError(201);
}
