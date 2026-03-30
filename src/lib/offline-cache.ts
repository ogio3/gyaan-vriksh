import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "gyaan-vriksh-cache";
const STORE_NAME = "responses";
const DB_VERSION = 1;

interface CachedResponse {
  prompt: string;
  response: string;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "prompt" });
          store.createIndex("timestamp", "timestamp");
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheResponse(
  prompt: string,
  response: string
): Promise<void> {
  const db = await getDB();
  const entry: CachedResponse = {
    prompt,
    response,
    timestamp: Date.now(),
  };
  await db.put(STORE_NAME, entry);
}

export async function getCachedResponse(
  prompt: string
): Promise<string | null> {
  const db = await getDB();
  const entry = await db.get(STORE_NAME, prompt);
  return entry?.response ?? null;
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}
