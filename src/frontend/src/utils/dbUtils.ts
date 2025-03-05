// dbUtils.ts
import { openDB, IDBPDatabase } from 'idb';

// Определяем версию кэша
export const CACHE_VERSION = '1.0';

// Создание и открытие базы данных
export const dbPromise: Promise<IDBPDatabase> = openDB("talents-cache", 2, {
    upgrade(db, oldVersion) {
        if (oldVersion < 2) {
            if (!db.objectStoreNames.contains("images")) {
                db.createObjectStore("images");
            }

            if (!db.objectStoreNames.contains("cacheVersion")) {
                const cacheVersionStore = db.createObjectStore("cacheVersion");
                // Храним текущую версию кеша
                cacheVersionStore.put(CACHE_VERSION, "version");
            }
        }
    }
});

// Функции для работы с кэшем
export const getCacheVersion = async (): Promise<string | null> => {
    const db = await dbPromise;
    const version = await db.get("cacheVersion", "version");
    return version || null;
};

export const setCacheVersion = async (): Promise<void> => {
    const db = await dbPromise;
    await db.put("cacheVersion", CACHE_VERSION, "version");
};

export const clearCache = async (): Promise<void> => {
    const db = await dbPromise;
    await db.clear("images");
};

export const cacheImage = async (key: string, blob: Blob): Promise<void> => {
    const db = await dbPromise;
    await db.put("images", blob, key);
};

export const getCachedImage = async (key: string): Promise<string | null> => {
    const db = await dbPromise;
    const blob: Blob | undefined = await db.get("images", key);
    return blob ? URL.createObjectURL(blob) : null;
};
