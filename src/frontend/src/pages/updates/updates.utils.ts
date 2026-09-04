import type { SyntheticEvent } from 'react';
import type { NoteLang, NoteText } from '../../types/patchlog';
import { copy } from './updates.constants';

export const getLang = (language: string): NoteLang => {
    const short = language.split('-')[0] as NoteLang;
    return short in copy ? short : 'en';
};

export const noteText = (note: NoteText, lang: NoteLang): string =>
    (note[lang] || note.en || note.ru || '').trim();

export const titleCase = (id: string) => id.replace(/_/g, ' ');
const stripCustomSuffix = (id: string) => id.replace(/_custom$/, '');
const itemKey = (id: string) => stripCustomSuffix(id.replace(/^item_/, ''));
export const itemName = (id: string) => titleCase(itemKey(id));
export const itemImageKey = (id: string, image?: string | null) =>
    image ? image.replace(/^item_/, '') : itemKey(id);
export const abilityKey = (id: string) => stripCustomSuffix(id);
export const abilityName = (id: string) => titleCase(abilityKey(id));

export const talentNumber = (heroId: string, talentId?: string): string => {
    if (!talentId) return '';
    const stripped = talentId.replace(new RegExp(`^modifier_${heroId}_`), '');
    return stripped === talentId ? talentId.replace(/^modifier_/, '') : stripped;
};

export const PATCH_FALLBACK = {
    ability: 'https://cdn.wodota.net/pages/patches/standard_ability.webp',
    hero: 'https://cdn.wodota.net/pages/patches/standard_hero.webp',
    item: 'https://cdn.wodota.net/pages/patches/standard_item.webp',
    creep: 'https://cdn.wodota.net/pages/patches/standard_creep.webp',
} as const;

export const fallbackOnError = (fallback: string) => (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.src !== fallback) img.src = fallback;
};
