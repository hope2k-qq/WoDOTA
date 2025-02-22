import { getImageUrl } from './r2Storage';

export const getAbilityImageUrl = async (abilityKey: string): Promise<string | null> => {
    const objectKey = `abilities/${abilityKey}.webp`;
    return await getImageUrl(objectKey);
};

export const fetchAbilityImages = async (
    heroAbilities: Record<string, any>
): Promise<{ [key: string]: string | null }> => {
    const images: { [key: string]: string | null } = {};

    for (const key in heroAbilities) {
        if (heroAbilities.hasOwnProperty(key)) {
            const imageUrl = await getAbilityImageUrl(key);
            images[key] = imageUrl;
        }
    }

    return images;
};