
export const copy = {
    ru: {
        eyebrow: 'Обновление баланса', general: 'Общие изменения', global: 'Глобальные изменения',
        items: 'Изменения предметов', heroes: 'Изменения героев', abilities: 'Способности',
        talents: 'Таланты', base: 'Основные параметры', added: 'Добавлен герой', removed: 'Удалён герой',
        str: 'Сила', agi: 'Ловкость', int: 'Интеллект',
        bosses: 'Изменения боссов', neutralCreeps: 'Нейтральные крипы', innate: 'Врождённая',
        neutralItems: 'Нейтральные предметы', neutralArtifacts: 'Артефакты', neutralEnhancements: 'Чары', tier: 'Тир', rank: 'Разряд', newRank: 'Новый разряд', newBadge: 'Новый', newItemBadge: 'Новый предмет', newHeroBadge: 'Новый герой',
        category: 'Категория',
        shopCategories: {
            consumables: 'Расходники', attributes: 'Атрибуты', weapons_armor: 'Оружие и броня',
            misc: 'Разное', secretshop: 'Потайная лавка', basics: 'Основные', support: 'Поддержка',
            magics: 'Магия', defense: 'Защита', weapons: 'Оружие', artifacts: 'Артефакты',
        },
        loading: 'Загружаем изменения…', error: 'Не удалось загрузить патч', retry: 'Повторить',
        empty: 'Для этого патча изменений нет',
    },
    en: {
        eyebrow: 'Balance update', general: 'General changes', global: 'Global changes',
        items: 'Item changes', heroes: 'Hero changes', abilities: 'Abilities',
        talents: 'Talents', base: 'Base attributes', added: 'Hero added', removed: 'Hero removed',
        str: 'Strength', agi: 'Agility', int: 'Intelligence',
        bosses: 'Boss changes', neutralCreeps: 'Neutral creeps', innate: 'Innate',
        neutralItems: 'Neutral items', neutralArtifacts: 'Artifacts', neutralEnhancements: 'Enhancements', tier: 'Tier', rank: 'Rank', newRank: 'New rank', newBadge: 'New', newItemBadge: 'New item', newHeroBadge: 'New hero',
        category: 'Category',
        shopCategories: {
            consumables: 'Consumables', attributes: 'Attributes', weapons_armor: 'Weapons and armor',
            misc: 'Miscellaneous', secretshop: 'Secret shop', basics: 'Basics', support: 'Support',
            magics: 'Magic', defense: 'Defense', weapons: 'Weapons', artifacts: 'Artifacts',
        },
        loading: 'Loading changes…', error: 'Could not load the patch', retry: 'Try again',
        empty: 'No changes for this patch',
    },
    uk: {
        eyebrow: 'Оновлення балансу', general: 'Загальні зміни', global: 'Глобальні зміни',
        items: 'Зміни предметів', heroes: 'Зміни героїв', abilities: 'Здібності',
        talents: 'Таланти', base: 'Основні параметри', added: 'Додано героя', removed: 'Видалено героя',
        str: 'Сила', agi: 'Спритність', int: 'Інтелект',
        bosses: 'Зміни босів', neutralCreeps: 'Нейтральні кріпи', innate: 'Вроджена',
        neutralItems: 'Нейтральні предмети', neutralArtifacts: 'Артефакти', neutralEnhancements: 'Чари', tier: 'Тір', rank: 'Розряд', newRank: 'Новий розряд', newBadge: 'Новий', newItemBadge: 'Новий предмет', newHeroBadge: 'Новий герой',
        category: 'Категорія',
        shopCategories: {
            consumables: 'Витратні', attributes: 'Атрибути', weapons_armor: 'Зброя та броня',
            misc: 'Різне', secretshop: 'Таємна крамниця', basics: 'Основні', support: 'Підтримка',
            magics: 'Магія', defense: 'Захист', weapons: 'Зброя', artifacts: 'Артефакти',
        },
        loading: 'Завантажуємо зміни…', error: 'Не вдалося завантажити патч', retry: 'Повторити',
        empty: 'Для цього патчу змін немає',
    },
    cs: {
        eyebrow: 'Aktualizace vyvážení', general: 'Obecné změny', global: 'Globální změny',
        items: 'Změny předmětů', heroes: 'Změny hrdinů', abilities: 'Schopnosti',
        talents: 'Talenty', base: 'Základní atributy', added: 'Přidán hrdina', removed: 'Odebrán hrdina',
        str: 'Síla', agi: 'Obratnost', int: 'Inteligence',
        bosses: 'Změny bossů', neutralCreeps: 'Neutrální jednotky', innate: 'Vrozená',
        neutralItems: 'Neutrální předměty', neutralArtifacts: 'Artefakty', neutralEnhancements: 'Vylepšení', tier: 'Tier', rank: 'Rank', newRank: 'Nový rank', newBadge: 'Nový', newItemBadge: 'Nový předmět', newHeroBadge: 'Nový hrdina',
        category: 'Kategorie',
        shopCategories: {
            consumables: 'Spotřební', attributes: 'Atributy', weapons_armor: 'Zbraně a brnění',
            misc: 'Ostatní', secretshop: 'Tajný obchod', basics: 'Základní', support: 'Podpora',
            magics: 'Magie', defense: 'Obrana', weapons: 'Zbraně', artifacts: 'Artefakty',
        },
        loading: 'Načítání změn…', error: 'Patch se nepodařilo načíst', retry: 'Zkusit znovu',
        empty: 'Pro tento patch nejsou žádné změny',
    },
};

export type Copy = (typeof copy)['ru'];
