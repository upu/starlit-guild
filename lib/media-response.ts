import type { MediaEntry } from "./media-types";

const cacheControl = "private, no-cache";
function hasBody(object: R2Object): object is R2ObjectBody {
  return "body" in object;
}
export function mediaError(status: number) {
  return new Response(null, { status, headers: { "Cache-Control": "private, no-store" } });
}

function byteRange(value: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size)
    return null;
  return { offset: start, length: end - start + 1 };
}

function requestedRange(request: Request, entry: MediaEntry, etag: string) {
  const value = request.headers.get("range");
  const ifRange = request.headers.get("if-range");
  if (request.method === "HEAD" || !value || (ifRange && ifRange !== etag)) return undefined;
  return byteRange(value, entry.size);
}

function unchanged(request: Request, etag: string) {
  const values =
    request.headers
      .get("if-none-match")
      ?.split(",")
      .map((v) => v.trim().replace(/^W\//, "")) ?? [];
  return values.includes(etag) || values.includes("*");
}

function responseHeaders(entry: MediaEntry, etag: string) {
  return new Headers({
    "Content-Type": entry.type,
    "Cache-Control": cacheControl,
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    ETag: etag,
  });
}

function verified(object: R2Object | null, entry: MediaEntry): object is R2Object {
  return !!object && object.size === entry.size && object.customMetadata?.sha256 === entry.sha256;
}

async function notModified(object: R2Object, headers: Headers) {
  if (hasBody(object)) await object.body.cancel();
  return new Response(null, { status: 304, headers });
}

export async function readMedia(request: Request, entry: MediaEntry, bucket?: R2Bucket) {
  if (!bucket) return mediaError(503);
  const etag = `"${entry.sha256}"`;
  const headers = responseHeaders(entry, etag);
  const range = requestedRange(request, entry, etag);
  if (range === null) {
    headers.set("Content-Range", `bytes */${String(entry.size)}`);
    return new Response(null, { status: 416, headers });
  }
  const object =
    request.method === "HEAD"
      ? await bucket.head(entry.key)
      : await bucket.get(entry.key, range ? { range } : {});
  if (!verified(object, entry)) return mediaError(503);
  if (unchanged(request, etag)) return notModified(object, headers);
  headers.set("Content-Length", String(range?.length ?? entry.size));
  if (range)
    headers.set(
      "Content-Range",
      `bytes ${String(range.offset)}-${String(range.offset + range.length - 1)}/${String(entry.size)}`,
    );
  return new Response(hasBody(object) ? object.body : null, { status: range ? 206 : 200, headers });
}
