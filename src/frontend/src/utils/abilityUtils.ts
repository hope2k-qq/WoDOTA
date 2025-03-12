import { getImageUrl } from './r2Storage';



const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AbilityImagesDB', 1);

        request.onerror = (event) => {
            reject(event);
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBRequest).result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBRequest).result;
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images', { keyPath: 'abilityKey' });
            }
        };
    });
};

const cacheImageInDB = async (abilityKey: string, imageBlob: Blob): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction('images', 'readwrite');
    const store = transaction.objectStore('images');
    store.put({ abilityKey, imageBlob });

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject(event);
    });
};

const getImageFromDB = async (abilityKey: string): Promise<Blob | null> => {
    const db = await openDB();
    const transaction = db.transaction('images', 'readonly');
    const store = transaction.objectStore('images');
    const request = store.get(abilityKey);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve(request.result ? request.result.imageBlob : null);
        };
        request.onerror = (event) => reject(event);
    });
};

export const getAbilityImageUrl = async (abilityKey: string): Promise<string | null> => {
    try {
        // Сначала пробуем получить изображение из IndexedDB
        const cachedImage = await getImageFromDB(abilityKey);
        if (cachedImage) {
            return URL.createObjectURL(cachedImage);
        }

        const objectKey = `abilities/${abilityKey}.webp`;
        const imageUrl = await getImageUrl(objectKey);

        if (!imageUrl) {
            return null;
        }

        const response = await fetch(imageUrl);
        const blob = await response.blob();

        await cacheImageInDB(abilityKey, blob);

        return URL.createObjectURL(blob);
    } catch (error) {
        console.error(`Error fetching image for ability ${abilityKey}:`, error);
        return null;
    }
};

export const fetchAbilityImages = async (
    heroAbilities: Record<string, any>
): Promise<{ [key: string]: string | null }> => {
    const images: { [key: string]: string | null } = {};

    for (const key in heroAbilities) {
        if (heroAbilities.hasOwnProperty(key)) {
            try {
                const imageUrl = await getAbilityImageUrl(key);
                images[key] = imageUrl;
            } catch (error) {
                console.error(`Error fetching image for ability ${key}:`, error);
                images[key] = null;
            }
        }
    }

    return images;
};



