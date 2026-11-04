export interface MediaEntry {
  key: string;
  sha256: string;
  size: number;
  type: string;
}
export type MediaManifest = Record<string, MediaEntry | undefined>;
