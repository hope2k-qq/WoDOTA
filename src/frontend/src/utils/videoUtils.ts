


// Функция для получения URL видео
export const getVideoUrl = (name: string) =>
    `http://localhost:5000/proxy/video?url=https://cdn.akamai.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/${name}.webm`;

// Функция для получения URL изображения
export const getImageUrl = (name: string) =>
    `https://cdn.akamai.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/${name}.png`;

// Функция для открытия IndexedDB
const openIndexedDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('videoCache', 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBRequest).result;
            if (!db.objectStoreNames.contains('videos')) {
                db.createObjectStore('videos');
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBRequest).result);
        };

        request.onerror = (event) => {
            reject('IndexedDB failed to open');
        };
    });
};

// Функция для сохранения видео в IndexedDB
export const saveVideoToIndexedDB = async (name: string, videoBlob: Blob) => {
    try {
        const db = await openIndexedDB();
        const transaction = db.transaction('videos', 'readwrite');
        const store = transaction.objectStore('videos');

        store.put(videoBlob, name);

        transaction.oncomplete = () => {
            console.log('Video saved to IndexedDB');
            localStorage.setItem(`video_${name}_timestamp`, Date.now().toString());
        };
    } catch (error) {
        console.error('Error saving video to IndexedDB:', error);
    }
};

// Функция для удаления видео из IndexedDB
export const deleteVideoFromIndexedDB = async (name: string) => {
    try {
        const db = await openIndexedDB();
        const transaction = db.transaction('videos', 'readwrite');
        const store = transaction.objectStore('videos');

        store.delete(name);

        transaction.oncomplete = () => {
            console.log(`Video ${name} deleted from IndexedDB`);
        };
    } catch (error) {
        console.error('Error deleting video from IndexedDB:', error);
    }
};

// Функция для извлечения видео из IndexedDB
export const getVideoFromIndexedDB = async (name: string): Promise<Blob | null> => {
    return new Promise((resolve, reject) => {
        openIndexedDB()
            .then((db) => {
                const transaction = db.transaction('videos', 'readonly');
                const store = transaction.objectStore('videos');
                const request = store.get(name);

                request.onsuccess = () => {
                    const result = request.result;
                    if (result) {
                        resolve(result);
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = () => {
                    reject('Failed to retrieve video');
                };
            })
            .catch((error) => {
                console.error('Error retrieving video from IndexedDB:', error);
                reject(error);
            });
    });
};

// Функция для удаления всех истекших видео из IndexedDB
export const deleteExpiredVideos = async () => {
    try {
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith('video_'));

        for (const key of allKeys) {
            const timestamp = localStorage.getItem(key);
            if (timestamp) {
                const heroName = key.split('video_')[1].split('_timestamp')[0];
                if (Date.now() - parseInt(timestamp) > 180000) {
                    console.log(`Video for hero ${heroName} expired. Deleting from cache.`);
                    await deleteVideoFromIndexedDB(heroName);
                    localStorage.removeItem(key);
                }
            }
        }
    } catch (error) {
        console.error('Error deleting expired videos:', error);
    }
};

// Функция для загрузки и кэширования видео
export const fetchAndCacheVideo = async (
    name: string,
    setVideoBlob: (blob: Blob) => void,
    setVideoLoaded: (loaded: boolean) => void,
    handleVideoError: () => void
) => {
    console.log(`Attempting to load video for hero: ${name}`);

    await deleteExpiredVideos();

    const cachedVideoBlob = await getVideoFromIndexedDB(name);

    if (cachedVideoBlob) {
        console.log('Video found in cache');
        setVideoBlob(cachedVideoBlob);
        setVideoLoaded(true);
    } else {
        console.log('Video not found in cache, fetching from server...');
        try {
            const videoUrl = getVideoUrl(name);
            const response = await fetch(videoUrl);

            if (!response.ok) {
                console.error('Failed to fetch video from server:', videoUrl);
                throw new Error('Video not found');
            }

            const videoBlob = await response.blob();
            console.log(`Saving video to IndexedDB for ${name}`);
            await saveVideoToIndexedDB(name, videoBlob);

            setVideoBlob(videoBlob);
            setVideoLoaded(true);
        } catch (error) {
            console.error('Error fetching or saving video:', error);
            handleVideoError();
        }
    }
};
