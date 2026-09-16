import { isRecord } from "./external-input.ts";

export type BackupWriteResponse = { at?: number; error?: string };
export type BackupReadResponse = { backups: { bundle: unknown; at: number }[] };

export function parseBackupWriteResponse(value: unknown): BackupWriteResponse {
  if (!isRecord(value)) throw Error("バックアップの応答を読み取れませんでした。");
  const response: BackupWriteResponse = {};
  if (typeof value.at === "number" && Number.isFinite(value.at)) response.at = value.at;
  if (typeof value.error === "string") response.error = value.error;
  return response;
}

export function parseBackupReadResponse(value: unknown): BackupReadResponse {
  if (!isRecord(value) || !Array.isArray(value.backups))
    throw Error("バックアップの応答を読み取れませんでした。");
  const backups = value.backups.map((copy) => {
    if (!isRecord(copy) || typeof copy.at !== "number" || !Number.isFinite(copy.at))
      throw Error("バックアップの応答を読み取れませんでした。");
    return { bundle: copy.bundle, at: copy.at };
  });
  return { backups };
}
