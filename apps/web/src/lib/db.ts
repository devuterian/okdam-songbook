import Dexie, { type Table } from "dexie";
import type { PublicData } from "@songbook/shared";

export interface CachedSnapshot {
  id: "public";
  data: PublicData;
  savedAt: string;
}

export interface OfflineQueueItem {
  id: string;
  action: "performance:create" | "performance:cancel";
  songId: string;
  performanceId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  status: "pending" | "failed";
  errorMessage?: string;
}

class SongbookDatabase extends Dexie {
  snapshots!: Table<CachedSnapshot, string>;
  queue!: Table<OfflineQueueItem, string>;

  constructor() {
    super("songbook");
    this.version(1).stores({
      snapshots: "id,savedAt",
      queue: "id,status,createdAt"
    });
  }
}

export const db = new SongbookDatabase();

export async function readCachedPublicData(): Promise<PublicData | null> {
  return (await db.snapshots.get("public"))?.data ?? null;
}

export async function saveCachedPublicData(data: PublicData): Promise<void> {
  await db.snapshots.put({ id: "public", data, savedAt: new Date().toISOString() });
}
