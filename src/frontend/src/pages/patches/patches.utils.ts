import type { NoteLang, Localized } from '../../types/patchlog';
import { copy } from './patches.constants';
import { getImageUrl } from '../../utils/r2Storage';

// Картинки патча в published обрезаны до имени файла (без «/») и лежат в папке
// pages/patches/<version>/. Полные пути (превью героев, стандартные картинки) — как есть.
export const patchImageUrl = (image?: string | null, version?: string): string => {
    if (!image) return getImageUrl('');
    if (version && !image.includes('/')) return getImageUrl(`pages/patches/${version}/${image}`);
    return getImageUrl(image);
};

export const getLang = (language: string): NoteLang => {
    const short = language.split('-')[0] as NoteLang;
    return short in copy ? short : 'en';
};

export const noteText = (note: Localized | null | undefined): string => (note ?? '').trim();
