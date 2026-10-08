// Only accept Discord's HTTPS invite forms; a missing or invalid setting hides the entry.
export function discordInviteUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  return /^https:\/\/(?:discord\.gg\/|discord\.com\/invite\/)[A-Za-z0-9-]+\/?$/.test(url)
    ? url
    : null;
}
