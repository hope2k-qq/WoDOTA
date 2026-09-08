
export const copy = {
    ru: {
        eyebrow: 'Обновление баланса', general: 'Общие изменения', global: 'Глобальные изменения',
        items: 'Изменения предметов', heroes: 'Изменения героев', abilities: 'Способности',
        talents: 'Таланты', base: 'Основные параметры',
        str: 'Сила', agi: 'Ловкость', int: 'Интеллект',
        bosses: 'Изменения боссов', neutralCreeps: 'Нейтральные крипы',
        baseItems: 'Основные предметы', upgradeItems: 'Улучшения',
        neutralItems: 'Нейтральные предметы', neutralArtifacts: 'Артефакты', neutralEnhancements: 'Чары',
        newBadge: 'Новый', newHeroBadge: 'Новый герой',
        empty: 'Для этого патча изменений нет',
    },
    en: {
        eyebrow: 'Balance update', general: 'General changes', global: 'Global changes',
        items: 'Item changes', heroes: 'Hero changes', abilities: 'Abilities',
        talents: 'Talents', base: 'Base attributes',
        str: 'Strength', agi: 'Agility', int: 'Intelligence',
        bosses: 'Boss changes', neutralCreeps: 'Neutral creeps',
        baseItems: 'Basic items', upgradeItems: 'Upgrades',
        neutralItems: 'Neutral items', neutralArtifacts: 'Artifacts', neutralEnhancements: 'Enhancements',
        newBadge: 'New', newHeroBadge: 'New hero',
        empty: 'No changes for this patch',
    },
    uk: {
        eyebrow: 'Оновлення балансу', general: 'Загальні зміни', global: 'Глобальні зміни',
        items: 'Зміни предметів', heroes: 'Зміни героїв', abilities: 'Здібності',
        talents: 'Таланти', base: 'Основні параметри',
        str: 'Сила', agi: 'Спритність', int: 'Інтелект',
        bosses: 'Зміни босів', neutralCreeps: 'Нейтральні кріпи',
        baseItems: 'Основні предмети', upgradeItems: 'Покращення',
        neutralItems: 'Нейтральні предмети', neutralArtifacts: 'Артефакти', neutralEnhancements: 'Чари',
        newBadge: 'Новий', newHeroBadge: 'Новий герой',
        empty: 'Для цього патчу змін немає',
    },
    cs: {
        eyebrow: 'Aktualizace vyvážení', general: 'Obecné změny', global: 'Globální změny',
        items: 'Změny předmětů', heroes: 'Změny hrdinů', abilities: 'Schopnosti',
        talents: 'Talenty', base: 'Základní atributy',
        str: 'Síla', agi: 'Obratnost', int: 'Inteligence',
        bosses: 'Změny bossů', neutralCreeps: 'Neutrální jednotky',
        baseItems: 'Základní předměty', upgradeItems: 'Vylepšení předmětů',
        neutralItems: 'Neutrální předměty', neutralArtifacts: 'Artefakty', neutralEnhancements: 'Vylepšení',
        newBadge: 'Nový', newHeroBadge: 'Nový hrdina',
        empty: 'Pro tento patch nejsou žádné změny',
    },
};

export type Copy = (typeof copy)['ru'];
