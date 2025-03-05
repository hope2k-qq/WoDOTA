import { getImageUrl } from './r2Storage';

export const getAbilityImageUrl = async (abilityKey: string): Promise<string | null> => {
    const objectKey = `abilities/${abilityKey}.webp`;

    try {
        // Get the URL (resolves the promise) before passing it to fetch
        const imageUrl = await getImageUrl(objectKey);

        // If the URL is null, return early to avoid fetching a null URL
        if (!imageUrl) {
            return null;
        }

        // Fetch the image as a blob
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // Convert the blob to a base64 string
        const base64 = await convertBlobToBase64(blob);

        return base64;
    } catch (error) {
        console.error(`Error fetching image for ability ${abilityKey}:`, error);
        return null;
    }
};


// Helper function to convert a blob to a base64 string
const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as string); // This is the base64 string
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob); // Convert the blob to base64
    });
};


// Функция для получения изображений способностей
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


