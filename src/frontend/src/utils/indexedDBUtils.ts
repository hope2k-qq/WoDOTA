const DB_NAME = "AssetsCacheDB";
const CACHE_DURATION = 5 * 60 * 1000;

export const openIndexedDB = async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = () => {
            const db = request.result;
            const stores = ["images", "videos"];
            stores.forEach((store) => {
                if (!db.objectStoreNames.contains(store)) {
                    db.createObjectStore(store);
                }
            });
        };
    });
};

export const storeInIndexedDB = async (storeName: string, key: string, blob: Blob) => {
    const db = await openIndexedDB();
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const cachedData = { blob, timestamp: Date.now() };
    store.put(cachedData, key);

    return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getFromIndexedDB = async (storeName: string, key: string): Promise<Blob | null> => {
    const db = await openIndexedDB();
    const transaction = db.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    return new Promise<Blob | null>((resolve, reject) => {
        request.onsuccess = () => {
            const cachedData = request.result;
            if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
                resolve(cachedData.blob);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject(request.error);
    });
};

// Универсальная функция очистки устаревшего кеша
export const cleanExpiredCache = async () => {
    const db = await openIndexedDB();
    const stores = ["images", "videos"];

    for (const storeName of stores) {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const keysRequest = store.getAllKeys();
        const valuesRequest = store.getAll();

        keysRequest.onsuccess = () => {
            const keys = keysRequest.result;
            valuesRequest.onsuccess = () => {
                const values = valuesRequest.result;
                const currentTime = Date.now();

                values.forEach((data, index) => {
                    if (currentTime - data.timestamp > CACHE_DURATION) {
                        store.delete(keys[index]);
                    }
                });
            };
        };
    }
};


export const fetchVideoFromURL = async (url: string): Promise<Blob | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const videoBlob = await response.blob();
        return videoBlob;
    } catch (error) {
        //console.error('Error fetching video:', error);
        return null;
    }
};