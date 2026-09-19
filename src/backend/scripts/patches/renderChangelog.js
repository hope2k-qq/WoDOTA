const { replacementsHeroes, reversedHeroes } = require('../../config/replacements_heroes2');
const { formatParameterNote, DROP_NOTE, stripAbilityTypePrefix } = require('./parameterFormatters');
const { deepDiff } = require('./diffSnapshots');

const stripCustom = (id) => String(id).replace(/_custom$/, '');

const LANGS = ['ru', 'en', 'uk', 'cs'];
const RAW_TALENT_LANGS = ['ru', 'en', 'uk'];
const HERO_LEVELUP_SUFFIX = ' · hero_levelup';
const HERO_LEVELUP_LABEL = {
    ru: 'увеличение за уровень',
    en: 'increase per level',
    uk: 'збільшення за рівень',
    cs: 'nárůst za úroveň',
};
// краткий суффикс для инлайна «12% + 0.5% за уровень»
const PER_LEVEL_SUFFIX = {
    ru: 'за уровень',
    en: 'per level',
    uk: 'за рівень',
    cs: 'za úroveň',
};
const ATTRIBUTE_CATEGORY_KEYS = { 1: 'strength', 2: 'agility', 3: 'intelligence' };
const IGNORED_HERO_SECTIONS = new Set([
    'AbilityDefinitions',
    'Bot', 'ItemSlots', 'Persona', 'IdleSoundLoop',
    'particle_folder', 'GameSoundsFile', 'VoiceFile',
    'CMEnabled',
    'HeroOrderID',
    'RandomEnabled', 'HealthBarOffset', 'AttackSpeedActivityModifiers', 'AbilityTalentStart',
    'Adjectives',
]);
const isIgnoredHeroField = (field) =>
    typeof field === 'string' && (
        IGNORED_HERO_SECTIONS.has(field) ||
        field.startsWith('AbilityDraft') ||
        /^Ability\d+$/.test(field)
    );
// Значения по умолчанию из шаблона DOTAHeroBase (npc_heroes.txt): если у героя
// параметр раньше не был задан (diff = added, old отсутствует), он наследовал
// этот дефолт. Тогда это не «добавлено», а переход с дефолта на новое значение.
const HERO_BASE_DEFAULTS = {
    BaseAttackSpeed: '100',
    StatusHealthRegen: '0.25',
    StatusManaRegen: '0',
};
// Приводит added-параметр с известным дефолтом к changed (old = дефолт),
// чтобы в патчлоге вышло «… с <дефолт> до <new>», а не «добавлено».
function applyHeroBaseDefault(entry) {
    if (entry.type !== 'added') return;
    if (entry.old !== null && entry.old !== undefined) return;
    const field = entry.path[1];
    if (!Object.prototype.hasOwnProperty.call(HERO_BASE_DEFAULTS, field)) return;
    entry.type = 'changed';
    entry.old = HERO_BASE_DEFAULTS[field];
}
// Иконки статов героя (лежат в public фронта) — как на странице героя.
// Путь кладётся в heroNote.icon (рядом с note), фронт рисует картинку вместо точки-маркера.
const STAT_ICONS = {
    BaseAttackSpeed: '/icon_base_attack_speed.png',
    AttackRange: '/icon_attack_range.png',
    AttackRate: '/icon_attack_time.png',
    MovementSpeed: '/icon_movement_speed.png',
    ArmorPhysical: '/icon_armor.png',
    StatusHealthRegen: '/health_regen.png',
    StatusManaRegen: '/mana_regen.png',
    AttackDamageMin: '/icon_damage.png',
    AttackDamageMax: '/icon_damage.png',
    AttributeBaseStrength: '/str.png',
    AttributeStrengthGain: '/str.png',
    AttributeBaseAgility: '/agi.png',
    AttributeAgilityGain: '/agi.png',
    AttributeBaseIntelligence: '/int.png',
    AttributeIntelligenceGain: '/int.png',
};
const FEMALE_HEROES = new Set([
    'broodmother', 'crystal_maiden', 'dark_willow', 'dawnbreaker', 'death_prophet', 'drow_ranger',
    'enchantress', 'hoodwink', 'legion_commander', 'lina', 'luna', 'marci', 'medusa', 'mirana', 'muerta',
    'naga_siren', 'phantom_assassin', 'queen_of_pain', 'snapfire', 'spectre', 'templar_assassin',
    'vengeful_spirit', 'windranger', 'winter_wyvern',
]);
const PRIMARY_ATTRIBUTE_NOTES = {
    DOTA_ATTRIBUTE_STRENGTH: { icon: '/str.png', ru: (f) => `Теперь является ${f ? 'героиней' : 'героем'} силы`, en: 'Is now a Strength Hero', uk: 'Тепер герой сили' },
    DOTA_ATTRIBUTE_AGILITY: { icon: '/agi.png', ru: (f) => `Теперь является ${f ? 'героиней' : 'героем'} ловкости`, en: 'Is now an Agility Hero', uk: 'Тепер герой спритності' },
    DOTA_ATTRIBUTE_INTELLECT: { icon: '/int.png', ru: (f) => `Теперь является ${f ? 'героиней' : 'героем'} интеллекта`, en: 'Is now an Intelligence Hero', uk: 'Тепер герой інтелекту' },
    DOTA_ATTRIBUTE_ALL: { icon: '/uni.png', ru: (f) => `Теперь является ${f ? 'универсальной героиней' : 'универсальным героем'}`, en: 'Is now a Universal Hero', uk: 'Тепер універсальний герой' },
};

function baseDamageNote(dmin, dmax, values = {}) {
    const up = (dmin || dmax) > 0;
    const verb = { ru: up ? 'увеличен' : 'уменьшен', en: up ? 'increased' : 'decreased', uk: up ? 'збільшено' : 'зменшено' };
    const num = (x, lang) => {
        const s = String(Number(x));
        return lang === 'en' ? s : s.replace('.', ',');
    };
    let note;
    if (!dmin || !dmax) {
        const n = Math.abs(dmin || dmax);
        const isMin = Boolean(dmin);
        note = {
            ru: `${isMin ? 'Минимальный' : 'Максимальный'} базовый урон ${verb.ru} на ${n}`,
            en: `${isMin ? 'Minimum' : 'Maximum'} base damage ${verb.en} by ${n}`,
            uk: `${isMin ? 'Мінімальну' : 'Максимальну'} базову шкоду ${verb.uk} на ${n}`,
        };
    } else if (Math.abs(dmin) === Math.abs(dmax)) {
        const n = Math.abs(dmin);
        note = {
            ru: `Базовый урон ${verb.ru} на ${n}`,
            en: `Base damage ${verb.en} by ${n}`,
            uk: `Базову шкоду ${verb.uk} на ${n}`,
        };
    } else {
        const range = (a, b, lang) => `${num(a, lang)}${lang === 'en' ? '-' : '–'}${num(b, lang)}`;
        const { oldMin, oldMax, newMin, newMax } = values;
        note = {
            ru: `Базовый урон ${verb.ru} с ${range(oldMin, oldMax, 'ru')} до ${range(newMin, newMax, 'ru')}`,
            en: `Base damage ${verb.en} from ${range(oldMin, oldMax, 'en')} to ${range(newMin, newMax, 'en')}`,
            uk: `Базову шкоду ${verb.uk} з ${range(oldMin, oldMax, 'uk')} до ${range(newMin, newMax, 'uk')}`,
        };
    }
    return { ...note, cs: note.en };
}

function polishHeroBaseNotes(notes, heroId) {
    const list = [...(notes || [])];
    const minNote = list.find((n) => n.parameter === 'AttackDamageMin');
    const maxNote = list.find((n) => n.parameter === 'AttackDamageMax');
    let damage = null;
    if (minNote || maxNote) {
        const delta = (n) => (n ? Number(n.new_raw_value) - Number(n.old_raw_value) : 0);
        const dmin = delta(minNote);
        const dmax = delta(maxNote);
        const sameDirection = !(dmin && dmax && Math.sign(dmin) !== Math.sign(dmax));
        if (Number.isFinite(dmin) && Number.isFinite(dmax) && (dmin || dmax) && sameDirection) {
            damage = minNote || maxNote;
            damage.note = baseDamageNote(dmin, dmax, {
                oldMin: minNote?.old_raw_value,
                newMin: minNote?.new_raw_value,
                oldMax: maxNote?.old_raw_value,
                newMax: maxNote?.new_raw_value,
            });
            if (minNote && maxNote) list.splice(list.indexOf(maxNote), 1);
        }
    }
    const primary = list.find((n) => n.parameter === 'AttributePrimary');
    const attribute = primary && PRIMARY_ATTRIBUTE_NOTES[String(primary.new_raw_value).toUpperCase()];
    if (!attribute) return list;
    const ru = attribute.ru(FEMALE_HEROES.has(heroId));
    primary.note = { ru, en: attribute.en, uk: attribute.uk, cs: attribute.en };
    primary.icon = attribute.icon;
    const attributes = list.filter((n) => /^Attribute(Base|\w+Gain)/.test(n.parameter || ''));
    const rest = list.filter((n) => n !== primary && n !== damage && !attributes.includes(n));
    return [primary, ...attributes, ...(damage ? [damage] : []), ...rest];
}

const IGNORED_ITEM_FIELDS = new Set([
    'SideShop', 'SecretShop',
    'IsObsolete', 'ItemPurchasable', 'AbilityTextureName',
    'ItemAlertable',
    'ItemAliases', 'ItemShopTags', 'ID', 'IdleSoundLoop',
    'AbilityUnitTargetType', 'AbilityUnitTargetFlags', 'AbilityUnitTargetTeam',
    'AbilityOvershootCastRange',
    'particle_folder', 'GameSoundsFile', 'VoiceFile',
    'BaseClass', 'ScriptFile',
    'affected_by_aoe_increase',
    'CMEnabled',
    'ItemPermanent', 'ItemInitialCharges', 'ItemDisplayCharges',
    'Adjectives',
    'ItemSellable', 'ItemStackable',
    'ItemContributesToNetWorthWhenDropped', 'ItemRequiresCharges', 'ItemQuality',
    'EnableChargeDisplayOverride', 'ItemDeclarations',
    'ShowGiveIndicatorOnTargetCast',
]);

const IGNORED_ABILITY_FIELDS = new Set([
    'ID', 'IdleSoundLoop',
    'AbilityUnitTargetType', 'AbilityUnitTargetFlags', 'AbilityUnitTargetTeam',
    'AbilityOvershootCastRange',
    'AbilityTextureName',
    'Adjectives',
    'ShowGiveIndicatorOnTargetCast',
    'AbilitySound', 'AbilityCastAnimation', 'AbilityTalentStart', 'HasScepterUpgrade',
    'AttackSpeedActivityModifiers', 'health_bar_offset', 'model_scale',
    'trinket_options_current', 'trinket_options_next',
    'LinkedAbility',
    'DamageTypeTooltip',
    'affected_by_aoe_increase',
    'CMEnabled',
]);

const isIgnoredAbilityField = (path) =>
    IGNORED_ABILITY_FIELDS.has(path[1]) || IGNORED_ABILITY_FIELDS.has(path[path.length - 1]);
const isIgnoredItemField = (field) =>
    typeof field === 'string' && (field.includes('Suggest') || IGNORED_ITEM_FIELDS.has(field));
const HERO_REPLACEMENTS = Object.entries(replacementsHeroes)
    .sort(([left], [right]) => right.length - left.length);

function replaceHeroKey(value) {
    if (typeof value !== 'string') return value;
    return HERO_REPLACEMENTS.reduce(
        (result, [source, replacement]) => result.split(source).join(replacement),
        value
    );
}

const HERO_REPLACEMENTS_REVERSED = Object.entries(reversedHeroes)
    .sort(([left], [right]) => right.length - left.length);

function restoreHeroKey(value) {
    if (typeof value !== 'string') return value;
    return HERO_REPLACEMENTS_REVERSED.reduce(
        (result, [source, replacement]) => result.split(source).join(replacement),
        value
    );
}

function isLeaf(node) {
    if (!node || typeof node !== 'object') return false;
    const keys = Object.keys(node);
    return keys.length === 2 && 'old' in node && 'new' in node;
}

function flattenDiff(node, path = []) {
    const out = [];
    if (!node || typeof node !== 'object') return out;

    if (isLeaf(node)) {
        out.push({ type: 'changed', path, old: node.old, new: node.new });
        return out;
    }
    for (const [key, value] of Object.entries(node.added || {})) {
        out.push({ type: 'added', path: [...path, key], old: null, new: value });
    }
    for (const [key, value] of Object.entries(node.removed || {})) {
        out.push({ type: 'removed', path: [...path, key], old: value, new: null });
    }
    for (const [key, value] of Object.entries(node.changed || {})) {
        out.push(...flattenDiff(value, [...path, key]));
    }
    return out;
}

function cleanLabel(path) {
    return path
        .slice(1)
        .filter((part) => part !== 'AbilityValues' && part !== 'value')
        .join(' · ');
}

function parameterTitle(parameter) {
    return String(parameter)
        .split(' · ')
        .map((part) => part
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/[_-]+/g, ' ')
            .trim()
            .replace(/\b\w/g, (letter) => letter.toUpperCase()))
        .join(' · ');
}

function sameRawValue(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function isDuplicateParserArtifact(entry) {
    if (entry.type !== 'changed') return false;
    if (Array.isArray(entry.new) && entry.new.some((value) => sameRawValue(value, entry.old))) return true;
    if (Array.isArray(entry.old) && entry.old.some((value) => sameRawValue(value, entry.new))) return true;
    return false;
}

function normalizeAbilityNoise(value) {
    if (Array.isArray(value)) return value.map(normalizeAbilityNoise);
    if (value && typeof value === 'object') {
        const out = {};
        for (const [key, val] of Object.entries(value)) {
            out[key] = key === 'AbilityType' ? stripAbilityTypePrefix(val) : normalizeAbilityNoise(val);
        }
        return out;
    }
    return value;
}

const IGNORED_VALUE_META = new Set(['affected_by_aoe_increase']);

function unwrapValue(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !('value' in value)) return value;
    const hasMeaningfulMeta = Object.keys(value).some((key) => key !== 'value' && !IGNORED_VALUE_META.has(key));
    return hasMeaningfulMeta ? value : value.value;
}

function expandWholeAbilityChange(entry) {
    const mergeBlocks = (value) => (Array.isArray(value)
        ? value.reduce((acc, block) => (block && typeof block === 'object' ? { ...acc, ...block } : acc), {})
        : value);
    const d = deepDiff(
        normalizeAbilityNoise(mergeBlocks(entry.old)),
        normalizeAbilityNoise(mergeBlocks(entry.new))
    );
    return flattenDiff(d || {}).map((leaf) => ({ ...leaf, path: [entry.path[0], ...leaf.path] }));
}

function noteTemplates(type) {
    if (type === 'added') {
        return {
            ru: '{change_label}: {new_raw_value}',
            en: '{change_label}: {new_raw_value}',
            uk: '{change_label}: {new_raw_value}',
            cs: '{change_label}: {new_raw_value}',
        };
    }
    if (type === 'removed') {
        return {
            ru: '{change_label}: {old_raw_value}',
            en: '{change_label}: {old_raw_value}',
            uk: '{change_label}: {old_raw_value}',
            cs: '{change_label}: {old_raw_value}',
        };
    }
    return {
        ru: '{change_label} с {old_raw_value} до {new_raw_value}',
        en: '{change_label} from {old_raw_value} to {new_raw_value}',
        uk: '{change_label} з {old_raw_value} до {new_raw_value}',
        cs: '{change_label} z {old_raw_value} na {new_raw_value}',
    };
}

function rawNote(type, oldValue, newValue) {
    return {
        old_raw_value: oldValue === undefined ? null : oldValue,
        new_raw_value: newValue === undefined ? null : newValue,
        note: noteTemplates(type),
    };
}

function talentRawNote(type, oldValue, newValue) {
    const result = rawNote(type, oldValue, newValue);
    return result;
}

const TALENT_ABILITY_SWAP = /нов(ая|ый)\s+\S+\s+способност|new\s+\S+\s+ability|нова\s+\S+\s+здатн/i;
function talentTextReplaced(oldValue, newValue) {
    const plain = (value) => stripTalentRed(normTalentText(value || '')).toLowerCase().replace(/ё/g, 'е');
    const pick = (lang) => [plain(oldValue?.[lang]), plain(newValue?.[lang])];
    let [oldText, newText] = pick('ru');
    if (!oldText || !newText) [oldText, newText] = pick('en');
    if (!oldText || !newText || oldText === newText) return false;
    if (TALENT_ABILITY_SWAP.test(oldText) !== TALENT_ABILITY_SWAP.test(newText)) return true;
    const words = (text) => new Set(text.match(/[a-zа-яіїєґ']{3,}/g) || []);
    const oldWords = words(oldText);
    const newWords = words(newText);
    const smaller = Math.min(oldWords.size, newWords.size);
    if (!smaller) return true;
    const shared = [...oldWords].filter((word) => newWords.has(word)).length;
    return shared / smaller < 0.5;
}

function talentReplacementNote(oldValue, newValue) {
    const connector = { ru: 'заменено на', en: 'replaced with', uk: 'замінено на', cs: 'nahrazeno za' };
    const note = {};
    for (const lang of LANGS) {
        const source = lang === 'cs' ? 'en' : lang;
        const oldText = stripTalentRed(normTalentText(oldValue?.[source] || ''));
        const newText = stripTalentRed(normTalentText(newValue?.[source] || ''));
        note[lang] = `«${oldText}» ${connector[lang]} «${newText}»`;
    }
    return note;
}

function readyNote(type, oldValue, newValue, note) {
    return {
        ...rawNote(type, oldValue, newValue),
        note,
    };
}

function talentPositionText(position, lang) {
    if (!position) return '';
    const labels = {
        ru: `уровень ${position.level}, ветка ${position.branch}`,
        en: `level ${position.level}, branch ${position.branch}`,
        uk: `рівень ${position.level}, гілка ${position.branch}`,
        cs: `úroveň ${position.level}, větev ${position.branch}`,
    };
    return labels[lang];
}

function rawTalentToken(localization, lang, talentId) {
    if (!talentId) return null;
    const sourceLang = lang === 'cs' ? 'en' : lang;
    const tokens = localization[sourceLang] || {};
    let raw = tokens[`${talentId}_0`] ?? tokens[talentId];
    if (Array.isArray(raw)) raw = raw[raw.length - 1];
    return raw == null ? null : String(raw);
}

function localizedTalentText(localization, lang, talentId) {
    if (!talentId) return '';
    return normTalentText(rawTalentToken(localization, lang, talentId) ?? talentId);
}

function internalTalentId(talentId) {
    return String(talentId).replace(/^modifier_(.+)_(\d+)$/, (match, hero, num) =>
        reversedHeroes[hero] ? `modifier_${reversedHeroes[hero]}_${num}` : match
    );
}

function talentTooltipText(localization, talentId) {
    if (!talentId) return null;
    const out = {};
    for (const lang of RAW_TALENT_LANGS) {
        const raw = rawTalentToken(localization, lang, talentId) ?? rawTalentToken(localization, lang, internalTalentId(talentId));
        if (raw == null || !String(raw).trim()) continue;
        out[lang] = String(raw)
            .replace(/[ \t]*<br\s*\/?>[ \t]*/gi, '\n')
            .trim();
    }
    return Object.keys(out).length ? out : null;
}

function talentDescriptionNote(localization, talentId) {
    if (!LANGS.some((lang) => rawTalentToken(localization, lang, talentId))) return null;
    return Object.fromEntries(LANGS.map((lang) => [
        lang, localizedTalentText(localization, lang, talentId) || null,
    ]));
}

function talentDestinationOccupant(move, oldPositions) {
    const destination = move.new || move.old;
    return Object.entries(oldPositions || {}).find(([, position]) =>
        position.branch === destination.branch && position.level === destination.level
    )?.[0];
}

function structuralTalentNote(move, context) {
    const oldDestinationId = talentDestinationOccupant(move, context.oldPositions);
    const oldTalentId = move.type === 'removed' ? move.id : (move.old?.id || oldDestinationId);
    const newTalentId = move.type === 'removed' ? null : (move.new?.id || move.id);

    const oldRawValue = Object.fromEntries(
        RAW_TALENT_LANGS.map((lang) => [lang, localizedTalentText(context.oldLocalization, lang, oldTalentId) || null])
    );
    const newRawValue = Object.fromEntries(
        RAW_TALENT_LANGS.map((lang) => [lang, localizedTalentText(context.newLocalization, lang, newTalentId) || null])
    );
    const note = {};

    const quote = (text) => (text ? `«${text}»` : text);
    for (const lang of LANGS) {
        const oldText = stripTalentRed(localizedTalentText(context.oldLocalization, lang, oldTalentId));
        const newText = stripTalentRed(localizedTalentText(context.newLocalization, lang, newTalentId));
        if (move.type === 'added') {
            const prefix = { ru: 'Добавлен талант', en: 'Talent added', uk: 'Додано талант', cs: 'Přidán talent' }[lang];
            note[lang] = `${prefix}: ${quote(newText)}`;
        } else if (move.type === 'removed') {
            const prefix = { ru: 'Удалён талант', en: 'Talent removed', uk: 'Видалено талант', cs: 'Talent odebrán' }[lang];
            note[lang] = `${prefix}: ${quote(oldText)}`;
        } else {
            const connector = { ru: 'заменено на', en: 'replaced with', uk: 'замінено на', cs: 'nahrazeno za' }[lang];
            note[lang] = `${quote(oldText)} ${connector} ${quote(newText)}`;
        }
    }

    if (move.type === 'moved') return { note };
    return readyNote(move.type, oldRawValue, newRawValue, note);
}

const WHOLE_ENTITY_LABELS = {
    ability: {
        added: { ru: 'Новая способность', en: 'New ability', uk: 'Нова здібність', cs: 'Nová schopnost' },
        removed: { ru: 'Удалена способность', en: 'Ability removed', uk: 'Видалено здібність', cs: 'Schopnost odebrána' },
    },
    item: {
        added: { ru: 'Новый предмет', en: 'New item', uk: 'Новий предмет', cs: 'Nový předmět' },
        removed: { ru: 'Удалён предмет', en: 'Item removed', uk: 'Видалено предмет', cs: 'Předmět odebrán' },
    },
};

// Автоопределение процентных значений. Конвенция Valve: если ярлык тултипа значения
// (DOTA_Tooltip_ability_<entity>_<param>) начинается с «%», значение отображается в процентах
// (напр. soul_reaver bonus_health = "%+$health" → 8% от макс. здоровья, а soul_nullifier
// bonus_health = "+$health" → плоское). Проверяем отдельно старое и новое значение, т.к. тип
// параметра мог смениться между версиями (flat ↔ %). Работает для всех секций (предметы,
// способности, нейтралки), а не только талантов.
let PERCENT_CTX = null;
function tooltipStartsPercent(loc, entity, param) {
    if (!loc || !entity || !param) return false;
    const key = `DOTA_Tooltip_ability_${entity}_${param}`;
    for (const lng of ['en', 'ru', 'uk']) {
        const v = loc[lng] && loc[lng][key];
        if (typeof v === 'string') return v.replace(/^\s+/, '').startsWith('%');
    }
    return false;
}
function applyPercent(result, entry) {
    if (!PERCENT_CTX || !result || !result.note || !result.parameter
        || !entry || !Array.isArray(entry.path)) {
        return result;
    }
    const entity = entry.path[0];
    // имя параметра для ключа тултипа: плоское, без суффиксов роста за уровень
    const param = String(result.parameter)
        .replace(/ · /g, '_')
        .replace(/_hero_levelup$/, '')
        .replace(/_per_level$/, '');
    const oldPct = tooltipStartsPercent(PERCENT_CTX.oldLoc, entity, param);
    const newPct = tooltipStartsPercent(PERCENT_CTX.newLoc, entity, param);
    if (!oldPct && !newPct) return result;
    result.note = Object.fromEntries(Object.entries(result.note).map(([lang, text]) => {
        let t = String(text);
        if (oldPct) t = t.replace(/\{old_raw_value\}/g, '{old_raw_value}%');
        if (newPct) t = t.replace(/\{new_raw_value\}/g, '{new_raw_value}%');
        return [lang, t];
    }));
    return result;
}

function noteFromDiff(entry, includeParameter = false, entityKind = null, context = null) {
    const note = rawNote(entry.type, entry.old, entry.new);
    if (!includeParameter) return note;

    const label = cleanLabel(entry.path);

    const wholeEntity = WHOLE_ENTITY_LABELS[entityKind];
    if (label === '' && wholeEntity && (entry.type === 'added' || entry.type === 'removed')) {
        return { ...note, note: wholeEntity[entry.type] };
    }

    const levelupNote = (parameter) => ({
        parameter,
        ...note,
        note: Object.fromEntries(
            Object.entries(note.note).map(([lang, text]) => [lang, `${HERO_LEVELUP_LABEL[lang]}: ${text}`])
        ),
    });

    if (label.endsWith(HERO_LEVELUP_SUFFIX)) {
        const base = label.slice(0, -HERO_LEVELUP_SUFFIX.length);
        return applyPercent(levelupNote(`${base.replace(/ · /g, '_')}_hero_levelup`), entry);
    }

    const flatParameter = label.replace(/ · /g, '_');
    if (/_per_level$/.test(flatParameter)) {
        return applyPercent(levelupNote(flatParameter), entry);
    }

    const parameter = label;

    const custom = formatParameterNote(parameter, entry.old, entry.new, entry.type, context);
    if (custom === DROP_NOTE) return null;
    if (custom) return { parameter, ...note, note: custom };

    const title = parameterTitle(parameter);
    return applyPercent({
        parameter,
        ...note,
        note: Object.fromEntries(
            Object.entries(note.note).map(([lang, text]) => [lang, `${title}: ${text}`])
        ),
    }, entry);
}

const isNeutralEnhancementItem = (itemId) => String(itemId || '').startsWith('item_enhancement_');

function itemPlacementNote(parameter, oldValue, newValue, itemId = null) {
    const isTier = parameter === 'neutral_tier';
    const isRank = isTier && isNeutralEnhancementItem(itemId);
    const note = isTier
        ? (isRank ? {
            ru: `Перемещён из разряда ${oldValue} в разряд ${newValue}`,
            en: `Moved from rank ${oldValue} to rank ${newValue}`,
            uk: `Переміщено з розряду ${oldValue} до розряду ${newValue}`,
            cs: `Přesunuto z ranku ${oldValue} do ranku ${newValue}`,
        } : {
            ru: `Разряд артефакта изменён с ${oldValue} на ${newValue}`,
            en: `Artifact tier changed from ${oldValue} to ${newValue}`,
            uk: `Розряд артефакту змінено з ${oldValue} на ${newValue}`,
            cs: `Tier artefaktu změněn z ${oldValue} na ${newValue}`,
        })
        : {
            ru: `Перемещён из категории «${oldValue}» в «${newValue}»`,
            en: `Moved from category “${oldValue}” to “${newValue}”`,
            uk: `Переміщено з категорії «${oldValue}» до «${newValue}»`,
            cs: `Přesunuto z kategorie „${oldValue}“ do „${newValue}“`,
        };
    return { parameter, ...readyNote('changed', oldValue, newValue, note) };
}

function itemTierMembershipNote(type, tier, itemId = null) {
    const added = type === 'added';
    const isRank = isNeutralEnhancementItem(itemId);
    const note = added
        ? (isRank ? {
            ru: `Добавлен в новый разряд ${tier}`,
            en: `Added to new rank ${tier}`,
            uk: `Додано до нового розряду ${tier}`,
            cs: `Přidáno do nového ranku ${tier}`,
        } : {
            ru: `Добавлен в разряд ${tier}`,
            en: `Added to tier ${tier}`,
            uk: `Додано до розряду ${tier}`,
            cs: `Přidáno do tieru ${tier}`,
        })
        : (isRank ? {
            ru: `Удалён из разряда ${tier}`,
            en: `Removed from rank ${tier}`,
            uk: `Видалено з розряду ${tier}`,
            cs: `Odebráno z ranku ${tier}`,
        } : {
            ru: `Удалён из разряда ${tier}`,
            en: `Removed from tier ${tier}`,
            uk: `Видалено з розряду ${tier}`,
            cs: `Odebráno z tieru ${tier}`,
        });
    return {
        parameter: 'neutral_tier',
        ...readyNote(type, added ? null : tier, added ? tier : null, note),
    };
}

function normalizeTiers(value) {
    const raw = value && typeof value === 'object' && !Array.isArray(value) && Array.isArray(value.tiers)
        ? value.tiers
        : value;
    const tiers = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
    return [...new Set(tiers.map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
}

function neutralKind(itemId, value) {
    if (value && typeof value === 'object' && !Array.isArray(value) && value.kind) return value.kind;
    return isNeutralEnhancementItem(itemId) ? 'enhancement' : 'artifact';
}

function normalizeEnhancementRanks(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !Array.isArray(value.ranks)) return [];
    return value.ranks
        .map((entry) => ({
            tier: Number(entry.tier),
            level: Number(entry.level ?? entry.rank),
            category: entry.category || null,
        }))
        .filter((entry) => Number.isFinite(entry.tier) && Number.isFinite(entry.level))
        .sort((a, b) => a.tier - b.tier || a.level - b.level);
}

const ABILITY_KIND_LABEL = {
    passive: { ru: 'Пассивная', en: 'Passive', uk: 'Пасивна', cs: 'Pasivní' },
    active: { ru: 'Активная', en: 'Active', uk: 'Активна', cs: 'Aktivní' },
};
const NATURE_LANGS = ['ru', 'en', 'uk', 'cs'];

function abilityKindLabel(kv) {
    const behavior = String((kv && kv.AbilityBehavior) || '');
    return /DOTA_ABILITY_BEHAVIOR_PASSIVE/.test(behavior) ? ABILITY_KIND_LABEL.passive : ABILITY_KIND_LABEL.active;
}

function hasHeroLevelup(kv) {
    const values = kv && kv.AbilityValues;
    if (!values || typeof values !== 'object') return false;
    return Object.values(values).some((value) => value && typeof value === 'object' && 'hero_levelup' in value);
}

function levelingClause(kv, context) {
    const dependent = kv && kv.DependentOnAbility;
    if (dependent) {
        const resolved = context && typeof context.resolveAbilityName === 'function' ? context.resolveAbilityName(dependent) : null;
        const name = (lang) => (resolved && (resolved[lang] || resolved.en || resolved.ru)) || String(dependent);
        return {
            ru: `улучшается вместе с ${name('ru')}`,
            en: `upgrades together with ${name('en')}`,
            uk: `покращується разом з ${name('uk')}`,
            cs: `vylepšuje se spolu s ${name('cs')}`,
        };
    }
    if (hasHeroLevelup(kv)) {
        return { ru: 'улучшается с уровнем героя', en: 'upgrades with hero level', uk: 'покращується з рівнем героя', cs: 'vylepšuje se s úrovní hrdiny' };
    }
    return { ru: 'не улучшаемая способность', en: 'non-upgradable ability', uk: 'непокращувана здібність', cs: 'nevylepšitelná schopnost' };
}

const INNATE_HEAD = {
    became_innate: { ru: 'Теперь является врождённой способностью', en: 'Now an innate ability', uk: 'Тепер є вродженою здібністю', cs: 'Nyní je vrozená schopnost' },
    became_innate_hidden: { ru: 'Скрытая способность теперь является врождённой', en: 'The hidden ability is now innate', uk: 'Прихована здібність тепер є вродженою', cs: 'Skrytá schopnost je nyní vrozená' },
    became_basic: { ru: 'Теперь является базовой способностью', en: 'Now a basic ability', uk: 'Тепер є базовою здібністю', cs: 'Nyní je základní schopnost' },
};
const NEW_HEAD = {
    innate: { ru: 'Новая врождённая способность', en: 'New innate ability', uk: 'Нова вроджена здібність', cs: 'Nová vrozená schopnost' },
    basic: { ru: 'Новая базовая способность', en: 'New basic ability', uk: 'Нова базова здібність', cs: 'Nová základní schopnost' },
    ultimate: { ru: 'Новая ультимативная способность', en: 'New ultimate ability', uk: 'Нова ультимативна здібність', cs: 'Nová ultimátní schopnost' },
    unknown: { ru: 'Новая способность', en: 'New ability', uk: 'Нова здібність', cs: 'Nová schopnost' },
};

function abilityNatureNote(kind, kv, innate, innateKnown, context) {
    if (kind === 'became_basic') return { ...INNATE_HEAD.became_basic };
    const kindLabel = abilityKindLabel(kv);
    if (kind === 'became_innate' || kind === 'became_innate_hidden') {
        const head = kind === 'became_innate_hidden' ? INNATE_HEAD.became_innate_hidden : INNATE_HEAD.became_innate;
        const lvl = levelingClause(kv, context);
        return Object.fromEntries(NATURE_LANGS.map((lang) =>
            [lang, `${head[lang]}. ${kindLabel[lang]}, ${lvl[lang]}`]));
    }
    const isUltimate = /ULTIMATE/.test(String((kv && kv.AbilityType) || ''));
    const head = !innateKnown ? NEW_HEAD.unknown : (innate ? NEW_HEAD.innate : (isUltimate ? NEW_HEAD.ultimate : NEW_HEAD.basic));
    if (!kv || !kv.AbilityBehavior) return Object.fromEntries(NATURE_LANGS.map((lang) => [lang, head[lang]]));
    const sep = innateKnown ? '. ' : ', ';
    return Object.fromEntries(NATURE_LANGS.map((lang) => [lang, `${head[lang]}${sep}${kindLabel[lang]}.`]));
}

// «Природная» заметка способности: стала врождённой/базовой либо новая
// врождённая/базовая/способность («Теперь является врождённой способностью…» и аналоги).
const NATURE_HEAD_RU = [
    INNATE_HEAD.became_innate.ru,
    INNATE_HEAD.became_innate_hidden.ru,
    INNATE_HEAD.became_basic.ru,
    NEW_HEAD.innate.ru,
    NEW_HEAD.basic.ru,
    NEW_HEAD.ultimate.ru,
    NEW_HEAD.unknown.ru,
];
function isAbilityNatureNote(note) {
    if (!note) return false;
    if (note.parameter === 'Innate') return true;
    const ru = note.note?.ru || '';
    return NATURE_HEAD_RU.some((head) => ru.startsWith(head));
}

const ITEM_POSSESSIVE_WORDS = {
    aghanims: "Aghanim's", arcanists: "Arcanist's", ascetics: "Ascetic's", avianas: "Aviana's", behemoths: "Behemoth's",
    brigands: "Brigand's", conjurers: "Conjurer's", crellas: "Crella's", eldwurms: "Eldwurm's", enchanters: "Enchanter's",
    euls: "Eul's", fairys: "Fairy's", flayers: "Flayer's", foragers: "Forager's", forebearers: "Forebearer's",
    giants: "Giant's", heavens: "Heaven's", hydras: "Hydra's", illusionists: "Illusionist's", leviathans: "Leviathan's",
    linkens: "Linken's", mans: "Man's", martyrs: "Martyr's", partisans: "Partisan's", philosophers: "Philosopher's",
    princes: "Prince's", prophets: "Prophet's", pupils: "Pupil's", revenants: "Revenant's", rippers: "Ripper's",
    roshans: "Roshan's", sages: "Sage's", shivas: "Shiva's", sisters: "Sister's", specialists: "Specialist's",
    thors: "Thor's", tumblers: "Tumbler's", vindicators: "Vindicator's", vladmirs: "Vladmir's",
};

function itemDisplayName(itemId) {
    const smallWords = new Set(['a', 'an', 'and', 'at', 'for', 'from', 'in', 'of', 'on', 'the', 'to', 'with']);
    return String(itemId)
        .replace(/^item_/, '')
        .replace(/_custom$/, '')
        .split('_')
        .map((word, index) => {
            if (index > 0 && smallWords.has(word)) return word;
            if (ITEM_POSSESSIVE_WORDS[word]) return ITEM_POSSESSIVE_WORDS[word];
            return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
        })
        .join(' ');
}

function localizedItemName(itemId, localizationSources) {
    const canonicalId = String(itemId).replace(/_custom$/, '');
    const pickFor = (id) => {
        const target = `dota_tooltip_ability_${id}`.toLowerCase();
        for (const source of localizationSources || []) {
            const tokens = source?.en || {};
            const key = Object.keys(tokens).find((token) => token.toLowerCase() === target || token.toLowerCase() === `${target}:n`);
            if (key && String(tokens[key]).trim()) {
                return normText(String(tokens[key]).replace(/#\|[a-z]\|#/g, '').replace(/<[^>]+>/g, ' '));
            }
        }
        return null;
    };
    return pickFor(itemId) || (canonicalId !== itemId ? pickFor(canonicalId) : null) || itemDisplayName(itemId);
}

const ABILITY_NAME_SMALL_WORDS = new Set(['a', 'an', 'and', 'at', 'for', 'from', 'in', 'of', 'on', 'the', 'to', 'with']);
function normalizeAbilityNameCase(name) {
    const text = String(name || '');
    if (!/^[A-Z' ]+$/.test(text) || !/[A-Z]/.test(text)) return text;
    return text.toLowerCase().split(' ')
        .map((word, index) => (index > 0 && ABILITY_NAME_SMALL_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join(' ');
}

function localizedAbilityName(abilityId, localizationSources) {
    const canonicalId = String(abilityId).replace(/_custom$/, '');
    const targets = [`dota_tooltip_ability_${abilityId}`, `dota_tooltip_ability_${canonicalId}`]
        .map((target) => target.toLowerCase());
    const pick = (lang) => {
        for (const source of localizationSources || []) {
            const tokens = source?.[lang] || {};
            const key = Object.keys(tokens).find((token) => targets.includes(token.toLowerCase()));
            if (key && String(tokens[key]).trim()) return normText(String(tokens[key]).replace(/<[^>]+>/g, ' '));
        }
        return null;
    };
    const en = normalizeAbilityNameCase(pick('en'));
    const ru = normalizeAbilityNameCase(pick('ru'));
    if (!en && !ru) return null;
    const uk = normalizeAbilityNameCase(pick('uk'));
    return { ru: ru || en, en: en || ru, uk: uk || en || ru, cs: en || ru };
}

function recipeIndex(items, localizationSources = []) {
    const recipeByResult = {};
    for (const [, recipe] of Object.entries(items || {})) {
        if (!recipe || typeof recipe !== 'object' || recipe.ItemRecipe !== '1' || !recipe.ItemResult) continue;
        const reqs = recipe.ItemRequirements || {};
        const firstKey = Object.keys(reqs).sort()[0];
        const raw = firstKey != null ? reqs[firstKey] : '';
        const ids = (Array.isArray(raw) ? raw : String(raw || '').split(';'))
            .map((s) => String(s).trim().replace(/\*$/, '')).filter(Boolean);
        recipeByResult[recipe.ItemResult] = { recipeCost: Number(recipe.ItemCost) || 0, componentIds: ids };
    }
    const costCache = new Map();
    const trueCost = (rawId, seen) => {
        const id = String(rawId).replace(/\*$/, '');
        if (costCache.has(id)) return costCache.get(id);
        const built = recipeByResult[id];
        let cost;
        if (built && !(seen && seen.has(id))) {
            const nextSeen = new Set(seen || []);
            nextSeen.add(id);
            cost = built.componentIds.reduce((t, cid) => t + trueCost(cid, nextSeen), built.recipeCost);
        } else {
            cost = Number(items[id]?.ItemCost) || 0;
        }
        costCache.set(id, cost);
        return cost;
    };

    const recipes = {};
    for (const [recipeId, recipe] of Object.entries(items || {})) {
        if (!recipe || typeof recipe !== 'object' || recipe.ItemRecipe !== '1' || !recipe.ItemResult) continue;
        const requirements = recipe.ItemRequirements || {};
        const recipeCost = Number(recipe.ItemCost) || 0;
        const variants = Object.keys(requirements).sort().map((key) => {
            const rawRequirements = requirements[key];
            const componentIds = Array.isArray(rawRequirements)
                ? rawRequirements
                : String(rawRequirements || '').split(';');
            const components = componentIds
                .map((id) => String(id).trim())
                .filter(Boolean)
                .map((id) => {
                    const lookupId = id.replace(/\*$/, '');
                    return {
                        id,
                        name: localizedItemName(lookupId, localizationSources),
                        cost: trueCost(lookupId),
                    };
                });
            return {
                key,
                components,
                total_cost: components.reduce((total, component) => total + component.cost, recipeCost),
            };
        });
        const primary = variants[0] || { components: [], total_cost: recipeCost };
        recipes[recipe.ItemResult] = {
            recipe_id: recipeId,
            result_id: recipe.ItemResult,
            variants,
            components: primary.components,
            recipe_cost: recipeCost,
            total_cost: primary.total_cost,
        };
    }
    return recipes;
}

// Стиль патчлога Valve для изменения рецепта: стоимость рецепта + общая стоимость
// + добавленные/убранные/заменённые компоненты. Возвращает {ru,en,uk,cs} со строками
// через \n (splitNoteLines разложит их в отдельные заметки) или null, если сравнить нечем.
function recipeChangeLines(oldR, newR) {
    if (!oldR || !newR) return null;
    const comps = (r) => (r.components && r.components.length ? r.components : (r.variants?.[0]?.components || []));
    const norm = (id) => stripCustom(String(id)).replace(/\*+$/, '');
    const oldC = comps(oldR);
    const newC = comps(newR);
    const countBy = (arr) => arr.reduce((m, c) => m.set(norm(c.id), (m.get(norm(c.id)) || 0) + 1), new Map());
    const oldCount = countBy(oldC);
    const newCount = countBy(newC);
    const extraCopies = (from, otherCount) => {
        const seen = new Map();
        const out = [];
        for (const c of from) {
            const id = norm(c.id);
            const k = (seen.get(id) || 0) + 1;
            seen.set(id, k);
            if (k > (otherCount.get(id) || 0)) out.push({ ...c, ordinal: (otherCount.get(id) || 0) > 0 ? k : null });
        }
        return out;
    };
    const added = extraCopies(newC, oldCount);
    const removed = extraCopies(oldC, newCount);
    const lines = { ru: [], en: [], uk: [], cs: [] };

    // --- состав ---
    const ORDINAL = {
        2: { ru: 'второй', en: 'a second', uk: 'другий', cs: 'druhý' },
        3: { ru: 'третий', en: 'a third', uk: 'третій', cs: 'třetí' },
        other: { ru: 'ещё один', en: 'another', uk: 'ще один', cs: 'další' },
    };
    const label = (c, lang, withCost) => {
        const ord = c.ordinal ? `${(ORDINAL[c.ordinal] || ORDINAL.other)[lang]} ` : '';
        if (!withCost) return `${ord}${c.name}`;
        if (lang === 'en') return `${ord}${c.name} (${c.cost})`;
        return `${ord}${c.name} (${c.cost} ${lang === 'cs' ? 'zlata' : 'золота'})`;
    };
    const grouped = (arr) => {
        const out = [];
        for (const c of arr) {
            const same = !c.ordinal && out.find((g) => !g.ordinal && norm(g.id) === norm(c.id));
            if (same) same.count += 1;
            else out.push({ ...c, count: 1 });
        }
        return out;
    };
    const groupLabel = (g, lang, withCost) => {
        if (g.count < 2) return label(g, lang, withCost);
        if (!withCost) return `${g.count} ${g.name}`;
        if (lang === 'en') return `${g.count} ${g.name} (${g.cost} each)`;
        return `${g.count} ${g.name} (${lang === 'cs' ? 'po' : 'по'} ${g.cost} ${lang === 'cs' ? 'zlata' : 'золота'})`;
    };
    const list = (arr, lang, withCost) => {
        const parts = grouped(arr).map((g) => groupLabel(g, lang, withCost));
        const and = { ru: 'и', uk: 'і', en: 'and', cs: 'a' }[lang];
        return parts.length < 2 ? (parts[0] || '') : `${parts.slice(0, -1).join(', ')} ${and} ${parts[parts.length - 1]}`;
    };
    const requires = (arr) => (arr.length > 1 ? 'требуются' : 'требуется');
    if (added.length || removed.length) {
        lines.ru.push('Рецепт изменён');
        lines.en.push('Recipe changed');
        lines.uk.push('Рецепт змінено');
        lines.cs.push('Recept změněn');
        if (added.length && removed.length) {
            lines.ru.push(`Теперь для сборки ${requires(added)} не ${list(removed, 'ru', true)}, а ${list(added, 'ru', true)}`);
            lines.en.push(`Now requires ${list(added, 'en', true)} instead of ${list(removed, 'en', true)}`);
            lines.uk.push(`Тепер для збирання потрібно не ${list(removed, 'uk', true)}, а ${list(added, 'uk', true)}`);
            lines.cs.push(`Nyní vyžaduje ${list(added, 'cs', true)} místo ${list(removed, 'cs', true)}`);
        } else if (added.length) {
            lines.ru.push(`Теперь для сборки также ${requires(added)} ${list(added, 'ru', true)}`);
            lines.en.push(`Now requires ${list(added, 'en', true)}`);
            lines.uk.push(`Тепер для збирання також потрібно ${list(added, 'uk', true)}`);
            lines.cs.push(`Nyní také vyžaduje ${list(added, 'cs', true)}`);
        } else {
            lines.ru.push(`Теперь для сборки не ${requires(removed)} ${list(removed, 'ru', false)}`);
            lines.en.push(`No longer requires ${list(removed, 'en', false)}`);
            lines.uk.push(`Тепер для збирання не потрібно ${list(removed, 'uk', false)}`);
            lines.cs.push(`Již nevyžaduje ${list(removed, 'cs', false)}`);
        }
    }

    // --- стоимость рецепта / общая стоимость ---
    const RC = {
        inc: { ru: 'увеличена', en: 'increased', uk: 'збільшено', cs: 'zvýšena' },
        dec: { ru: 'уменьшена', en: 'decreased', uk: 'зменшено', cs: 'snížena' },
    };
    const TC = {
        inc: { ru: 'увеличилась', en: 'increased', uk: 'збільшено', cs: 'zvýšena' },
        dec: { ru: 'уменьшилась', en: 'decreased', uk: 'зменшено', cs: 'snížena' },
    };
    const oc = oldR.recipe_cost;
    const nc = newR.recipe_cost;
    const ot = oldR.total_cost;
    const nt = newR.total_cost;
    const compChanged = added.length > 0 || removed.length > 0;
    const oldCostById = new Map(oldC.map((c) => [norm(c.id), c]));
    const movedAll = compChanged ? [] : newC
        .map((c) => ({ c, was: oldCostById.get(norm(c.id)) }))
        .filter((x) => x.was && Number(x.was.cost) !== Number(x.c.cost));
    const movedParts = (lang) => {
        const groups = new Map();
        for (const { c, was } of movedAll) {
            const key = `${c.name}|${was.cost}|${c.cost}`;
            groups.set(key, { c, was, n: (groups.get(key)?.n || 0) + 1 });
        }
        return [...groups.values()].map(({ c, was, n }) => {
            const cheaper = Number(c.cost) < Number(was.cost);
            if (lang === 'ru') return `${c.name} ${cheaper ? 'подешевел' : 'подорожал'} с ${was.cost} до ${c.cost} золота`;
            if (lang === 'uk') return `${c.name} ${cheaper ? 'подешевшав' : 'подорожчав'} з ${was.cost} до ${c.cost} золота`;
            if (lang === 'cs') return `${c.name} ${cheaper ? 'zlevnil' : 'zdražil'} z ${was.cost} na ${c.cost} zlata`;
            return `${c.name} ${cheaper ? 'decreased' : 'increased'} from ${was.cost}g to ${c.cost}g`;
        });
    };
    const movedTail = (lang) => { const p = movedParts(lang); return p.length ? `, ${p.join(', ')}` : ''; };
    const totalSuffix = (lang) => {
        if (ot === nt) {
            return { ru: ` (общая стоимость прежняя — ${nt} золота)`, en: `. Total cost unchanged at ${nt}g`, uk: ` (загальна вартість незмінна — ${nt} золота)`, cs: ` (celková cena beze změny — ${nt} zlata)` }[lang];
        }
        const td = nt > ot ? 'inc' : 'dec';
        return { ru: ` (общая стоимость ${TC[td].ru} с ${ot} до ${nt} золота)`, en: `. Total cost ${TC[td].en} from ${ot}g to ${nt}g`, uk: ` (загальну вартість ${TC[td].uk} з ${ot} до ${nt} золота)`, cs: ` (celková cena ${TC[td].cs} z ${ot} na ${nt} zlata)` }[lang];
    };
    const hasOldScroll = Number(oc) > 0;
    const hasNewScroll = Number(nc) > 0;
    if (compChanged && hasOldScroll && !hasNewScroll) {
        lines.ru.push(`Теперь для сборки не требуется рецепт за ${oc} золота${totalSuffix('ru')}`);
        lines.en.push(`No longer requires a ${oc}g recipe${totalSuffix('en')}`);
        lines.uk.push(`Тепер для збирання не потрібен рецепт за ${oc} золота${totalSuffix('uk')}`);
        lines.cs.push(`Již nevyžaduje recept za ${oc} zlata${totalSuffix('cs')}`);
    } else if (compChanged && !hasOldScroll && hasNewScroll) {
        lines.ru.push(`Теперь для сборки требуется рецепт за ${nc} золота${totalSuffix('ru')}`);
        lines.en.push(`Now requires a ${nc}g recipe${totalSuffix('en')}`);
        lines.uk.push(`Тепер для збирання потрібен рецепт за ${nc} золота${totalSuffix('uk')}`);
        lines.cs.push(`Nyní vyžaduje recept za ${nc} zlata${totalSuffix('cs')}`);
    } else if (compChanged && oc !== nc) {
        const d = nc > oc ? 'inc' : 'dec';
        lines.ru.push(`Стоимость рецепта ${RC[d].ru} с ${oc} до ${nc} золота${totalSuffix('ru')}`);
        lines.en.push(`Recipe cost ${RC[d].en} from ${oc} to ${nc}${totalSuffix('en')}`);
        lines.uk.push(`Вартість рецепта ${RC[d].uk} з ${oc} до ${nc} золота${totalSuffix('uk')}`);
        lines.cs.push(`Cena receptu ${RC[d].cs} z ${oc} na ${nc} zlata${totalSuffix('cs')}`);
    } else if (compChanged) {
        if (ot !== nt) {
            const td = nt > ot ? 'inc' : 'dec';
            lines.ru.push(`Общая стоимость ${TC[td].ru} с ${ot} до ${nt} золота`);
            lines.en.push(`Total cost ${TC[td].en} from ${ot}g to ${nt}g`);
            lines.uk.push(`Загальну вартість ${TC[td].uk} з ${ot} до ${nt} золота`);
            lines.cs.push(`Celková cena ${TC[td].cs} z ${ot} na ${nt} zlata`);
        } else {
            lines.ru.push(`Общая стоимость прежняя — ${nt} золота`);
            lines.en.push(`Total cost unchanged at ${nt}g`);
            lines.uk.push(`Загальна вартість незмінна — ${nt} золота`);
            lines.cs.push(`Celková cena beze změny — ${nt} zlata`);
        }
    } else if (oc !== nc) {
        const d = nc > oc ? 'inc' : 'dec';
        let ruT;
        let enT;
        let ukT;
        let csT;
        const enMoved = movedParts('en').length ? ` (${movedParts('en').join(', ')})` : '';
        if (ot === nt) {
            ruT = ` (общая стоимость прежняя — ${nt} золота${movedTail('ru')})`;
            enT = `. Total cost unchanged at ${nt}g${enMoved}`;
            ukT = ` (загальна вартість незмінна — ${nt} золота${movedTail('uk')})`;
            csT = ` (celková cena beze změny — ${nt} zlata${movedTail('cs')})`;
        } else {
            const td = nt > ot ? 'inc' : 'dec';
            ruT = ` (общая стоимость ${TC[td].ru} с ${ot} до ${nt} золота${movedTail('ru')})`;
            enT = `. Total cost ${TC[td].en} from ${ot}g to ${nt}g${enMoved}`;
            ukT = ` (загальну вартість ${TC[td].uk} з ${ot} до ${nt} золота${movedTail('uk')})`;
            csT = ` (celková cena ${TC[td].cs} z ${ot} na ${nt} zlata${movedTail('cs')})`;
        }
        lines.ru.push(`Стоимость рецепта ${RC[d].ru} с ${oc} до ${nc} золота${ruT}`);
        lines.en.push(`Recipe cost ${RC[d].en} from ${oc} to ${nc}${enT}`);
        lines.uk.push(`Вартість рецепта ${RC[d].uk} з ${oc} до ${nc} золота${ukT}`);
        lines.cs.push(`Cena receptu ${RC[d].cs} z ${oc} na ${nc} zlata${csT}`);
    } else if (ot !== nt) {
        const td = nt > ot ? 'inc' : 'dec';
        const because = (lang) => { const parts = movedParts(lang); return parts.length ? ` (${parts.join(', ')})` : ''; };
        if (nc > 0) {
            lines.ru.push(`Стоимость рецепта прежняя (${nc} золота). Общая стоимость ${TC[td].ru} с ${ot} до ${nt} золота${because('ru')}`);
            lines.en.push(`Recipe cost unchanged at ${nc}. Total cost ${TC[td].en} from ${ot}g to ${nt}g${because('en')}`);
            lines.uk.push(`Вартість рецепта незмінна (${nc} золота). Загальну вартість ${TC[td].uk} з ${ot} до ${nt} золота${because('uk')}`);
            lines.cs.push(`Cena receptu beze změny (${nc} zlata). Celková cena ${TC[td].cs} z ${ot} na ${nt} zlata${because('cs')}`);
        } else {
            lines.ru.push(`Общая стоимость ${TC[td].ru} с ${ot} до ${nt} золота${because('ru')}`);
            lines.en.push(`Total cost ${TC[td].en} from ${ot}g to ${nt}g${because('en')}`);
            lines.uk.push(`Загальну вартість ${TC[td].uk} з ${ot} до ${nt} золота${because('uk')}`);
            lines.cs.push(`Celková cena ${TC[td].cs} z ${ot} na ${nt} zlata${because('cs')}`);
        }
    }

    if (!lines.ru.length) return null;
    return {
        ru: lines.ru.join('\n'), en: lines.en.join('\n'), uk: lines.uk.join('\n'), cs: lines.cs.join('\n'),
    };
}

function recipeText(recipe, changed = false, oldRecipe = null) {
    if (!recipe) {
        return {
            ru: 'Рецепт удалён', en: 'Recipe removed', uk: 'Рецепт видалено', cs: 'Recept odstraněn',
        };
    }
    const join = (parts, conjunction) => {
        if (parts.length < 2) return parts[0] || '';
        return `${parts.slice(0, -1).join(', ')} ${conjunction} ${parts[parts.length - 1]}`;
    };
    const variantSignature = (variant) => JSON.stringify(
        (variant?.components || []).map(({ id, cost }) => ({ id, cost }))
    );
    const changedVariant = changed && oldRecipe
        ? recipe.variants?.find((variant) => {
            const previous = oldRecipe.variants?.find((candidate) => candidate.key === variant.key);
            return variantSignature(variant) !== variantSignature(previous);
        })
        : null;
    const selected = changedVariant || recipe.variants?.[0] || recipe;
    const components = selected.components || [];
    const totalCost = selected.total_cost ?? recipe.total_cost;
    const componentParts = {
        ru: components.map((component) => `${component.name} (${component.cost} золота)`),
        en: components.map((component) => `${component.name} (${component.cost} gold)`),
        uk: components.map((component) => `${component.name} (${component.cost} золота)`),
        cs: components.map((component) => `${component.name} (${component.cost} zlata)`),
    };
    if (recipe.recipe_cost > 0) {
        componentParts.ru.push(`рецепта (${recipe.recipe_cost} золота)`);
        componentParts.en.push(`a recipe (${recipe.recipe_cost} gold)`);
        componentParts.uk.push(`рецепта (${recipe.recipe_cost} золота)`);
        componentParts.cs.push(`receptu (${recipe.recipe_cost} zlata)`);
    }
    const body = {
        ru: `Собирается из ${join(componentParts.ru, 'и')}. Общая стоимость: ${totalCost} золота.`,
        en: `Built from ${join(componentParts.en, 'and')}. Total cost: ${totalCost} gold.`,
        uk: `Збирається з ${join(componentParts.uk, 'і')}. Загальна вартість: ${totalCost} золота.`,
        cs: `Skládá se z ${join(componentParts.cs, 'a')}. Celková cena: ${totalCost} zlata.`,
    };
    if (!changed) return body;
    // Стиль Valve: стоимость рецепта + общая стоимость + изменения состава.
    const diff = recipeChangeLines(oldRecipe, recipe);
    if (diff) return diff;
    // fallback (нет oldRecipe для сравнения) — описываем сборку целиком
    return {
        ru: `Рецепт изменён\nТеперь ${body.ru.charAt(0).toLowerCase()}${body.ru.slice(1)}`,
        en: `Recipe changed\nNow ${body.en.charAt(0).toLowerCase()}${body.en.slice(1)}`,
        uk: `Рецепт змінено\nТепер ${body.uk.charAt(0).toLowerCase()}${body.uk.slice(1)}`,
        cs: `Recept změněn\nNyní se ${body.cs.replace(/^Skládá se /, 'skládá ')}`,
    };
}

function splitNoteLines(note) {
    const perLang = {};
    let count = 1;
    for (const lang of LANGS) {
        perLang[lang] = String(note?.[lang] ?? '').split('\n');
        count = Math.max(count, perLang[lang].length);
    }
    const notes = [];
    for (let i = 0; i < count; i++) {
        const part = {};
        for (const lang of LANGS) part[lang] = (perLang[lang][i] ?? '').trim();
        if (LANGS.some((lang) => part[lang])) notes.push(part);
    }
    return notes;
}

// Порядок заметок предмета: рецепт наверх (подряд), стоимость вниз, остальное — как есть.
function orderItemNotes(notes, costShownInIntro = false) {
    const list = [...(notes || [])];
    // если стоимость уже показана (заметка рецепта «Собирается…/Рецепт изменён» в
    // списке ИЛИ вводная стоимость/сборка нового предмета), отдельная «Item Cost» не нужна —
    // общая стоимость уже указана
    const hasRecipe = costShownInIntro || list.some((note) => note.parameter === 'recipe');
    const filtered = hasRecipe ? list.filter((note) => note.parameter !== 'ItemCost') : list;
    const rank = (note) => (note.parameter === 'neutral_tier' ? 0
        : note.parameter === 'ItemCost' ? 1
        : note.parameter === 'recipe' ? 2
        : /^(Предмет )?[Бб]ольше (не|нельзя)(?![а-яё])/.test(note.note?.ru || '') ? 3 : 4);
    return filtered.sort((a, b) => rank(a) - rank(b));
}

function recipeSignature(recipe) {
    if (!recipe) return null;
    return JSON.stringify({
        variants: (recipe.variants || []).map((variant) => ({
            key: variant.key,
            // порядок компонентов не важен — сортируем, чтобы перестановка не считалась изменением рецепта
            components: variant.components
                .map(({ id, cost }) => ({ id: stripCustom(id), cost }))
                .sort((a, b) => a.id.localeCompare(b.id) || a.cost - b.cost),
            total_cost: variant.total_cost,
        })),
        recipe_cost: recipe.recipe_cost,
        total_cost: recipe.total_cost,
    });
}

function makeHeroMatcher(heroList) {
    const sorted = [...heroList].sort((a, b) => b.length - a.length);
    return (name) => sorted.find((hero) => name === hero || name.startsWith(`${hero}_`)) || null;
}

const stripHeroPrefix = (value) => value.replace(/^npc_dota_hero_/, '');
const modifierHeroName = (key) => key.replace(/^modifier_/, '').replace(/_\d+$/, '');

const isNeutralCreepAbility = (abilityKV) =>
    typeof abilityKV?.ScriptFile === 'string' && abilityKV.ScriptFile.startsWith('neutrals/woda_neutral_');

const isBossAbility = (abilityKV) =>
    typeof abilityKV?.ScriptFile === 'string' &&
    abilityKV.ScriptFile.startsWith('neutrals/') &&
    !isNeutralCreepAbility(abilityKV);

const bossIdFromAbility = (abilityId, abilityKV) => {
    const script = typeof abilityKV?.ScriptFile === 'string' ? abilityKV.ScriptFile.match(/^neutrals\/(.+)$/) : null;
    if (script) return script[1];
    const byName = abilityId.match(/^(.+?_boss)/);
    return byName ? byName[1] : abilityId;
};

function normText(value) {
    return String(value ?? '')
        .replace(/<[^>]+>/g, '')
        .replace(/[’ʼ]/g, "'")
        .replace(/\s+/g, ' ')
        .replace(/[.\s]+$/, '')
        .trim();
}

const TALENT_RED = '#e03e2e';
const TALENT_RED_OPEN = '';
const TALENT_RED_CLOSE = '';
function normTalentText(value) {
    return String(value ?? '')
        .replace(
            /<font\b[^>]*\bcolor\s*=\s*['"]?#(?:ff0000|e03e2e)\b[^>]*>([\s\S]*?)<\/font>/gi,
            (_, inner) => `${TALENT_RED_OPEN}${inner}${TALENT_RED_CLOSE}`
        )
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(new RegExp(`${TALENT_RED_OPEN}\\s*`, 'g'), TALENT_RED_OPEN)
        .replace(new RegExp(`\\s*${TALENT_RED_CLOSE}`, 'g'), TALENT_RED_CLOSE)
        .split(/\n+/)
        .map((segment) => segment.replace(/\s+/g, ' ').trim()
            .replace(new RegExp(`[.\\s]+(?=${TALENT_RED_CLOSE}*$)`), ''))
        .filter((segment) => segment.replace(/[]/g, '').trim())
        .join('. ')
        .replace(/:\.\s/g, ': ')
        .replace(new RegExp(`${TALENT_RED_CLOSE}\\.`, 'g'), `.${TALENT_RED_CLOSE}`)
        .replace(new RegExp(`${TALENT_RED_OPEN}([\\s\\S]*?)${TALENT_RED_CLOSE}`, 'g'),
            (_, inner) => `<font color='${TALENT_RED}'>${inner.trim()}</font>`)
        .replace(/\s+/g, ' ')
        .replace(/[.\s]+$/, '')
        .trim();
}

function stripTalentRed(value) {
    return String(value ?? '')
        .replace(/<\/?font\b[^>]*>/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

const comparableText = (value) => normText(value).normalize('NFKC').toLocaleLowerCase();
const isCosmetic = (oldValue, newValue) => comparableText(oldValue) === comparableText(newValue);
const localizationBaseKey = (key) => key.replace(/_\d+$/, '');

function localizationEntries(localizationDiff, lang) {
    const langDiff = localizationDiff.changed?.[lang] || {};
    const changed = Object.entries(langDiff.changed || {});
    const seen = new Set();
    const out = [];

    for (const [key, value] of changed) {
        if (!value || !('old' in value) || isCosmetic(value.old, value.new)) continue;
        const normalizedKey = localizationBaseKey(key);
        if (seen.has(normalizedKey)) continue;
        seen.add(normalizedKey);
        out.push({ key: normalizedKey, old: normText(value.old), new: normText(value.new) });
    }
    return out;
}

function heroTalentPositions(heroTree, heroShort) {
    const positions = {};
    const pattern = new RegExp(`^modifier_${heroShort}_\\d+$`);

    for (const [branch, levels] of Object.entries(heroTree || {})) {
        if (!levels || typeof levels !== 'object') continue;
        for (const [level, entries] of Object.entries(levels)) {
            if (!Array.isArray(entries)) continue;
            entries.forEach((entry, slot) => {
                const id = Array.isArray(entry) ? entry[0] : entry;
                if (typeof id === 'string' && pattern.test(id)) {
                    positions[id] = { branch: Number(branch), level: Number(level), slot };
                }
            });
        }
    }
    return positions;
}

function heroTalentMeta(heroTree, heroShort) {
    const meta = {};
    const pattern = new RegExp(`^modifier_${heroShort}_\\d+$`);
    for (const levels of Object.values(heroTree || {})) {
        if (!levels || typeof levels !== 'object') continue;
        for (const entries of Object.values(levels)) {
            if (!Array.isArray(entries)) continue;
            for (const entry of entries) {
                if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !pattern.test(entry[0])) continue;
                const req = Array.isArray(entry[4]) && entry[4].length ? `${entry[4][0]}:${entry[4][1]}` : null;
                meta[entry[0]] = { requires: req };
            }
        }
    }
    return meta;
}

function requiredPlace(meta, positions, talentId) {
    const req = meta[talentId] && meta[talentId].requires;
    if (!req) return null;
    const partner = positions[req.split(':')[0]];
    return partner ? `${partner.branch}|${partner.level}` : `?${req.split(':')[0]}`;
}
const TALENT_BRANCH_RU = { 1: 'сила', 2: 'ловкость', 3: 'интеллект' };
function placeLabel(place, ownBranch) {
    if (!place) return null;
    if (place.startsWith('?')) return place.slice(1);
    const [branch, level] = place.split('|').map(Number);
    return branch === Number(ownBranch) ? `Талант ${level}` : `Талант ${level} (${TALENT_BRANCH_RU[branch] || branch})`;
}

const REL_BRANCH = {
    1: { ru: 'Силы', en: 'Strength', uk: 'Сили' },
    2: { ru: 'Ловкости', en: 'Agility', uk: 'Спритності' },
    3: { ru: 'Интеллекта', en: 'Intelligence', uk: 'Інтелекту' },
};
const REL_AND = { ru: 'и', en: 'and', uk: 'та' };
const relQuote = (n, lang) => `«${lang === 'en' ? 'Talent' : 'Талант'} ${n}»`;
const relJoin = (items, lang) => (items.length < 2
    ? items[0]
    : `${items.slice(0, -1).join(', ')} ${REL_AND[lang]} ${items[items.length - 1]}`);
function relPartners(places, lang) {
    const byBranch = {};
    for (const p of places) (byBranch[p.branch] = byBranch[p.branch] || []).push(p.level);
    const branches = Object.keys(byBranch).map(Number).sort((a, b) => a - b);
    branches.forEach((b) => { byBranch[b] = [...new Set(byBranch[b])].sort((x, y) => x - y); });
    const branchPhrase = (names, many) => (lang === 'en'
        ? `from the ${names} branch${many ? 'es' : ''}`
        : `${lang === 'ru' ? (many ? 'из веток' : 'из ветки') : (many ? 'з гілок' : 'з гілки')} ${names}`);
    if (branches.length > 1 && branches.every((b) => byBranch[b].join() === byBranch[branches[0]].join())) {
        const talents = relJoin(byBranch[branches[0]].map((n) => relQuote(n, lang)), lang);
        return `${talents} ${branchPhrase(relJoin(branches.map((b) => REL_BRANCH[b][lang]), lang), true)}`;
    }
    return branches
        .map((b) => `${relJoin(byBranch[b].map((n) => relQuote(n, lang)), lang)} ${branchPhrase(REL_BRANCH[b][lang], false)}`)
        .join(', ');
}
const relText = (build) => ({ ru: build('ru'), en: build('en'), uk: build('uk') });
const LINK_TEXT = {
    new: (n) => relText((l) => ({ ru: `Требует прокачки ${relQuote(n, l)}`, en: `Requires upgrading ${relQuote(n, l)}`, uk: `Потребує прокачування ${relQuote(n, l)}` })[l]),
    add: (n) => relText((l) => ({ ru: `Теперь требует прокачки ${relQuote(n, l)}`, en: `Now requires upgrading ${relQuote(n, l)}`, uk: `Тепер потребує прокачування ${relQuote(n, l)}` })[l]),
    was: (n) => relText((l) => ({ ru: `Раньше требовался для прокачки ${relQuote(n, l)}`, en: `Previously required upgrading ${relQuote(n, l)}`, uk: `Раніше потребував прокачування ${relQuote(n, l)}` })[l]),
    del: () => ({ ru: 'Больше не требует прокачки других талантов', en: 'No longer requires upgrading other talents', uk: 'Більше не потребує прокачування інших талантів' }),
};
const LOCK_TEXT = {
    mutual: (pl) => relText((l) => ({ ru: `Нельзя изучить вместе с ${relPartners(pl, l)}`, en: `Cannot be learned together with ${relPartners(pl, l)}`, uk: `Не можна вивчити разом із ${relPartners(pl, l)}` })[l]),
    oneway: (pl) => relText((l) => ({ ru: `Нельзя изучить, если уже изучен ${relPartners(pl, l)}`, en: `Cannot be learned if ${relPartners(pl, l)} is already learned`, uk: `Не можна вивчити, якщо вже вивчено ${relPartners(pl, l)}` })[l]),
    addMutual: (pl) => relText((l) => ({ ru: `Теперь нельзя изучить вместе с ${relPartners(pl, l)}`, en: `Can no longer be learned together with ${relPartners(pl, l)}`, uk: `Тепер не можна вивчити разом із ${relPartners(pl, l)}` })[l]),
    addOneway: (pl) => relText((l) => ({ ru: `Теперь нельзя изучить, если уже изучен ${relPartners(pl, l)}`, en: `Can no longer be learned if ${relPartners(pl, l)} is already learned`, uk: `Тепер не можна вивчити, якщо вже вивчено ${relPartners(pl, l)}` })[l]),
    del: (pl) => relText((l) => ({ ru: `Теперь можно изучить вместе с ${relPartners(pl, l)}`, en: `Can now be learned together with ${relPartners(pl, l)}`, uk: `Тепер можна вивчити разом із ${relPartners(pl, l)}` })[l]),
    was: (pl) => relText((l) => ({ ru: `Раньше нельзя было изучить вместе с ${relPartners(pl, l)}`, en: `Previously could not be learned together with ${relPartners(pl, l)}`, uk: `Раніше не можна було вивчити разом із ${relPartners(pl, l)}` })[l]),
};
const placeLevelOf = (place) => Number(String(place).split('|')[1]);

function talentMoves(oldTree, newTree, heroShort) {
    const oldPositions = heroTalentPositions(oldTree, heroShort);
    const newPositions = heroTalentPositions(newTree, heroShort);
    const ids = new Set([...Object.keys(oldPositions), ...Object.keys(newPositions)]);
    const moved = [];
    const added = [];
    const removed = [];

    for (const id of ids) {
        const oldPosition = oldPositions[id];
        const newPosition = newPositions[id];
        if (oldPosition && newPosition) {
            if (oldPosition.branch !== newPosition.branch || oldPosition.level !== newPosition.level) {
                moved.push({ type: 'moved', id, old: oldPosition, new: newPosition });
            }
        } else if (newPosition) {
            added.push({ type: 'added', id, old: null, new: newPosition });
        } else {
            removed.push({ type: 'removed', id, old: oldPosition, new: null });
        }
    }

    const replaced = [];
    for (let index = added.length - 1; index >= 0; index -= 1) {
        const addition = added[index];
        const removedIndex = removed.findIndex((entry) =>
            entry.old.branch === addition.new.branch &&
            entry.old.level === addition.new.level &&
            entry.old.slot === addition.new.slot
        );
        if (removedIndex >= 0) {
            const deletion = removed[removedIndex];
            replaced.push({
                type: 'replaced',
                id: addition.id,
                old: { id: deletion.id, ...deletion.old },
                new: { id: addition.id, ...addition.new },
            });
            added.splice(index, 1);
            removed.splice(removedIndex, 1);
        }
    }
    return [...moved, ...replaced, ...added, ...removed];
}

function formatPatchNumber(version) {
    return String(version);
}

function shopCategoryMap(shops) {
    const map = {};
    for (const [category, ids] of Object.entries(shops || {})) {
        for (const id of ids || []) map[id] = category;
    }
    return map;
}

function itemValueMap(itemKV) {
    const values = {};
    const flatten = (source) => {
        for (const [key, raw] of Object.entries(source || {})) {
            let sourceValue = raw;
            if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
                if (!('value' in sourceValue)) continue;
                sourceValue = sourceValue.value;
            }
            const value = Array.isArray(sourceValue) ? sourceValue.join(' ') : sourceValue;
            if (typeof value === 'string') values[key.toLowerCase()] = value;
        }
    };
    flatten(itemKV);
    flatten(itemKV && itemKV.AbilityValues);
    // Псевдонимы ванильных переменных тултипа на спец-поля предмета
    // (напр. интервал получения заряда = AbilityChargeRestoreTime).
    const TOOLTIP_VALUE_ALIASES = { stack_gain_time: 'abilitychargerestoretime' };
    for (const [alias, source] of Object.entries(TOOLTIP_VALUE_ALIASES)) {
        if (!(alias in values) && source in values) values[alias] = values[source];
    }
    return values;
}

function substituteItemVars(template, values) {
    const UNKNOWN_START = "";
    const UNKNOWN_END = "";
    return String(template)
        .replace(/%([a-zA-Z0-9_]+)%/g, (match, name) => {
            const key = name.toLowerCase();
            return key in values ? values[key] : `${UNKNOWN_START}${name}${UNKNOWN_END}`;
        })
        .replace(/%%/g, '%')
        .replace(new RegExp(`${UNKNOWN_START}([^${UNKNOWN_END}]+)${UNKNOWN_END}`, 'g'), '%$1%');
}

function normalizeDescriptionText(text, lang) {
    if (typeof text !== 'string') return text;
    let out = text.replace(/’/g, "'").replace(/(\d)\.0(?!\d)/g, '$1');
    if (lang === 'ru' || lang === 'uk') out = out.replace(/(\d)\.(\d)/g, '$1,$2');
    return out;
}

function stripUnresolvedVars(text) {
    if (typeof text !== 'string' || !/%[a-zA-Z0-9_]+%/.test(text)) return text;
    return text
        .replace(/%[a-zA-Z0-9_]+%/g, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\s+([.,;:!?])/g, '$1')
        .replace(/\(\s*\)/g, '')
        .trim();
}

function buildItemDescription(itemId, itemKV, localizationSources, fallbackKV) {
    const values = { ...itemValueMap(fallbackKV), ...itemValueMap(itemKV) };
    const targets = [
        `dota_tooltip_ability_${itemId}_description`,
        `dota_tooltip_ability_${String(itemId).replace(/_custom$/, '')}_description`,
    ];
    const templateFor = (lang) => {
        for (const source of localizationSources) {
            const tokens = (source && source[lang]) || {};
            for (const target of targets) {
                const key = Object.keys(tokens).find((token) => token.toLowerCase() === target);
                if (key && String(tokens[key]).trim()) return tokens[key];
            }
        }
        return null;
    };
    
    if (!templateFor('ru') && !templateFor('en')) return null;

    const text = (lang) => {
        const template = templateFor(lang) || templateFor('en') || templateFor('ru');
        if (!template) return null;
        const spaced = substituteItemVars(template, values)
            // разделитель секций «nn» перед следующим заголовком -> «. »
            .replace(/\s*n{2}\s*(?=<\s*h1\s*>)/gi, '. ')
            // заголовок «<h1>Пассивное: Salvo</h1>» -> «Пассивное: Salvo. »
            .replace(/<\s*h1\s*>(.*?)<\s*\/\s*h1\s*>/gi, (_, head) =>
                `${normText(String(head).replace(/<[^>]+>/g, ' ')).replace(/[.\s]+$/, '')}. `)
            .replace(/<[^>]+>|\\n|<br\s*\/?>/gi, ' ');
        // убрать пробел перед пунктуацией и точку в конце
        const cleaned = normalizeDescriptionText(
            stripUnresolvedVars(normText(spaced).replace(/\s+([.,;:!?])/g, '$1')),
            lang
        );
        if (!cleaned) return null;
        return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
    };
    return { ru: text('ru'), en: text('en'), uk: text('uk'), cs: text('en') || text('ru') };
}

function buildItemDescriptionSections(itemId, itemKV, localizationSources) {
    const values = itemValueMap(itemKV);
    const targets = [
        `dota_tooltip_ability_${itemId}_description`,
        `dota_tooltip_ability_${String(itemId).replace(/_custom$/, '')}_description`,
    ];
    const templateFor = (lang) => {
        for (const source of localizationSources) {
            const tokens = (source && source[lang]) || {};
            for (const target of targets) {
                const key = Object.keys(tokens).find((token) => token.toLowerCase() === target);
                if (key && String(tokens[key]).trim()) return tokens[key];
            }
        }
        return null;
    };
    const parse = (lang) => {
        const template = templateFor(lang) || templateFor('en') || templateFor('ru');
        if (!template) return [];
        const substituted = substituteItemVars(template, values)
            .replace(/n{2}(?=<\s*h1\s*>)/gi, '\n')
            .replace(/<br\s*\/?>|\\n/gi, '\n');
        const sections = [];
        const matcher = /<\s*h1\s*>(.*?)<\s*\/\s*h1\s*>([\s\S]*?)(?=<\s*h1\s*>|$)/gi;
        let match;
        while ((match = matcher.exec(substituted))) {
            const title = normText(match[1].replace(/<[^>]+>/g, ' '));
            const text = normText(match[2].replace(/<[^>]+>/g, ' '));
            if (title || text) sections.push({ title, text });
        }
        return sections;
    };
    const parsed = { ru: parse('ru'), en: parse('en'), uk: parse('uk') };
    const count = Math.max(parsed.ru.length, parsed.en.length, parsed.uk.length);
    if (!count) return [];
    return Array.from({ length: count }, (_, index) => {
        const fallback = parsed.en[index] || parsed.ru[index] || parsed.uk[index] || { title: '', text: '' };
        const field = (name) => ({
            ru: (parsed.ru[index] || fallback)[name] || null,
            en: (parsed.en[index] || fallback)[name] || null,
            uk: (parsed.uk[index] || fallback)[name] || null,
            cs: (parsed.en[index] || parsed.ru[index] || fallback)[name] || null,
        });
        return { title: field('title'), text: field('text') };
    });
}

const ABILITY_FIELD_LABELS = {
    AbilityCooldown: { ru: 'Перезарядка', en: 'Cooldown', uk: 'Перезарядка', cs: 'Cooldown' },
    AbilityChargeRestoreTime: { ru: 'Восстановление заряда', en: 'Charge restore time', uk: 'Відновлення заряду', cs: 'Charge restore time' },
    AbilityCastRange: { ru: 'Дальность применения', en: 'Cast range', uk: 'Дальність застосування', cs: 'Cast range' },
    AbilityManaCost: { ru: 'Расход маны', en: 'Mana cost', uk: 'Витрати мани', cs: 'Mana cost' },
    ItemCost: { ru: 'Стоимость', en: 'Cost', uk: 'Вартість', cs: 'Cost' },
};

const isNumericValue = (value) =>
    typeof value === 'string' && /^[\d.,%]+(?: \/ [\d.,%]+)*$/.test(value);

const COMMON_VALUE_LABELS = {
    bonus_damage: { ru: 'Дополнительный урон', en: 'Bonus damage', uk: 'Додаткова шкода', cs: 'Bonus damage' },
    bonus_attack_speed: { ru: 'Скорость атаки', en: 'Attack speed', uk: 'Швидкість атаки', cs: 'Attack speed' },
    bonus_armor: { ru: 'Броня', en: 'Armor', uk: 'Броня', cs: 'Armor' },
    bonus_all_stats: { ru: 'Все атрибуты', en: 'All attributes', uk: 'Усі атрибути', cs: 'All attributes' },
    bonus_strength: { ru: 'Сила', en: 'Strength', uk: 'Сила', cs: 'Strength' },
    bonus_agility: { ru: 'Ловкость', en: 'Agility', uk: 'Спритність', cs: 'Agility' },
    bonus_intellect: { ru: 'Интеллект', en: 'Intelligence', uk: 'Інтелект', cs: 'Intelligence' },
    bonus_health: { ru: 'Здоровье', en: 'Health', uk: 'Здоров’я', cs: 'Health' },
    bonus_mana: { ru: 'Мана', en: 'Mana', uk: 'Мана', cs: 'Mana' },
    bonus_health_regen: { ru: 'Восстановление здоровья', en: 'Health regeneration', uk: 'Відновлення здоров’я', cs: 'Health regeneration' },
    bonus_mana_regen: { ru: 'Восстановление маны', en: 'Mana regeneration', uk: 'Відновлення мани', cs: 'Mana regeneration' },
    bonus_movement_speed: { ru: 'Скорость передвижения', en: 'Movement speed', uk: 'Швидкість пересування', cs: 'Movement speed' },
};

function normalizedAbilityValue(raw, percent = false, options = {}) {
    let value = raw;
    if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value) {
        value = value.value;
    }
    if (Array.isArray(value)) value = value.join(' ');
    if (value === undefined || value === null || typeof value === 'object') return null;

    let rawParts = String(value)
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (Number.isInteger(options.valueIndex) && rawParts.length > 1) {
        rawParts = [rawParts[options.valueIndex] ?? rawParts[rawParts.length - 1]];
    }
    const parts = rawParts
        .map((part) => {
            const number = Number(part);
            const formatted = Number.isFinite(number)
                ? (Number.isInteger(number) ? String(number) : String(Math.round(number * 100) / 100))
                : part;
            return `${formatted}${percent ? '%' : ''}`;
        });
    const unique = [...new Set(parts)].filter((part) => part && part !== '0' && part !== '0%');
    return unique.length ? unique.join(' / ') : null;
}

// прирост значения за уровень героя (hero_levelup): знак выносим в коннектор,
// чтобы отрицательный прирост давал «50 - 0.5 за уровень», а не «50 + -0.5»
function perLevelIncrement(raw, percent) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !('hero_levelup' in raw)) return null;
    const num = Number(String(raw.hero_levelup).replace(/^\+/, ''));
    if (!Number.isFinite(num) || num === 0) return null;
    const magnitude = Math.abs(num);
    const formatted = Number.isInteger(magnitude) ? String(magnitude) : String(Math.round(magnitude * 100) / 100);
    return { sign: num < 0 ? '-' : '+', value: `${formatted}${percent ? '%' : ''}` };
}

function buildAbilityValues(abilityId, abilityKV, localizationSources, options = {}) {
    if (!abilityKV || typeof abilityKV !== 'object') return [];
    const canonicalId = String(abilityId).replace(/_custom$/, '');
    const tokenTargets = (field) => [
        `dota_tooltip_ability_${abilityId}_${field}`,
        `dota_tooltip_ability_${canonicalId}_${field}`,
    ].map((target) => target.toLowerCase());
    const localizedLabel = (field, lang) => {
        for (const source of localizationSources) {
            const tokens = (source && source[lang]) || {};
            const key = Object.keys(tokens).find((token) => tokenTargets(field).includes(token.toLowerCase()));
            if (key && String(tokens[key]).trim()) return String(tokens[key]).trim();
        }
        return null;
    };
    const cleanValueLabel = (label) => normText(String(label).replace(/^%/, '').replace(/:$/, ''));
    const result = [];

    for (const [key, raw] of Object.entries(abilityKV.AbilityValues || {})) {
        const rawLabels = {
            ru: localizedLabel(key, 'ru'),
            en: localizedLabel(key, 'en'),
            uk: localizedLabel(key, 'uk'),
        };
        const readableLabels = Object.fromEntries(
            Object.entries(rawLabels).map(([lang, label]) => [lang, label && !label.includes('$') ? label : null])
        );
        const commonLabel = COMMON_VALUE_LABELS[key];
        if (!readableLabels.ru && !readableLabels.en && !commonLabel && !options.includeUnlocalized) continue;
        const percent = Object.values(rawLabels).some((label) => label && label.startsWith('%'));
        const value = normalizedAbilityValue(raw, percent);
        if (!value) continue;
        const perLevel = perLevelIncrement(raw, percent);
        const fallback = readableLabels.en || readableLabels.ru || parameterTitle(key);
        result.push({
            key,
            label: {
                ru: cleanValueLabel(readableLabels.ru || commonLabel?.ru || fallback),
                en: cleanValueLabel(readableLabels.en || commonLabel?.en || fallback),
                uk: cleanValueLabel(readableLabels.uk || commonLabel?.uk || fallback),
                cs: cleanValueLabel(commonLabel?.cs || readableLabels.en || readableLabels.ru || fallback),
            },
            value,
            ...(perLevel && { perLevel }),
        });
    }

    for (const [key, label] of Object.entries(ABILITY_FIELD_LABELS)) {
        if (result.some((entry) => entry.key === key)) continue;
        const raw = abilityKV[key] !== undefined ? abilityKV[key] : abilityKV.AbilityValues?.[key];
        const value = normalizedAbilityValue(raw);
        if (value && isNumericValue(value)) result.push({ key, label, value });
    }
    return result;
}

// Склеивает описание способности и её параметры в одну локализованную строку:
// «<описание>. Label: value. Label: value.»
function mergeAbilityDescription(descNote, values) {
    const result = {};
    for (const lang of NATURE_LANGS) {
        const segments = [];
        const desc = descNote && (descNote[lang] || descNote.en || descNote.ru);
        if (desc && String(desc).trim()) segments.push(String(desc).trim().replace(/[.\s]+$/, ''));
        for (const entry of values || []) {
            const label = entry.label && (entry.label[lang] || entry.label.en || entry.label.ru);
            if (!label || entry.value == null || entry.value === '') continue;
            // только первая буква заглавная, остальные строчные
            const t = String(label).trim();
            const nice = t ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : t;
            const valueText = entry.perLevel
                ? `${entry.value} ${entry.perLevel.sign} ${entry.perLevel.value} ${PER_LEVEL_SUFFIX[lang] || PER_LEVEL_SUFFIX.en}`
                : entry.value;
            segments.push(`${nice}: ${valueText}`);
        }
        result[lang] = segments.length
            ? normalizeDescriptionText(`${segments.join('. ')}.`, lang)
            : null;
    }
    return result;
}

// Note-строки предмета из локализации: DOTA_Tooltip_ability_item_<id>_Note0/Note1/...
function itemSourceNotes(itemId, itemKV, localizationSources) {
    const values = itemValueMap(itemKV);
    const canonicalId = String(itemId).replace(/_custom$/, '');
    const prefixes = [
        `dota_tooltip_ability_${itemId}_note`,
        `dota_tooltip_ability_${canonicalId}_note`,
    ].map((p) => p.toLowerCase());
    const indices = new Set();
    for (const source of localizationSources || []) {
        for (const lang of NATURE_LANGS) {
            for (const key of Object.keys((source && source[lang]) || {})) {
                const kl = key.toLowerCase();
                for (const p of prefixes) {
                    if (kl.startsWith(p) && /^\d+$/.test(kl.slice(p.length))) indices.add(Number(kl.slice(p.length)));
                }
            }
        }
    }
    const clean = (raw) => normText(substituteItemVars(String(raw), values).replace(/<[^>]+>|\\n|<br\s*\/?>/gi, ' '));
    const textFor = (idx, lang) => {
        for (const source of localizationSources || []) {
            const tokens = (source && source[lang]) || {};
            for (const p of prefixes) {
                const key = Object.keys(tokens).find((k) => k.toLowerCase() === `${p}${idx}`);
                if (key && String(tokens[key]).trim()) return clean(tokens[key]);
            }
        }
        return null;
    };
    const notes = [];
    for (const idx of [...indices].sort((a, b) => a - b)) {
        const en = textFor(idx, 'en');
        const ru = textFor(idx, 'ru');
        if (!en && !ru) continue;
        notes.push({ ru: ru || en, en: en || ru, uk: textFor(idx, 'uk') || en || ru, cs: en || ru });
    }
    return notes;
}

// Ноты для новых предметов: цена и список бонусов одной строкой.
const ITEM_GIVES_HEAD = { ru: 'Дает', en: 'Gives', uk: 'Дає', cs: 'Dává' };
const ITEM_GIVES_JOIN = { ru: 'и', en: 'and', uk: 'і', cs: 'a' };
const ITEM_COST_TEXT = {
    ru: (c) => `Стоит ${c} золота`,
    en: (c) => `Costs ${c} gold`,
    uk: (c) => `Коштує ${c} золота`,
    cs: (c) => `Stojí ${c} zlata`,
};

function itemCostNote(cost) {
    return Object.fromEntries(NATURE_LANGS.map((lang) => [lang, ITEM_COST_TEXT[lang](cost)]));
}

// «Дает 250 к мане, 6 к броне и 100 к здоровью.» — лейблы уже в нужном падеже (из item_values)
function itemGivesNote(values) {
    if (!values || !values.length) return null;
    const note = {};
    let any = false;
    for (const lang of NATURE_LANGS) {
        const parts = (values || []).map((v) => {
            const label = (v.label && (v.label[lang] || v.label.en || v.label.ru)) || '';
            const val = String(v.value).replace(/^\+/, '').trim();
            return label ? `${val} ${label}` : val;
        }).filter((p) => p && p.trim());
        if (!parts.length) { note[lang] = null; continue; }
        any = true;
        const joined = parts.length > 1
            ? `${parts.slice(0, -1).join(', ')} ${ITEM_GIVES_JOIN[lang]} ${parts[parts.length - 1]}`
            : parts[0];
        note[lang] = `${ITEM_GIVES_HEAD[lang]} ${joined}`;
    }
    return any ? note : null;
}

// Убрать точку в конце строки (во всех языках).
function stripTrailingDot(note) {
    return Object.fromEntries(Object.entries(note || {}).map(([lang, text]) =>
        [lang, text == null ? text : String(text).replace(/\s*\.\s*$/, '').trim() || null]));
}

// Секция описания предмета в ноту: «Активное: Name. текст» (точка в конце убирается).
function itemSectionNote(section) {
    const note = {};
    for (const lang of NATURE_LANGS) {
        const title = (section.title && (section.title[lang] || section.title.en || section.title.ru)) || '';
        const text = (section.text && (section.text[lang] || section.text.en || section.text.ru)) || '';
        const combined = [title, text].map((s) => String(s).trim()).filter(Boolean).join('. ');
        note[lang] = combined || null;
    }
    return note;
}

const ITEM_STAT_VARIABLE_ALIASES = {
    selected_attribute: 'selected_attrib',
};

function buildItemCharacteristics(itemId, itemKV, localizationSources, options = {}) {
    if (!itemKV || typeof itemKV !== 'object') return [];
    const canonicalId = String(itemId).replace(/_custom$/, '');
    const localizedToken = (targets, lang) => {
        const normalizedTargets = targets.map((target) => target.toLowerCase());
        for (const source of localizationSources) {
            const tokens = (source && source[lang]) || {};
            const key = Object.keys(tokens).find((token) => normalizedTargets.includes(token.toLowerCase()));
            if (key && String(tokens[key]).trim()) return String(tokens[key]).trim();
        }
        return null;
    };
    const result = [];

    for (const [key, raw] of Object.entries(itemKV.AbilityValues || {})) {
        const statTargets = [
            `dota_tooltip_ability_${itemId}_${key}`,
            `dota_tooltip_ability_${canonicalId}_${key}`,
        ];
        const statTokens = {
            ru: localizedToken(statTargets, 'ru'),
            en: localizedToken(statTargets, 'en'),
            uk: localizedToken(statTargets, 'uk'),
        };
        const markerToken = statTokens.en || statTokens.ru || statTokens.uk || '';
        const marker = markerToken.match(/\$([a-z0-9_]+)/i);
        let labels;
        let prefix = markerToken;
        if (marker) {
            const variable = marker[1].toLowerCase();
            const localizationVariable = ITEM_STAT_VARIABLE_ALIASES[variable] || variable;
            const variableTargets = [`dota_ability_variable_${localizationVariable}`];
            labels = {
                ru: localizedToken(variableTargets, 'ru'),
                en: localizedToken(variableTargets, 'en'),
                uk: localizedToken(variableTargets, 'uk'),
            };
            prefix = markerToken.slice(0, marker.index);
        } else if (options.includeReadableTokens && markerToken) {
            labels = statTokens;
        } else {
            continue;
        }
        if (!labels.ru && !labels.en) continue;

        const percent = prefix.includes('%');
        const reduce = prefix.includes('-');
        let value = normalizedAbilityValue(raw, percent, options);
        if (!value) continue;
        if (reduce) {
            value = value.split(' / ').map((part) => /^[+-]/.test(part) ? part : `-${part}`).join(' / ');
        } else if (options.signPositive && prefix.includes('+')) {
            value = value.split(' / ').map((part) => /^[+-]/.test(part) ? part : `+${part}`).join(' / ');
        }
        // красный маркер (дебафф) — по наличию <font color='#e03e2e'> в токене source
        const highlighted = /color\s*=\s*['"]?#e03e2e/i.test(
            [markerToken, labels.ru, labels.en, labels.uk].filter(Boolean).join(' ')
        );
        const clean = (label) => normText(String(label).replace(/<[^>]+>/g, ' ').replace(/^[%+\-\s]+/, ''));
        const fallback = labels.en || labels.ru;
        result.push({
            key,
            label: {
                ru: clean(labels.ru || fallback),
                en: clean(labels.en || fallback),
                uk: clean(labels.uk || fallback),
                cs: clean(labels.en || labels.ru),
            },
            value,
            ...(highlighted && { negative: true }),
        });
    }
    return result;
}

const SHOP_CATEGORY_NAMES = {
    consumables: { ru: 'Расходники', en: 'Consumables', uk: 'Витратні', cs: 'Spotřební' },
    attributes: { ru: 'Атрибуты', en: 'Attributes', uk: 'Атрибути', cs: 'Atributy' },
    weapons_armor: { ru: 'Оружие и броня', en: 'Weapons and armor', uk: 'Зброя та броня', cs: 'Zbraně a brnění' },
    misc: { ru: 'Разное', en: 'Miscellaneous', uk: 'Різне', cs: 'Ostatní' },
    secretshop: { ru: 'Потайная лавка', en: 'Secret shop', uk: 'Таємна крамниця', cs: 'Tajný obchod' },
    basics: { ru: 'Основные', en: 'Basics', uk: 'Основні', cs: 'Základní' },
    support: { ru: 'Поддержка', en: 'Support', uk: 'Підтримка', cs: 'Podpora' },
    magics: { ru: 'Магия', en: 'Magic', uk: 'Магія', cs: 'Magie' },
    defense: { ru: 'Защита', en: 'Defense', uk: 'Захист', cs: 'Obrana' },
    weapons: { ru: 'Оружие', en: 'Weapons', uk: 'Зброя', cs: 'Zbraně' },
    artifacts: { ru: 'Артефакты', en: 'Artifacts', uk: 'Артефакти', cs: 'Artefakty' },
};
const NEW_ITEM_IN_CATEGORY = { ru: 'Новый предмет в категории', en: 'New item in category', uk: 'Новий предмет у категорії', cs: 'Nový předmět v kategorii' };
const NEW_ITEM_HEAD = { ru: 'Новый предмет', en: 'New item', uk: 'Новий предмет', cs: 'Nový předmět' };

// Стандартные (запасные) картинки по типам — ключи в бакете
const STD_IMAGE = {
    ability: 'pages/patches/standard_ability.webp',
    hero: 'pages/patches/standard_hero.webp',
    item: 'pages/patches/standard_item.webp',
    creep: 'pages/patches/standard_creep.webp',
};
// у врождённых способностей запасная — иконка врождённости, а не стандартная
const INNATE_ICON = 'abilities/innate_icon.png';

function itemImageCandidates(id, texture) {
    const base = (s) => String(s).replace(/^item_/, '');
    const strip = (s) => base(s).replace(/_custom$/, '');
    const names = [];
    if (texture) names.push(base(texture), strip(texture));
    names.push(base(id), strip(id));
    const cands = [];
    const seen = new Set();
    const push = (c) => { if (c && !seen.has(c)) { seen.add(c); cands.push(c); } };
    for (const n of names) {
        const noEnh = n.replace(/^enhancement_/, '');
        push(`images/items/${n}.webp`);
        if (noEnh !== n) push(`images/items/${noEnh}.webp`);
    }
    return cands;
}
function friendlyHeroPrefix(value) {
    const s = String(value);
    for (const [source, replacement] of HERO_REPLACEMENTS) {
        if (s.startsWith(`${source}_`)) return replacement + s.slice(source.length);
    }
    return s;
}

function abilityImageCandidates(id, texture, altId) {
    const clean = (s) => String(s).replace(/_custom$/, '');
    const cands = [];
    const push = (s) => {
        const key = `abilities/${clean(s)}.webp`;
        if (!cands.includes(key)) cands.push(key);
    };
    if (texture) push(friendlyHeroPrefix(texture));
    push(friendlyHeroPrefix(id));
    if (texture) push(texture);
    push(id);
    if (altId) push(altId);
    return cands;
}
const heroImagePath = (heroId) => `images/heroes/heroesPreview/${heroId}.webp`;
const talentImagePath = (heroId, num) => `images/heroes/talents/${heroId}/${num}.webp`;

function talentNumberFromId(heroId, talentId) {
    if (!talentId) return '';
    const stripped = String(talentId).replace(new RegExp(`^modifier_${heroId}_`), '');
    return stripped === talentId ? String(talentId).replace(/^modifier_/, '') : stripped;
}

// Убирает дубликаты способностей base+custom (напр. anti-mage_persectur и
// anti-mage_persectur_custom) — оставляет более содержательную (обычно _custom),
// чтобы одна и та же врождёнка не задваивалась.
function dedupeAbilities(abilities) {
    // предпочитаем реально используемую: врождённую (innate), затем _custom-версию
    const score = (ab) => (ab.innate ? 2 : 0) + (/_custom$/.test(ab.ability_id) ? 1 : 0);
    const byCanon = new Map();
    for (const ab of abilities) {
        const canon = ab.ability_id.replace(/_custom$/, '');
        const existing = byCanon.get(canon);
        if (!existing || score(ab) > score(existing)) byCanon.set(canon, ab);
    }
    return [...byCanon.values()];
}

function orderAbilities(list, slotOrder) {
    const rank = (ab) => (ab.innate ? 0 : ab.is_removed ? 1 : ab.is_new ? 2 : 3);
    const slot = (ab) => {
        if (!slotOrder) return Number.MAX_SAFE_INTEGER;
        const index = slotOrder.get(abilityCanon(replaceHeroKey(ab.ability_id)));
        return index === undefined ? Number.MAX_SAFE_INTEGER : index;
    };
    return list
        .map((ab, index) => ({ ab, index }))
        .sort((a, b) => rank(a.ab) - rank(b.ab) || slot(a.ab) - slot(b.ab) || a.index - b.index)
        .map(({ ab }) => ab);
}

// «Природная» заметка («Теперь является врождённой способностью…» и аналоги) — всегда первой.
// Если их несколько (напр. «стала врождённой» из diff полей + синтетическая «новая …»
// после переноса способности к герою) — оставляем одну: приоритет у более точной
// «стала врождённой/базовой» (parameter: 'Innate'), иначе — первую по порядку.
// плейсхолдеры вида {change_label}/{new_raw_value} есть только у сырых числовых
// заметок; смысловые («Теперь наносит магический урон» и т.п.) — без них
function abilityNoteHasPlaceholder(note) {
    const text = (note && note.note && (note.note.ru || note.note.en || note.note.uk || note.note.cs)) || '';
    return /\{[a-z_]+\}/i.test(text);
}

// заметка о приросте значения за уровень героя («увеличение за уровень: …»)
const isLevelupNote = (note) =>
    typeof note.parameter === 'string' && /(_hero_levelup|_per_level)$/.test(note.parameter);

// Порядок заметок способности: врождёнка/природа (одна) → смысловые изменения
// (тип урона, иммунитет к магии, «Больше не улучшается со способностью» и пр.) →
// прирост за уровень → обычные числовые параметры.
const isArenaModeNote = (note) => /Arena/i.test((note && note.note && (note.note.ru || note.note.en)) || '');
const isMechanicNote = (note) => note && note.parameter === 'Description' && !isArenaModeNote(note);

function orderAbilityNotes(notes) {
    const list = [...(notes || [])];
    const natureNotes = list.filter(isAbilityNatureNote);
    const afterNature = list.filter((note) => !isAbilityNatureNote(note));
    const arena = afterNature.filter(isArenaModeNote);
    const nonNature = afterNature.filter((note) => !isArenaModeNote(note));
    const levelup = nonNature.filter(isLevelupNote);
    const semantic = nonNature.filter((note) => !isLevelupNote(note) && !abilityNoteHasPlaceholder(note));
    const ordinary = nonNature.filter((note) => !isLevelupNote(note) && abilityNoteHasPlaceholder(note));
    const mechanic = semantic.filter(isMechanicNote);
    const others = semantic.filter((note) => !isMechanicNote(note));
    const head = natureNotes.length
        ? [natureNotes.find((note) => note.parameter === 'Innate') || natureNotes[0]]
        : [];
    return [...head, ...mechanic, ...others, ...levelup, ...ordinary, ...arena];
}

// Порядок полей способности: image/innate/описание выше, ability_notes — последним.
// Служебные флаги is_new/is_removed (нужны только для сортировки) в вывод не попадают.
function stripOwnerPrefix(name, ownerName) {
    if (!ownerName || typeof name !== 'string') return name;
    const low = name.toLowerCase();
    const pref = ownerName.toLowerCase() + ' ';
    return low.startsWith(pref) ? name.slice(ownerName.length + 1) : name;
}

function orderAbilityFields(ab, ownerName) {
    const { ability_id, name, image, innate, is_new, is_removed, description, ability_values, ability_notes, ...rest } = ab;
    return {
        ability_id,
        // имя способности без имени героя в начале (ogre magi fireblast → fireblast)
        name: stripOwnerPrefix(name ?? readableAbilityName(ability_id), ownerName),
        ...(image !== undefined && { image }),
        ...(innate !== undefined && { innate }),
        ...(description !== undefined && { description }),
        ...(ability_values !== undefined && { ability_values }),
        ...rest,
        ability_notes: orderAbilityNotes(ability_notes),
    };
}

// Готовый путь картинки из списка кандидатов. Если есть индекс — берём первый
// существующий (учитывая вариант с/без _custom); нет индекса — первый кандидат;
// ничего не найдено -> стандартная.
function resolveImage(assetKeys, candidates, fallbackKey) {
    const list = (Array.isArray(candidates) ? candidates : [candidates]).filter(Boolean);
    if (!list.length) return fallbackKey;
    if (!assetKeys) return list[0];
    for (const key of list) {
        if (assetKeys.has(key)) return key;
        const alt = /_custom\.webp$/.test(key)
            ? key.replace(/_custom\.webp$/, '.webp')
            : key.replace(/\.webp$/, '_custom.webp');
        if (assetKeys.has(alt)) return alt;
    }
    return fallbackKey;
}

// item_blade_mail_custom -> «blade mail»; item_enhancement_hulking -> «hulking»
function readableItemName(id) {
    return String(id)
        .replace(/^item_/, '')
        .replace(/_custom$/, '')
        .replace(/^enhancement_/, '')
        .split('_')
        .map((word) => (ITEM_POSSESSIVE_WORDS[word] ? ITEM_POSSESSIVE_WORDS[word].toLowerCase() : word))
        .join(' ');
}

// читаемое имя сущности из id: antimage -> «antimage», phantom_assassin -> «phantom assassin»
function readableEntityName(id) {
    return String(id).replace(/_/g, ' ');
}

// читаемое имя способности из id (фолбэк, когда нет локализации)
function readableAbilityName(id) {
    return String(id).replace(/_custom$/, '').replace(/_/g, ' ');
}

// Подпись под названием предмета: «Новый предмет в категории «Магия»»
function itemCaption(categoryKey) {
    const cat = SHOP_CATEGORY_NAMES[categoryKey];
    if (!cat) return { ...NEW_ITEM_HEAD };
    return Object.fromEntries(NATURE_LANGS.map((l) => [l, `${NEW_ITEM_IN_CATEGORY[l]} «${cat[l]}»`]));
}

function joinTierValue(value) {
    const parts = String(value).split(' / ');
    const signed = /^[+-]/.test(parts[0] || '');
    return parts
        .map((p, i) => (i === 0 && signed ? p : p.replace(/^[+-]/, '')))
        .join('/');
}

// Подпись новой нейтралки: «Новые чары N разряда» / «Новый артефакт N разряда»
function neutralCaption(kind, value) {
    if (value == null) return null;
    const readable = Array.isArray(value) ? value.join('/') : String(value);
    const ordinal = Array.isArray(value) ? value.join('/') : `${value}-го`;
    return {
        ru: kind === 'enhancement' ? `Новые чары ${ordinal} разряда` : `Новый артефакт ${ordinal} разряда`,
        en: kind === 'enhancement' ? `New rank ${readable} enhancement` : `New tier ${readable} artifact`,
        uk: kind === 'enhancement' ? `Нові чари ${readable}-го розряду` : `Новий артефакт ${readable}-го розряду`,
        cs: kind === 'enhancement' ? `Nové vylepšení ranku ${readable}` : `Nový artefakt ranku ${readable}`,
    };
}

const DECIMAL_COMMA_LANGS = new Set(['ru', 'uk', 'cs']);
function localizeDecimals(value, lang) {
    return DECIMAL_COMMA_LANGS.has(lang)
        ? String(value).replace(/(\d)\.(\d)/g, '$1,$2')
        : String(value);
}
function enhancementStatNotes(values) {
    return (values || []).map((v) => {
        const value = joinTierValue(v.value);
        const label = (l) => (v.label && (v.label[l] || v.label.en || v.label.ru)) || '';
        return {
            note: Object.fromEntries(NATURE_LANGS.map(
                (l) => [l, `${localizeDecimals(value, l)} ${label(l)}`.trim()]
            )),
            ...(v.negative && { negative: true }),
        };
    });
}

const BASIC_TALENT_TITLE = { ru: 'Таланты', en: 'Talents', uk: 'Таланти' };
const BASIC_TALENT_BRANCHES = [
    ['strength', { ru: 'Сила', en: 'Strength', uk: 'Сила' }],
    ['agility', { ru: 'Ловкость', en: 'Agility', uk: 'Спритність' }],
    ['intelligence', { ru: 'Интеллект', en: 'Intelligence', uk: 'Інтелект' }],
];
const BASIC_TALENT_FIELDS = [
    ['level', 'Уровень', 'Level', 'Рівень'],
    ['branch', 'Ветка', 'Branch', 'Гілка'],
    ['requires', 'Связка', 'Requires', 'Зв\u2019язка'],
    ['text_ru', 'Текст (ru)', 'Text (ru)', 'Текст (ru)'],
    ['text_en', 'Текст (en)', 'Text (en)', 'Текст (en)'],
    ['text_uk', 'Текст (uk)', 'Текст (uk)', 'Текст (uk)'],
];

function pushBasicTalentChanges(target, oldMap, newMap) {
    const before = (oldMap && typeof oldMap === 'object' && !oldMap._error) ? oldMap : null;
    const after = (newMap && typeof newMap === 'object' && !newMap._error) ? newMap : null;
    if (!before || !after) return;
    const notes = [];
    const push = (branch, note) => notes.push({ branch, note });
    for (const name of Object.keys(after).sort()) {
        const a = before[name];
        const b = after[name];
        if (!a) {
            push(b.branch, {
                parameter: `basic_talent.${name}`,
                old_raw_value: null,
                new_raw_value: b.text_ru || name,
                note: {
                    ru: `${name}: новый общий талант — {new_raw_value}`,
                    en: `${name}: new basic talent — {new_raw_value}`,
                    uk: `${name}: новий загальний талант — {new_raw_value}`,
                },
            });
            continue;
        }
        for (const [field, ru, en, uk] of BASIC_TALENT_FIELDS) {
            const oldValue = a[field] == null ? '' : String(a[field]);
            const newValue = b[field] == null ? '' : String(b[field]);
            if (oldValue === newValue) continue;
            push(b.branch, {
                parameter: `basic_talent.${name}.${field}`,
                old_raw_value: oldValue || null,
                new_raw_value: newValue || null,
                note: {
                    ru: `${name} · ${ru}: {change_label} с {old_raw_value} до {new_raw_value}`,
                    en: `${name} · ${en}: {change_label} from {old_raw_value} to {new_raw_value}`,
                    uk: `${name} · ${uk}: {change_label} з {old_raw_value} до {new_raw_value}`,
                },
            });
        }
    }
    for (const name of Object.keys(before)) {
        if (after[name]) continue;
        push(before[name].branch, {
            parameter: `basic_talent.${name}`,
            old_raw_value: before[name].text_ru || name,
            new_raw_value: null,
            note: {
                ru: `${name}: общий талант удалён`,
                en: `${name}: basic talent removed`,
                uk: `${name}: загальний талант вилучено`,
            },
        });
    }
    if (!notes.length) return;
    target.push({ title: { ...BASIC_TALENT_TITLE } });
    const known = new Set(BASIC_TALENT_BRANCHES.map(([key]) => key));
    const groups = [
        ...BASIC_TALENT_BRANCHES,
        ...[...new Set(notes.map((n) => n.branch))]
            .filter((key) => !known.has(key))
            .map((key) => [key, { ru: String(key), en: String(key), uk: String(key) }]),
    ];
    for (const [key, label] of groups) {
        const group = notes.filter((n) => n.branch === key);
        if (!group.length) continue;
        target.push({ subtitle: { ...label } });
        target.push(...group.map((n) => n.note));
    }
}

function buildChangelogData(diff, options = {}) {
    const assetKeys = options.assetKeys || null; // Set ключей бакета или null (тогда мягкий откат)
    const heroList = options.heroList || [];
    const matchHero = makeHeroMatcher(heroList);
    const oldAbilities = options.oldAbilities || {};
    const newAbilities = options.newAbilities || {};
    const oldLocalization = options.oldLocalization || {};
    const newLocalization = options.newLocalization || {};
    // контекст для авто-определения процентных значений (см. applyPercent)
    PERCENT_CTX = { oldLoc: oldLocalization, newLoc: newLocalization };
    const oldItems = options.oldItems || {};
    const newItems = options.newItems || {};
    const newBaseLocalization = options.newBaseLocalization || {};
    const localizationSources = [newLocalization, newBaseLocalization];
    const itemStatLocalizationSources = [newLocalization, newBaseLocalization];
    const abilityNoteContext = {
        resolveAbilityName: (id) => localizedAbilityName(id, [newLocalization, oldLocalization, newBaseLocalization]),
    };
    const oldRecipes = recipeIndex(oldItems, localizationSources);
    const newRecipes = recipeIndex(newItems, localizationSources);
    const siblingKV = (id) => {
        const alt = /_custom$/.test(String(id)) ? String(id).replace(/_custom$/, '') : `${id}_custom`;
        return newAbilities[alt] || oldAbilities[alt] || newItems[alt] || oldItems[alt] || null;
    };
    const describeNew = (id, kv) => buildItemDescription(id, kv, localizationSources, siblingKV(id));
    const describeNewSections = (id, kv) => buildItemDescriptionSections(id, kv, localizationSources);
    const describeNewValues = (id, kv) => buildItemCharacteristics(id, kv, itemStatLocalizationSources);
    // Новая способность: описание + параметры единой строкой (параметры больше не выносятся отдельно)
    const describeNewAbility = (id, kv) =>
        mergeAbilityDescription(describeNew(id, kv), buildAbilityValues(id, kv, localizationSources));
    const newShopCategory = shopCategoryMap(options.newShops);
    const oldShopCategory = shopCategoryMap(options.oldShops);
    const newNeutrals = options.newNeutrals || {};
    const oldNeutrals = options.oldNeutrals || {};
    const newHeroes = options.newHeroes || {};
    const primaryAttribute = (raw) => {
        const value = String(raw?.AttributePrimary || '').toUpperCase();
        if (value.includes('STRENGTH')) return 'strength';
        if (value.includes('AGILITY')) return 'agility';
        if (value.includes('INTELLECT')) return 'intelligence';
        if (value.includes('ALL')) return 'universal';
        return null;
    };
    const primaryAttrById = {};
    for (const [key, data] of Object.entries(newHeroes)) {
        const attr = primaryAttribute(data);
        if (attr) primaryAttrById[replaceHeroKey(stripHeroPrefix(key))] = attr;
    }
    const creepAbilityMap = {};
    for (const src of [options.oldCreepAbilityMap || {}, options.newCreepAbilityMap || {}]) {
        for (const [ability, creepList] of Object.entries(src)) {
            const list = Array.isArray(creepList) ? creepList : [creepList];
            creepAbilityMap[ability] = [...new Set([...(creepAbilityMap[ability] || []), ...list])];
        }
    }

    const oldHeroAbilityMap = options.oldHeroAbilityMap || {};
    const newHeroAbilityMap = options.newHeroAbilityMap || {};
    const heroAbilityMap = { ...oldHeroAbilityMap, ...newHeroAbilityMap };
    const heroesAbilitiesPresent = !!(options.oldPresent?.heroesAbilities || options.newPresent?.heroesAbilities);
    const heroAbilityMapCanon = {};
    for (const [id, hero] of Object.entries(heroAbilityMap)) {
        heroAbilityMapCanon[id.replace(/_custom$/, '')] = hero;
    }
    const innateAbilities = new Set([
        ...(options.oldInnateAbilities || []),
        ...(options.newInnateAbilities || []),
    ]);
    const present = options.newPresent || {};
    const skipped = {};
    const skip = (category, entry) => {
        if (!skipped[category]) skipped[category] = [];
        skipped[category].push(entry);
    };
    const heroes = new Map();
    
    const heroBlock = (heroId) => {
        const key = replaceHeroKey(heroId);
        if (!heroes.has(key)) {
            heroes.set(key, {
                hero_id: key,
                hero_notes: [],
                abilities: new Map(),
                talents: new Map(),
            });
        }
        return heroes.get(key);
    };
    const abilityDisplayName = (abilityId) => {
        const localized = localizedAbilityName(abilityId, [newLocalization, oldLocalization, newBaseLocalization]);
        return localized ? (localized.en || localized.ru) : undefined;
    };
    const abilityBlock = (hero, abilityId) => {
        if (!hero.abilities.has(abilityId)) {
            const name = abilityDisplayName(abilityId);
            hero.abilities.set(abilityId, { ability_id: replaceHeroKey(abilityId), ...(name && { name }), ability_notes: [] });
        }
        return hero.abilities.get(abilityId);
    };
    const bosses = new Map();
    const bossBlock = (bossId) => {
        if (!bosses.has(bossId)) {
            // префикс boss_ в исходных ScriptFile проставлен непоследовательно
            // (neutrals/boss_sand_king vs neutrals/shadow_fiend) — приводим имя
            // босса к единому виду c приставкой boss_ (добавляем, если её нет)
            const bossKey = replaceHeroKey(bossId);
            bosses.set(bossId, { boss_id: bossKey.startsWith('boss_') ? bossKey : `boss_${bossKey}`, abilities: new Map() });
        }
        return bosses.get(bossId);
    };
    const bossAbilityBlock = (bossId, abilityId) => {
        const boss = bossBlock(bossId);
        if (!boss.abilities.has(abilityId)) {
            const bossAbilityName = abilityDisplayName(abilityId);
            boss.abilities.set(abilityId, { ability_id: replaceHeroKey(abilityId), ...(bossAbilityName && { name: bossAbilityName }), ability_notes: [] });
        }
        return boss.abilities.get(abilityId);
    };
    const oldUnits = options.oldUnits || {};
    const newUnits = options.newUnits || {};
    const creepName = (creepId) => Object.fromEntries(
        RAW_TALENT_LANGS.map((lang) => {
            const tokens = (newLocalization[lang] || oldLocalization[lang] || {});
            return [lang, normText(tokens[creepId] || '') || null];
        })
    );
    const creeps = new Map();
    const creepBlock = (creepId) => {
        if (!creeps.has(creepId)) {
            creeps.set(creepId, {
                creep_id: creepId,
                name: creepName(creepId),
                base_notes: [],
                abilities: new Map(),
            });
        }
        return creeps.get(creepId);
    };
    const creepAbilityBlock = (creepId, abilityId) => {
        const creep = creepBlock(creepId);
        if (!creep.abilities.has(abilityId)) {
            creep.abilities.set(abilityId, {
                ability_id: abilityId,
                name: localizedAbilityName(abilityId, [newLocalization, oldLocalization, newBaseLocalization]),
                ability_notes: [],
            });
        }
        return creep.abilities.get(abilityId);
    };
    const talentBlock = (hero, talentId, position) => {
        if (!hero.talents.has(talentId)) {
            hero.talents.set(talentId, {
                talents_id: talentId,
                talent_level: position?.level || null,
                category_id: position?.branch || null,
                talents_notes: [],
            });
        } else if (position) {
            const talent = hero.talents.get(talentId);
            talent.talent_level = position.level;
            talent.category_id = position.branch;
        }
        return hero.talents.get(talentId);
    };

    const items = new Map();
    const changedNeutralItems = new Set();
    const addedNeutralRanks = new Map();
    const itemDiffEntries = flattenDiff(diff.sections.items || {});
    const structuralItemChanges = new Set(
        itemDiffEntries
            .filter((entry) => entry.path.length === 1 && (entry.type === 'added' || entry.type === 'removed'))
            .map((entry) => `${entry.type}:${entry.path[0]}`)
    );
    const ensureItem = (itemId) => {
        if (!items.has(itemId)) {
            items.set(itemId, { item_id: itemId, is_new: false, is_removed: false, item_notes: [] });
        }
        return items.get(itemId);
    };

    for (const entry of itemDiffEntries) {
        if (isDuplicateParserArtifact(entry)) continue;
        const itemId = entry.path[0];
        if (/^item_recipe_/.test(itemId)) continue;
        if (isIgnoredItemField(entry.path[1])) continue;
        const item = ensureItem(itemId);
        const isWholeItemAdd = entry.path.length === 1 && entry.type === 'added';
        if (isWholeItemAdd) item.is_new = true;
        if (entry.path.length === 1 && entry.type === 'removed') item.is_removed = true;
        if (!isWholeItemAdd) item.item_notes.push(noteFromDiff(entry, true, 'item'));
    }
    
    if (options.oldPresent?.shops && options.newPresent?.shops) {
        const shopItemIds = new Set([
            ...Object.keys(oldShopCategory),
            ...Object.keys(newShopCategory),
        ]);

        for (const itemId of shopItemIds) {
            const wasInShop = itemId in oldShopCategory;
            const isInShop = itemId in newShopCategory;
            if (wasInShop && isInShop) {
                continue;
            }
            if (!wasInShop && !isInShop) continue;

            const type = isInShop ? 'added' : 'removed';
            const item = ensureItem(itemId);
            if (type === 'added') item.is_new = true;
            else item.is_removed = true;
            
            if (type === 'added' || structuralItemChanges.has(`${type}:${itemId}`)) continue;

            item.item_notes.push(noteFromDiff({
                type,
                path: [itemId],
                old: type === 'removed' ? oldItems[itemId] : null,
                new: type === 'added' ? newItems[itemId] : null,
            }, true, 'item'));
        }
    }
    
    if (Object.keys(oldNeutrals).length && Object.keys(newNeutrals).length) {
        const neutralItemIds = new Set([
            ...Object.keys(oldNeutrals),
            ...Object.keys(newNeutrals),
        ]);

        for (const itemId of neutralItemIds) {
            const wasNeutral = itemId in oldNeutrals;
            const isNeutral = itemId in newNeutrals;
            if (wasNeutral && isNeutral) {
                const kind = neutralKind(itemId, newNeutrals[itemId] || oldNeutrals[itemId]);
                if (kind === 'enhancement') {
                    const oldRanks = normalizeEnhancementRanks(oldNeutrals[itemId]);
                    const newRanks = normalizeEnhancementRanks(newNeutrals[itemId]);
                    const oldRankNumbers = oldRanks.map((entry) => entry.tier);
                    const newRankNumbers = newRanks.map((entry) => entry.tier);
                    const addedRanks = newRanks.filter((entry) => !oldRankNumbers.includes(entry.tier));
                    const removedRanks = oldRanks.filter((entry) => !newRankNumbers.includes(entry.tier));

                    if (addedRanks.length || removedRanks.length) {
                        changedNeutralItems.add(itemId);
                        ensureItem(itemId);
                    }
                    if (addedRanks.length) {
                        addedNeutralRanks.set(itemId, addedRanks);
                    }
                    if (addedRanks.length === 1 && removedRanks.length === 1) {
                        ensureItem(itemId).item_notes.push(
                            itemPlacementNote('neutral_tier', removedRanks[0].tier, addedRanks[0].tier, itemId)
                        );
                    } else {
                        for (const rank of removedRanks) {
                            ensureItem(itemId).item_notes.push(itemTierMembershipNote('removed', rank.tier, itemId));
                        }
                    }
                    continue;
                }

                const oldTiers = normalizeTiers(oldNeutrals[itemId]);
                const newTiers = normalizeTiers(newNeutrals[itemId]);
                const addedTiers = newTiers.filter((tier) => !oldTiers.includes(tier));
                const removedTiers = oldTiers.filter((tier) => !newTiers.includes(tier));

                if (addedTiers.length || removedTiers.length) {
                    changedNeutralItems.add(itemId);
                }
                if (addedTiers.length === 1 && removedTiers.length === 1) {
                    ensureItem(itemId).item_notes.push(
                        itemPlacementNote('neutral_tier', removedTiers[0], addedTiers[0], itemId)
                    );
                } else {
                    for (const tier of addedTiers) {
                        ensureItem(itemId).item_notes.push(itemTierMembershipNote('added', tier, itemId));
                    }
                    for (const tier of removedTiers) {
                        ensureItem(itemId).item_notes.push(itemTierMembershipNote('removed', tier, itemId));
                    }
                }
                continue;
            }
            if (!wasNeutral && !isNeutral) continue;

            const type = isNeutral ? 'added' : 'removed';
            const item = ensureItem(itemId);
            if (type === 'added') item.is_new = true;
            else item.is_removed = true;

            if (type === 'added' || structuralItemChanges.has(`${type}:${itemId}`)) continue;

            item.item_notes.push(noteFromDiff({
                type,
                path: [itemId],
                old: type === 'removed' ? oldItems[itemId] : null,
                new: type === 'added' ? newItems[itemId] : null,
            }, true, 'item'));
        }
    }
    
    for (const resultId of new Set([...Object.keys(oldRecipes), ...Object.keys(newRecipes)])) {
        const oldRecipe = oldRecipes[resultId] || null;
        const newRecipe = newRecipes[resultId] || null;
        const item = items.get(resultId);
        if (item?.is_new && newRecipe) {
            item.recipe = recipeText(newRecipe);
            continue;
        }
        if (recipeSignature(oldRecipe) === recipeSignature(newRecipe)) continue;
        const target = ensureItem(resultId);
        splitNoteLines(recipeText(newRecipe, true, oldRecipe)).forEach((note, index) => {
            target.item_notes.push({
                parameter: 'recipe',
                old_raw_value: index === 0 ? oldRecipe : null,
                new_raw_value: index === 0 ? newRecipe : null,
                note,
            });
        });
    }

    for (const entry of flattenDiff(diff.sections.heroes || {})) {
        if (isDuplicateParserArtifact(entry)) continue;
        if (isIgnoredHeroField(entry.path[1])) continue;
        applyHeroBaseDefault(entry);
        const heroId = stripHeroPrefix(entry.path[0]);
        const heroNote = noteFromDiff(entry, true);
        if (heroNote) {
            const icon = STAT_ICONS[heroNote.parameter];
            // иконку кладём рядом с note (на уровень заметки), а не внутрь note —
            // иначе note перестаёт быть чистой лок-картой и ломается проекция на язык
            if (icon) heroNote.icon = icon;
            heroBlock(heroId).hero_notes.push(heroNote);
        }
    }

    if (options.oldPresent?.units && options.newPresent?.units) {
        for (const entry of flattenDiff(diff.sections.units || {})) {
            if (isDuplicateParserArtifact(entry)) continue;
            const creepId = entry.path[0];
            const field = entry.path[1];
            if (typeof field === 'string' && /^Ability\d+$/.test(field)) continue;
            creepBlock(creepId).base_notes.push(noteFromDiff(entry, true));
        }
    }

    const globalChanges = [];

    pushBasicTalentChanges(globalChanges, options.oldBasicTalents, options.newBasicTalents);

    const addedHeroIds = new Set();
    const isAddedHero = (heroId) => addedHeroIds.has(replaceHeroKey(heroId));
    const generalBlock = (generalId, entityId = null) => {
        const normalizedEntityId = replaceHeroKey(entityId);
        let block = globalChanges.find((entry) => entry.general_id === generalId && entry.entity_id === normalizedEntityId);
        if (!block) {
            block = { general_id: generalId, entity_id: normalizedEntityId, general_notes: [] };
            globalChanges.push(block);
        }
        return block;
    };

    const oldActivelist = options.oldActivelist || {};
    const newActivelist = options.newActivelist || {};
    const activeHeroIds = new Set(
        Object.entries(newActivelist)
            .filter(([, value]) => value === '1')
            .map(([key]) => replaceHeroKey(stripHeroPrefix(key)))
    );
    for (const key of new Set([...Object.keys(oldActivelist), ...Object.keys(newActivelist)])) {
        const oldValue = oldActivelist[key] === '1';
        const newValue = newActivelist[key] === '1';
        if (oldValue === newValue || !newValue) continue;
        addedHeroIds.add(replaceHeroKey(stripHeroPrefix(key)));
    }

    const abilityDiffEntries = flattenDiff(diff.sections.abilities || {});
    for (let i = abilityDiffEntries.length - 1; i >= 0; i--) {
        const e = abilityDiffEntries[i];
        if (e.path.length !== 1 || e.type !== 'changed') continue;
        const replacement = isDuplicateParserArtifact(e) ? [] : expandWholeAbilityChange(e);
        abilityDiffEntries.splice(i, 1, ...replacement);
    }

    for (let i = abilityDiffEntries.length - 1; i >= 0; i--) {
        const e = abilityDiffEntries[i];
        const oldValue = unwrapValue(e.old);
        const newValue = unwrapValue(e.new);
        if (sameRawValue(oldValue, newValue)) { abilityDiffEntries.splice(i, 1); continue; }
        if (oldValue !== e.old || newValue !== e.new) abilityDiffEntries[i] = { ...e, old: oldValue, new: newValue };
    }
    const abilityCanon = (abilityId) => abilityId.replace(/_custom$/, '');
    const structuralAbilityChanges = new Set(
        abilityDiffEntries
            .filter((entry) => entry.path.length === 1 && (entry.type === 'added' || entry.type === 'removed'))
            .map((entry) => `${entry.type}:${abilityCanon(entry.path[0])}`)
    );
    // способности с изменениями полей (существовали и изменились) — их нельзя
    // считать «новыми» при переносе в карту способностей героя
    const changedAbilityCanons = new Set(
        abilityDiffEntries
            .filter((entry) => entry.path.length >= 2)
            .map((entry) => abilityCanon(entry.path[0]))
    );
    const resolveAbility = (abilities, mappedId) => {
        const tryIds = (base) => [base, `${base}_custom`, abilityCanon(base)];
        const restoredId = restoreHeroKey(mappedId);
        const candidates = restoredId === mappedId
            ? tryIds(mappedId)
            : [...tryIds(mappedId), ...tryIds(restoredId)];
        for (const id of candidates) {
            if (id in abilities) return { id, value: abilities[id] };
        }
        return { id: mappedId, value: undefined };
    };
    
    const newlyAssignedCanons = new Set();
    const oldSlotCanons = new Map();
    for (const [key, data] of Object.entries(options.oldHeroes || {})) {
        const slots = new Set();
        for (const [field, value] of Object.entries(data || {})) {
            if (/^Ability\d+$/.test(field) && typeof value === 'string' && value) slots.add(abilityCanon(replaceHeroKey(value)));
        }
        oldSlotCanons.set(replaceHeroKey(stripHeroPrefix(key)), slots);
    }
    const newSlotOrder = new Map();
    for (const [key, data] of Object.entries(newHeroes)) {
        const order = new Map();
        Object.entries(data || {})
            .filter(([field]) => /^Ability\d+$/.test(field))
            .sort((left, right) => Number(left[0].slice(7)) - Number(right[0].slice(7)))
            .forEach(([, value], index) => {
                if (typeof value !== 'string' || !value) return;
                const canon = abilityCanon(replaceHeroKey(value));
                if (!order.has(canon)) order.set(canon, index);
            });
        newSlotOrder.set(replaceHeroKey(stripHeroPrefix(key)), order);
    }
    const hadInOldSlots = (heroKey, abilityId) => {
        const slots = oldSlotCanons.get(replaceHeroKey(stripHeroPrefix(String(heroKey))));
        return !!slots && slots.has(abilityCanon(replaceHeroKey(abilityId)));
    };
    if (options.oldPresent?.heroesAbilities && options.newPresent?.heroesAbilities) {
        const mappedAbilityIds = new Set([
            ...Object.keys(oldHeroAbilityMap),
            ...Object.keys(newHeroAbilityMap),
        ]);

        for (const mappedId of mappedAbilityIds) {
            const oldHero = oldHeroAbilityMap[mappedId];
            const newHero = newHeroAbilityMap[mappedId];
            if (oldHero === newHero) continue;

            if (oldHero && !structuralAbilityChanges.has(`removed:${abilityCanon(mappedId)}`)) {
                const oldAbility = resolveAbility(oldAbilities, mappedId);
                abilityDiffEntries.push({
                    type: 'removed',
                    path: [oldAbility.id],
                    old: oldAbility.value,
                    new: null,
                    mappedHero: oldHero,
                });
            }
            const newlyAssigned = !!newHero && !oldHero && !hadInOldSlots(newHero, mappedId);
            if (newlyAssigned) {
                newlyAssignedCanons.add(abilityCanon(mappedId));
                newlyAssignedCanons.add(abilityCanon(resolveAbility(newAbilities, mappedId).id));
            }
            if (newHero && !structuralAbilityChanges.has(`added:${abilityCanon(mappedId)}`)
                && (!changedAbilityCanons.has(abilityCanon(mappedId)) || newlyAssigned)) {
                const newAbility = resolveAbility(newAbilities, mappedId);
                abilityDiffEntries.push({
                    type: 'added',
                    path: [newAbility.id],
                    old: null,
                    new: newAbility.value,
                    mappedHero: newHero,
                });
            }
        }
    }
    
    if (newlyAssignedCanons.size) {
        const kept = abilityDiffEntries.filter((e) => !(e.path.length >= 2 && newlyAssignedCanons.has(abilityCanon(e.path[0]))));
        abilityDiffEntries.length = 0;
        abilityDiffEntries.push(...kept);
    }

    // поле могло переехать между верхним уровнем и AbilityValues (напр. AbilityCooldown):
    // это даёт пару removed(верхний)+added(в AbilityValues) с одним именем поля.
    // Схлопываем: значение то же — убираем обе заметки, изменилось — оставляем одну «изменено».
    {
        const scalar = (v) => (v && typeof v === 'object' && !Array.isArray(v) && 'value' in v) ? v.value : v;
        const sameNum = (a, b) => {
            const na = Number(a), nb = Number(b);
            return (Number.isFinite(na) && Number.isFinite(nb)) ? na === nb : sameRawValue(a, b);
        };
        const byKey = new Map();
        for (const e of abilityDiffEntries) {
            if (e.path.length < 2) continue;
            const key = `${e.path[0]}::${e.path[e.path.length - 1]}`;
            if (!byKey.has(key)) byKey.set(key, []);
            byKey.get(key).push(e);
        }
        const dropMoved = new Set();
        for (const group of byKey.values()) {
            const removed = group.find((e) => e.type === 'removed');
            const added = group.find((e) => e.type === 'added');
            if (!removed || !added || removed === added) continue;
            if (sameNum(scalar(removed.old), scalar(added.new))) {
                dropMoved.add(removed);
                dropMoved.add(added);
            } else {
                added.type = 'changed';
                added.old = scalar(removed.old);
                added.new = scalar(added.new);
                dropMoved.add(removed);
            }
        }
        if (dropMoved.size) {
            const kept = abilityDiffEntries.filter((e) => !dropMoved.has(e));
            abilityDiffEntries.length = 0;
            abilityDiffEntries.push(...kept);
        }
    }

    {
        const normCharges = (v) => (v == null || v === '' ? '1' : v);
        const byAbility = new Map();
        for (const e of abilityDiffEntries) {
            if (e.path.length < 2) continue;
            const field = e.path[e.path.length - 1];
            if (field !== 'AbilityCooldown' && field !== 'AbilityChargeRestoreTime'
                && field !== 'AbilityCharges' && field !== 'Innate' && field !== 'MaxLevel') continue;
            const id = e.path[0];
            if (!byAbility.has(id)) byAbility.set(id, {});
            byAbility.get(id)[field] = e;
        }
        const dropChargeConv = new Set();
        for (const fields of byAbility.values()) {
            const cd = fields.AbilityCooldown;
            const crt = fields.AbilityChargeRestoreTime;
            const ch = fields.AbilityCharges;

            if (cd && crt && cd.type === 'removed' && crt.type === 'added') {
                if (sameRawValue(cd.old, crt.new)) {
                    dropChargeConv.add(cd);
                    dropChargeConv.add(crt);
                } else {
                    crt.type = 'changed';
                    crt.old = cd.old;
                    dropChargeConv.add(cd);
                }
            }
            if (ch) {
                const oldN = normCharges(ch.old);
                const newN = normCharges(ch.new);
                if (sameRawValue(oldN, newN)) dropChargeConv.add(ch);
                else { ch.type = 'changed'; ch.old = oldN; ch.new = newN; }
            }
            const inn = fields.Innate;
            const becomesInnate = inn && String(inn.new ?? '') === '1' && String(inn.old ?? '') !== '1';
            if (becomesInnate && fields.MaxLevel) dropChargeConv.add(fields.MaxLevel);
        }
        if (dropChargeConv.size) {
            const kept = abilityDiffEntries.filter((e) => !dropChargeConv.has(e));
            abilityDiffEntries.length = 0;
            abilityDiffEntries.push(...kept);
        }
    }
    
    const removedAbilityIds = new Set(
        abilityDiffEntries
            .filter((e) => e.path.length === 1 && e.type === 'removed')
            .map((e) => abilityCanon(e.path[0]))
    );

    for (const entry of abilityDiffEntries) {
        if (isDuplicateParserArtifact(entry)) continue;
        const abilityId = entry.path[0];
        const abilityKV = newAbilities[abilityId] || oldAbilities[abilityId] || {};
        const texture = typeof abilityKV.AbilityTextureName === 'string' ? abilityKV.AbilityTextureName : null;


        const isWholeAdd = entry.path.length === 1 && entry.type === 'added';
        const isWholeRemoval = entry.path.length === 1 && entry.type === 'removed';
        if (!isWholeRemoval && removedAbilityIds.has(abilityCanon(abilityId))) continue;
        if (isIgnoredAbilityField(entry.path)) continue;
        if (!isWholeAdd && !isWholeRemoval &&
            formatParameterNote(cleanLabel(entry.path), entry.old, entry.new, entry.type, abilityNoteContext) === DROP_NOTE) {
            continue;
        }
        
        if (isNeutralCreepAbility(abilityKV)) {
            const creepIds = creepAbilityMap[abilityId] || [];
            const desc = isWholeAdd ? describeNewAbility(abilityId, newAbilities[abilityId]) : null;
            for (const creepId of creepIds) {
                const cblock = creepAbilityBlock(creepId, abilityId);
                cblock.image = resolveImage(assetKeys, abilityImageCandidates(abilityId, texture, replaceHeroKey(abilityId)), STD_IMAGE.ability);
                cblock.ability_notes.push(isWholeAdd
                    ? { ...readyNote('added', entry.old, entry.new, abilityNatureNote('new', newAbilities[abilityId], false, false, abilityNoteContext)) }
                    : noteFromDiff(entry, true, 'ability', abilityNoteContext));
                if (isWholeAdd) {
                    cblock.description = desc ? [desc] : desc;
                }
            }
            continue;
        }
        if (/^woda_/.test(abilityId)) continue;
        
        if (isBossAbility(abilityKV)) {
            const bblock = bossAbilityBlock(bossIdFromAbility(abilityId, abilityKV), abilityId);
            bblock.image = resolveImage(assetKeys, abilityImageCandidates(abilityId, texture, replaceHeroKey(abilityId)), STD_IMAGE.ability);
            bblock.ability_notes.push(isWholeAdd
                ? { ...readyNote('added', entry.old, entry.new, abilityNatureNote('new', newAbilities[abilityId], false, false, abilityNoteContext)) }
                : noteFromDiff(entry, true, 'ability', abilityNoteContext));
            if (isWholeAdd) {
                bblock.description = [describeNewAbility(abilityId, newAbilities[abilityId])];
            }
            continue;
        }
        
        const canonicalAbilityId = abilityCanon(abilityId);

        const replacedAbilityId = abilityCanon(replaceHeroKey(abilityId));
        const heroKey = entry.mappedHero
            || heroAbilityMap[abilityId] || heroAbilityMap[canonicalAbilityId]
            || heroAbilityMapCanon[canonicalAbilityId]
            || heroAbilityMap[replacedAbilityId] || heroAbilityMapCanon[replacedAbilityId];
        const heroId = heroKey
            ? stripHeroPrefix(heroKey)
            : (heroesAbilitiesPresent ? null : matchHero(abilityId));
        if (heroId) {
            if (isAddedHero(heroId)) continue;

            const isInnate =
                innateAbilities.has(abilityId) || innateAbilities.has(canonicalAbilityId) ||
                innateAbilities.has(replacedAbilityId);

            const block = abilityBlock(heroBlock(heroId), abilityId);
            block.image = resolveImage(assetKeys, abilityImageCandidates(abilityId, texture, replaceHeroKey(abilityId)), isInnate ? INNATE_ICON : STD_IMAGE.ability);
            if (isInnate) block.innate = true;
            if (isWholeAdd) block.is_new = true;
            if (isWholeRemoval) block.is_removed = true;
            if (isWholeAdd) {
                block.description = [describeNewAbility(abilityId, newAbilities[abilityId])];
            }
            const heroKv = newAbilities[abilityId] || oldAbilities[abilityId];
            const innateParam = cleanLabel(entry.path) === 'Innate'
                && String(entry.new ?? '') !== String(entry.old ?? '');
            if (isWholeAdd) {
                if (!block.ability_notes.some(isAbilityNatureNote)) {
                    block.ability_notes.push({
                        parameter: 'Innate',
                        ...readyNote('added', null, null,
                            abilityNatureNote('new', heroKv, isInnate, true, abilityNoteContext)),
                    });
                }
            } else if (innateParam) {
                const nowInnate = String(entry.new ?? '') === '1';
                // была ли способность скрытой раньше и перестала быть скрытой сейчас
                const behaviorText = (kv) => {
                    const b = kv?.AbilityBehavior;
                    return Array.isArray(b) ? b.join(' | ') : (typeof b === 'string' ? b : '');
                };
                const wasHidden = behaviorText(oldAbilities[abilityId]).includes('DOTA_ABILITY_BEHAVIOR_HIDDEN');
                const isHidden = behaviorText(newAbilities[abilityId]).includes('DOTA_ABILITY_BEHAVIOR_HIDDEN');
                const innateKind = nowInnate
                    ? (wasHidden && !isHidden ? 'became_innate_hidden' : 'became_innate')
                    : 'became_basic';
                block.ability_notes.push({
                    parameter: 'Innate',
                    ...readyNote('changed', entry.old, entry.new,
                        abilityNatureNote(innateKind, heroKv, isInnate, true, abilityNoteContext)),
                });
            } else {
                block.ability_notes.push(noteFromDiff(entry, true, 'ability', abilityNoteContext));
            }
        } else if (!heroesAbilitiesPresent) {
            generalBlock('ability', abilityId).general_notes.push(noteFromDiff(entry, true, 'ability', abilityNoteContext));
        }
    }

    {
        const kitByHero = new Map();
        for (const [mappedId, heroKey] of Object.entries(newHeroAbilityMap)) {
            const heroId = stripHeroPrefix(heroKey);
            if (!isAddedHero(heroId)) continue;
            if (!kitByHero.has(heroId)) kitByHero.set(heroId, []);
            kitByHero.get(heroId).push(mappedId);
        }
        for (const [heroId, mappedIds] of kitByHero) {
            for (const mappedId of mappedIds) {
                const { id: abilityId, value: abilityKV } = resolveAbility(newAbilities, mappedId);
                if (!abilityKV) continue;
                const texture = typeof abilityKV.AbilityTextureName === 'string' ? abilityKV.AbilityTextureName : null;
                const isInnate =
                    innateAbilities.has(abilityId) || innateAbilities.has(abilityCanon(abilityId)) ||
                    innateAbilities.has(mappedId);
                const block = abilityBlock(heroBlock(heroId), abilityId);
                block.image = resolveImage(
                    assetKeys,
                    abilityImageCandidates(abilityId, texture, replaceHeroKey(abilityId)),
                    isInnate ? INNATE_ICON : STD_IMAGE.ability
                );
                if (isInnate) block.innate = true;
                block.ability_notes = [];
                block.description = [describeNewAbility(abilityId, abilityKV)];
            }
        }
    }

    {
        const RAW_LANGS = ['ru', 'en', 'uk'];
        const descKeys = (id) => [
            `dota_tooltip_ability_${id}_description`,
            `dota_tooltip_ability_${String(id).replace(/_custom$/, '')}_description`,
        ].map((key) => key.toLowerCase());
        const template = (id, sources, lang) => {
            for (const source of sources) {
                const tokens = (source && source[lang]) || {};
                const key = Object.keys(tokens).find((token) => descKeys(id).includes(token.toLowerCase()));
                if (key && String(tokens[key]).trim()) return String(tokens[key]);
            }
            return null;
        };
        const describeWith = (id, kv, sources) =>
            buildItemDescription(id, kv, sources, siblingKV(id));

        const bareTemplate = (text) =>
            normText(String(text).replace(/<[^>]+>/g, ' ').replace(/\\n/g, ' '));
        const changedIn = (id, lang) => {
            const before = template(id, [oldLocalization], lang);
            const after = template(id, [newLocalization, newBaseLocalization], lang);
            if (!before || !after) return null;
            return bareTemplate(before) !== bareTemplate(after);
        };
        const descriptionNote = (id, oldKV, newKV) => {
            const changed = changedIn(id, 'ru') ?? changedIn(id, 'en') ?? false;
            if (!changed) return null;
            const before = describeWith(id, oldKV, [oldLocalization]);
            const after = describeWith(id, newKV, [newLocalization, newBaseLocalization]);
            if (!before || !after) return null;
            const pick = (src) => Object.fromEntries(RAW_LANGS.map((lang) => [lang, src[lang] || null]));
            const oldText = pick(before);
            const newText = pick(after);
            if (JSON.stringify(oldText) === JSON.stringify(newText)) return null;
            return { parameter: 'Description', ...rawNote('changed', oldText, newText) };
        };

        for (const itemId of Object.keys(newItems)) {
            if (!(itemId in oldItems)) continue;
            const note = descriptionNote(itemId, oldItems[itemId], newItems[itemId]);
            if (note) ensureItem(itemId).item_notes.push(note);
        }

        for (const abilityId of Object.keys(newAbilities)) {
            if (!(abilityId in oldAbilities) || /^woda_/.test(abilityId)) continue;
            const note = descriptionNote(abilityId, oldAbilities[abilityId], newAbilities[abilityId]);
            if (!note) continue;
            const kv = newAbilities[abilityId];
            const texture = typeof kv.AbilityTextureName === 'string' ? kv.AbilityTextureName : null;
            const image = () => resolveImage(
                assetKeys, abilityImageCandidates(abilityId, texture, replaceHeroKey(abilityId)), STD_IMAGE.ability);
            if (isNeutralCreepAbility(kv)) {
                for (const creepId of creepAbilityMap[abilityId] || []) {
                    const block = creepAbilityBlock(creepId, abilityId);
                    block.image = image();
                    block.ability_notes.push(note);
                }
                continue;
            }
            if (isBossAbility(kv)) {
                const block = bossAbilityBlock(bossIdFromAbility(abilityId, kv), abilityId);
                block.image = image();
                block.ability_notes.push(note);
                continue;
            }
            const canon = abilityCanon(abilityId);
            const heroKey = heroAbilityMap[abilityId] || heroAbilityMap[canon] || heroAbilityMapCanon[canon];
            if (!heroKey) continue;
            const heroId = stripHeroPrefix(heroKey);
            if (isAddedHero(heroId)) continue;
            const block = abilityBlock(heroBlock(heroId), abilityId);
            block.image = image();
            block.ability_notes.push(note);
        }
    }

    const oldTalents = options.oldTalents || {};
    const newTalents = options.newTalents || {};
    const talentPositions = new Map();
    const structuralTalents = new Set();
    for (const heroKey of new Set([...Object.keys(oldTalents), ...Object.keys(newTalents)])) {
        const heroId = stripHeroPrefix(heroKey);
        if (isAddedHero(heroId)) continue;
        const oldPositions = heroTalentPositions(oldTalents[heroKey], heroId);
        const newPositions = heroTalentPositions(newTalents[heroKey], heroId);
        talentPositions.set(heroId, { old: oldPositions, new: newPositions });
        const moves = talentMoves(oldTalents[heroKey], newTalents[heroKey], heroId);
        const quotedByMoves = new Set(moves
            .filter((move) => move.type === 'moved')
            .map((move) => talentDestinationOccupant(move, oldPositions))
            .filter(Boolean));
        for (const move of moves) {
            structuralTalents.add(`${heroId}|${move.id}`);
            if (move.type === 'removed' && quotedByMoves.has(move.id)) continue;
            talentBlock(heroBlock(heroId), move.id, move.new || move.old).talents_notes.push(
                structuralTalentNote(move, {
                    oldPositions,
                    oldLocalization,
                    newLocalization,
                })
            );
        }
        const oldMeta = heroTalentMeta(oldTalents[heroKey], heroId);
        const newMeta = heroTalentMeta(newTalents[heroKey], heroId);
        const oldSlots = {};
        for (const [id, p] of Object.entries(oldPositions)) {
            (oldSlots[`${p.branch}|${p.level}`] = oldSlots[`${p.branch}|${p.level}`] || []).push(id);
        }
        for (const [talentId, position] of Object.entries(newPositions)) {
            const olds = oldSlots[`${position.branch}|${position.level}`] || [];
            const oldId = olds.length === 1 ? olds[0] : (olds.includes(talentId) ? talentId : null);
            const sourceId = oldMeta[talentId] ? talentId : oldId;
            const before = sourceId ? requiredPlace(oldMeta, oldPositions, sourceId) : null;
            const after = requiredPlace(newMeta, newPositions, talentId);
            const known = (place) => place && !String(place).startsWith('?');
            if (before === after || (known(before) && known(after) && placeLevelOf(before) === placeLevelOf(after))) continue;
            const type = !before ? 'added' : !after ? 'removed' : 'changed';
            const text = type === 'removed' || !known(after) ? LINK_TEXT.del() : LINK_TEXT.add(placeLevelOf(after));
            talentBlock(heroBlock(heroId), talentId, position).talents_notes.push({
                parameter: 'talent_requires',
                ...readyNote(type, placeLabel(before, position.branch), placeLabel(after, position.branch), text),
                ...(type === 'changed' && known(before) && { tooltip: LINK_TEXT.was(placeLevelOf(before)) }),
            });
        }
    }

    const oldLocked = (options.oldLockedTalents && !options.oldLockedTalents._error) ? options.oldLockedTalents : {};
    const newLocked = (options.newLockedTalents && !options.newLockedTalents._error) ? options.newLockedTalents : {};
    const lockList = (map, hero, talent) => {
        const raw = map[hero] && map[hero][talent];
        const list = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? Object.values(raw) : []);
        return [...new Set(list.map(String))].sort();
    };
    for (const heroKey of new Set([...Object.keys(oldLocked), ...Object.keys(newLocked)])) {
        const heroId = stripHeroPrefix(heroKey);
        if (isAddedHero(heroId)) continue;
        const positions = talentPositions.get(heroId);
        if (!positions) continue;
        const placeKey = (p) => `${p.branch}|${p.level}`;
        const talentIds = new Set([
            ...Object.keys(newLocked[heroKey] || {}),
            ...Object.keys(oldLocked[heroKey] || {}),
        ]);
        for (const talentId of talentIds) {
            const me = positions.new[talentId];
            if (!me) continue;
            const now = lockList(newLocked, heroKey, talentId).filter((p) => positions.new[p]);
            const sourceId = positions.old[talentId]
                ? talentId
                : Object.entries(positions.old).find(([, p]) => p.branch === me.branch && p.level === me.level)?.[0];
            const wasIds = sourceId ? lockList(oldLocked, heroKey, sourceId).filter((p) => positions.old[p]) : [];
            const add = now.filter((p) => !wasIds.some((w) => placeKey(positions.old[w]) === placeKey(positions.new[p])));
            const delIds = wasIds.filter((w) => !now.some((p) => placeKey(positions.new[p]) === placeKey(positions.old[w])));
            if (!add.length && !delIds.length) continue;
            const delOld = delIds.map((p) => positions.old[p]);
            const delNow = delIds.map((p) => positions.new[p] || positions.old[p]);
            const isMutual = (p) => lockList(newLocked, heroKey, p).includes(talentId);
            const addMutual = add.filter(isMutual).map((p) => positions.new[p]);
            const addOneWay = add.filter((p) => !isMutual(p)).map((p) => positions.new[p]);
            const tooltip = add.length && delIds.length ? LOCK_TEXT.was(delOld) : null;
            const raw = (places) => (places.length
                ? places.map((p) => placeLabel(`${p.branch}|${p.level}`, 0)).join(', ')
                : null);
            const push = (type, places, text, withTooltip) => {
                talentBlock(heroBlock(heroId), talentId, me).talents_notes.push({
                    parameter: 'LockedTalents',
                    ...readyNote(type, raw(delOld), raw(places), text),
                    ...(withTooltip && tooltip && { tooltip }),
                });
            };
            const addType = tooltip ? 'changed' : 'added';
            if (addMutual.length) push(addType, addMutual, LOCK_TEXT.addMutual(addMutual), true);
            if (addOneWay.length) push(addType, addOneWay, LOCK_TEXT.addOneway(addOneWay), !addMutual.length);
            if (delIds.length && !add.length) push('removed', [], LOCK_TEXT.del(delNow), false);
        }
    }

    const localizedByKey = new Map();
    for (const lang of RAW_TALENT_LANGS) {
        for (const entry of localizationEntries(diff.sections.localization || {}, lang)) {
            if (!localizedByKey.has(entry.key)) {
                localizedByKey.set(entry.key, {
                    old: { ru: null, en: null, uk: null },
                    new: { ru: null, en: null, uk: null },
                });
            }
            localizedByKey.get(entry.key).old[lang] = entry.old;
            localizedByKey.get(entry.key).new[lang] = entry.new;
        }
    }

    for (const [key, values] of localizedByKey) {
        const heroId = matchHero(modifierHeroName(key));
        if (!heroId || isAddedHero(heroId)) continue;
        if (structuralTalents.has(`${heroId}|${key}`)) continue;
        const note = talentTextReplaced(values.old, values.new)
            ? readyNote('changed', values.old, values.new, talentReplacementNote(values.old, values.new))
            : talentRawNote('changed', values.old, values.new);
        const positions = talentPositions.get(heroId);
        const position = positions?.new[key] || positions?.old[key];
        talentBlock(heroBlock(heroId), key, position).talents_notes.push(note);
    }

    for (const heroKey of Object.keys(newTalents)) {
        const heroId = stripHeroPrefix(heroKey);
        if (!isAddedHero(heroId)) continue;
        const positions = heroTalentPositions(newTalents[heroKey], heroId);
        const metaOfNew = heroTalentMeta(newTalents[heroKey], heroId);
        for (const [talentId, position] of Object.entries(positions)) {
            const note = talentDescriptionNote(newLocalization, talentId);
            if (!note) continue;
            const block = talentBlock(heroBlock(heroId), talentId, position);
            block.talents_notes.push(readyNote('added', null, null, note));
            const requiredAt = requiredPlace(metaOfNew, positions, talentId);
            if (requiredAt && !requiredAt.startsWith('?')) {
                block.talents_notes.push({
                    parameter: 'talent_requires',
                    ...readyNote('added', null, placeLabel(requiredAt, position.branch), LINK_TEXT.new(placeLevelOf(requiredAt))),
                });
            }
            const partners = lockList(newLocked, heroKey, talentId);
            const mutual = partners.filter((p) => lockList(newLocked, heroKey, p).includes(talentId));
            const oneWay = partners.filter((p) => !mutual.includes(p));
            const placesOf = (ids) => ids.map((p) => positions[p]).filter(Boolean);
            const lockRaw = (ids) => placesOf(ids).map((p) => placeLabel(`${p.branch}|${p.level}`, 0)).join(', ') || null;
            if (placesOf(mutual).length) {
                block.talents_notes.push({
                    parameter: 'LockedTalents',
                    ...readyNote('added', null, lockRaw(mutual), LOCK_TEXT.mutual(placesOf(mutual))),
                });
            }
            if (placesOf(oneWay).length) {
                block.talents_notes.push({
                    parameter: 'LockedTalents',
                    ...readyNote('added', null, lockRaw(oneWay), LOCK_TEXT.oneway(placesOf(oneWay))),
                });
            }
        }
    }

    const groupTalents = (talents, heroId) => {
        const result = { strength: [], agility: [], intelligence: [] };
        const sorted = [...talents.values()].sort((a, b) => (a.talent_level || 0) - (b.talent_level || 0));

        const levelPrefix = { ru: 'Талант', en: 'Talent', uk: 'Талант', cs: 'Talent' };
        for (const talent of sorted) {
            const categoryKey = ATTRIBUTE_CATEGORY_KEYS[talent.category_id];
            if (!categoryKey) continue;
            const title = talent.talent_level
                ? Object.fromEntries(LANGS.map((lang) => [lang, `${levelPrefix[lang]} ${talent.talent_level}`]))
                : null;
            const talentId = replaceHeroKey(talent.talents_id);
            const num = talentNumberFromId(heroId, talentId);
            result[categoryKey].push({
                talent_id: talentId,
                image: resolveImage(assetKeys, num ? talentImagePath(heroId, num) : null, STD_IMAGE.ability),
                title,
                talent_notes: talent.talents_notes,
            });
        }
        return result;
    };

    const heroResult = [...heroes.values()]
        .map((hero) => {
            const heroName = readableEntityName(replaceHeroKey(hero.hero_id));
            return {
                hero_id: replaceHeroKey(hero.hero_id),
                name: heroName,
                image: resolveImage(assetKeys, heroImagePath(replaceHeroKey(hero.hero_id)), STD_IMAGE.hero),
                ...(addedHeroIds.has(hero.hero_id) ? { is_new: true } : {}),
                ...(primaryAttrById[hero.hero_id] ? { primary_attribute: primaryAttrById[hero.hero_id] } : {}),
                hero_notes: addedHeroIds.has(hero.hero_id) ? [] : polishHeroBaseNotes(hero.hero_notes, replaceHeroKey(hero.hero_id)),
                abilities: orderAbilities(
                    dedupeAbilities([...hero.abilities.values()]),
                    newSlotOrder.get(replaceHeroKey(stripHeroPrefix(String(hero.hero_id)))),
                ).map((ab) => orderAbilityFields(ab, heroName)),
                talents: groupTalents(hero.talents, replaceHeroKey(hero.hero_id)),
            };
        })
        .filter((hero) =>
            hero.is_new ||
            hero.hero_notes.length ||
            hero.abilities.length ||
            Object.values(hero.talents).some((category) => category.length)
        )
        .filter((hero) => activeHeroIds.size === 0 || activeHeroIds.has(hero.hero_id))
        .sort((a, b) => Number(!!b.is_new) - Number(!!a.is_new) || a.hero_id.localeCompare(b.hero_id));

    const bossResult = [...bosses.values()]
        .map((boss) => {
            const bossName = readableEntityName(boss.boss_id);
            return {
                boss_id: boss.boss_id,
                name: bossName,
                image: resolveImage(assetKeys, heroImagePath(boss.boss_id.replace(/^boss_/, '').replace(/_boss.*$/, '')), STD_IMAGE.hero),
                abilities: dedupeAbilities([...boss.abilities.values()]).map((ab) => orderAbilityFields(ab, bossName)),
            };
        })
        .filter((boss) => boss.abilities.length)
        .sort((a, b) => a.boss_id.localeCompare(b.boss_id));
    
    const newCreepAdded = (creepId) => !(creepId in oldUnits) && creepId in newUnits;
    const hasCreepName = (name) => !!(name && (name.ru || name.en || name.uk));
    const creepResult = [...creeps.values()]
        .map((creep) => ({
            neutral_creep_id: creep.creep_id,
            name: creep.name,
            image: resolveImage(assetKeys, null, STD_IMAGE.creep),
            ...(newCreepAdded(creep.creep_id) && { is_new: true }),
            neutral_creep_notes: creep.base_notes,
            abilities: dedupeAbilities([...creep.abilities.values()]).map((ab) => orderAbilityFields(ab)),
        }))
        .filter((creep) => hasCreepName(creep.name) && (creep.neutral_creep_notes.length || creep.abilities.length))
        .sort((a, b) => Number(!!b.is_new) - Number(!!a.is_new) || a.neutral_creep_id.localeCompare(b.neutral_creep_id));
    
    const isRecipe = (itemId) => /^item_recipe_/.test(itemId);
    const inShops = (itemId) => itemId in newShopCategory || itemId in oldShopCategory;
    const inNeutrals = (itemId) => itemId in newNeutrals || itemId in oldNeutrals;
    const classifyItem = (itemId) => {
        if (isRecipe(itemId)) return 'regular';
        if (inNeutrals(itemId)) return 'neutral';
        if (inShops(itemId)) return 'regular';
        return 'skip';
    };
    
    const itemTexture = (itemId) => {
        const kv = newItems[itemId] || oldItems[itemId];
        return kv && typeof kv.AbilityTextureName === 'string' ? kv.AbilityTextureName : null;
    };
    
    for (const removed of [...items.values()]) {
        if (!removed.is_removed) continue;
        const oldId = removed.item_id;
        const newId = oldId.endsWith('_custom') ? stripCustom(oldId) : `${oldId}_custom`;
        const added = items.get(newId);
        if (newId === oldId || !added || !added.is_new) continue;
        if (!oldItems[oldId] || !newItems[newId]) continue;
        const isReal = (id, shops, neutrals) => id in shops || id in neutrals;
        if (!isReal(oldId, oldShopCategory, oldNeutrals)) continue;
        if (!isReal(newId, newShopCategory, newNeutrals)) continue;

        const notes = [];
        for (const e of flattenDiff({ changed: { [newId]: deepDiff(oldItems[oldId], newItems[newId]) || {} } })) {
            if (/^item_recipe_/.test(e.path[0]) || isIgnoredItemField(e.path[1])) continue;
            const note = noteFromDiff(e, true, 'item');
            if (note) notes.push(note);
        }
        items.delete(oldId);
        if (!notes.length) { items.delete(newId); continue; }
        added.is_new = false;
        added.is_removed = false;
        added.item_notes = notes;
        delete added.recipe;
    }

    const removedItemLabel = WHOLE_ENTITY_LABELS.item.removed;
    for (const item of items.values()) {
        if (!item.is_removed || item.is_new) continue;
        const removalOnly = (item.item_notes || []).filter(
            (n) => n && n.note && n.note.en === removedItemLabel.en
        );
        if (removalOnly.length) item.item_notes = removalOnly;
        delete item.recipe;
    }

    const neutralResult = [];
    const regularResult = [];
    for (const item of items.values()) {
        const kind = classifyItem(item.item_id);
        const texture = itemTexture(item.item_id);
        if (kind === 'skip') {
            skip('items', {
                item_id: item.item_id,
                is_new: item.is_new,
                is_removed: item.is_removed,
                reason: present.neutrals ? 'not-in-shops-or-neutrals' : 'no-neutral-file',
                item_notes: item.item_notes,
            });
        } else if (kind === 'regular') {
            const isUpgrade = (item.item_id in newRecipes) || (item.item_id in oldRecipes);
            const introNotes = [];
            // показали ли стоимость во вводных заметках (сборка/цена) — тогда
            // отдельная заметка «Item Cost» ниже не нужна
            let costShownInIntro = false;
            if (item.is_new) {
                const kv = newItems[item.item_id];
                // 1) собирается (улучшение) или цена (основной) — всегда первым
                if (isUpgrade && item.recipe) {
                    introNotes.push({ note: stripTrailingDot(item.recipe) });
                    costShownInIntro = true;
                } else if (!isUpgrade) {
                    const cost = Number((kv || oldItems[item.item_id] || {}).ItemCost) || 0;
                    if (cost > 0) {
                        introNotes.push({ note: itemCostNote(cost) });
                        costShownInIntro = true;
                    }
                }
                // 2) даёт бонусы
                const gives = itemGivesNote(describeNewValues(item.item_id, kv));
                if (gives) introNotes.push({ note: gives });
                // 3-4) активное/пассивное (и прочие секции описания)
                const sections = describeNewSections(item.item_id, kv);
                if (sections && sections.length) {
                    for (const sec of sections) {
                        const secNote = stripTrailingDot(itemSectionNote(sec));
                        if (NATURE_LANGS.some((l) => secNote[l])) introNotes.push({ note: secNote });
                    }
                } else {
                    const desc = stripTrailingDot(describeNew(item.item_id, kv) || {});
                    if (NATURE_LANGS.some((l) => desc[l])) introNotes.push({ note: desc });
                }
                // 5) Note-строки предмета из source — последними, каждая отдельной нотой
                for (const srcNote of itemSourceNotes(item.item_id, kv, localizationSources)) {
                    introNotes.push({ note: srcNote });
                }
            }
            regularResult.push({
                item_id: item.item_id,
                name: localizedItemName(item.item_id, item.is_removed && !item.is_new ? [oldLocalization, ...localizationSources] : localizationSources),
                image: resolveImage(assetKeys, itemImageCandidates(item.item_id, texture), STD_IMAGE.item),
                is_new: item.is_new,
                // улучшение = собирается из других предметов (есть свой рецепт), иначе основной
                is_upgrade: isUpgrade,
                // готовая подпись «Новый предмет в категории «…»»
                ...(item.is_new && { caption: itemCaption(newShopCategory[item.item_id]) }),
                // 5) остальные заметки предмета из source — последними.
                // У нового предмета показываем только вводное описание (что даёт,
                // пассивка, цена/сборка), а диффы полей относительно старого
                // непокупаемого определения — не выводим (игрок их не видел).
                item_notes: item.is_new
                    ? introNotes
                    : orderItemNotes(item.item_notes, costShownInIntro),
            });
        } else {
            const neutralMeta = newNeutrals[item.item_id] || oldNeutrals[item.item_id] || null;
            const kind = neutralKind(item.item_id, neutralMeta);
            // если предмет уже существовал в прошлом патче как обычный (тот же id
            // или базовый без _custom), не считаем нейтралку новой
            const existedBefore = (item.item_id in oldItems) || (stripCustom(item.item_id) in oldItems);
            const enteredPool = !(item.item_id in oldNeutrals) && (item.item_id in newNeutrals);
            const isNew = enteredPool || (item.is_new && !existedBefore);
            const ranks = normalizeEnhancementRanks(newNeutrals[item.item_id]);
            const newRanks = addedNeutralRanks.get(item.item_id) || [];
            const rankNumbers = (isNew ? ranks : newRanks).map((entry) => entry.tier);
            const rankValue = rankNumbers.length > 1 ? rankNumbers : rankNumbers[0] ?? null;
            const enhancementLevels = (isNew ? ranks : newRanks).map((entry) => entry.level);
            const enhancementLevel = enhancementLevels.length > 1 ? enhancementLevels : enhancementLevels[0] ?? null;
            const currentTiers = normalizeTiers(newNeutrals[item.item_id]);
            const tierValue = currentTiers.length > 1 ? currentTiers : currentTiers[0] ?? null;
            const selectedLevel = newRanks[0]?.level ?? (isNew ? ranks[0]?.level : null);
            const newRankValue = kind === 'enhancement' && newRanks.length > 0
                ? (newRanks.length > 1 ? newRanks.map((entry) => entry.tier) : newRanks[0].tier)
                : null;
            // предмет был обычным в прошлом патче и как нейтралку показать нечего
            // (нет заметок и изменений разряда) — пропускаем, чтобы не выводить его
            // как «Новый артефакт» и не плодить пустые карточки
            if (existedBefore && !(item.item_notes || []).length && newRankValue == null && selectedLevel == null) {
                continue;
            }
            const neutral = {
                neutral_item_id: item.item_id,
                name: localizedItemName(item.item_id, item.is_removed && !item.is_new ? [oldLocalization, ...localizationSources] : localizationSources),
                image: resolveImage(assetKeys, itemImageCandidates(item.item_id, texture), STD_IMAGE.item),
                neutral_type: kind,
                is_new: isNew,
                tier: kind === 'artifact' ? tierValue : null,
                ...(kind === 'enhancement' && rankValue != null && { rank: rankValue }),
                ...(kind === 'enhancement' && enhancementLevel != null && { enhancement_level: enhancementLevel }),
                ...(newRankValue != null && { new_rank: newRankValue }),
                neutral_item_notes: orderItemNotes((item.item_notes || [])
                    .filter((note) => note.parameter !== 'ItemCost' && note.parameter !== 'MaxLevel')),
            };
            // готовая подпись «Новые чары N разряда» / «Новый артефакт N разряда»
            if (isNew) {
                const captionValue = kind === 'enhancement' ? (newRankValue ?? rankValue) : tierValue;
                const caption = neutralCaption(kind, captionValue);
                if (caption) neutral.caption = caption;
            }
            if (isNew) {
                neutral.description = describeNew(item.item_id, newItems[item.item_id]);
                neutral.description_sections = describeNewSections(item.item_id, newItems[item.item_id]);
                if (kind === 'enhancement') {
                    // чары: параметры готовыми нотами (+4%/5% к здоровью, красный флаг)
                    const values = buildItemCharacteristics(item.item_id, newItems[item.item_id], itemStatLocalizationSources, {
                        includeReadableTokens: true,
                        signPositive: true,
                    });
                    neutral.stat_notes = enhancementStatNotes(values);
                } else {
                    neutral.item_values = describeNewValues(item.item_id, newItems[item.item_id]);
                }
            }
            if (item.recipe) neutral.recipe = item.recipe;
            neutralResult.push(neutral);
        }
    }
    neutralResult.sort((a, b) => Number(!!b.is_new) - Number(!!a.is_new) || a.neutral_item_id.localeCompare(b.neutral_item_id));
    regularResult.sort((a, b) => Number(!!b.is_new) - Number(!!a.is_new) || a.item_id.localeCompare(b.item_id));

    const timestamp = Date.parse(diff.generatedAt);
    const patchNumber = formatPatchNumber(diff.to);
    return {
        patch_number: patchNumber,
        patch_name: patchNumber,
        patch_timestamp: Number.isNaN(timestamp) ? Math.floor(Date.now() / 1000) : Math.floor(timestamp / 1000),
        general: {
            global_changes: globalChanges,
        },
        neutral_creeps: creepResult,
        // разбиение по категориям вложенно (без дублей плоского списка)
        items: {
            base: regularResult.filter((i) => !i.is_upgrade),
            upgrade: regularResult.filter((i) => i.is_upgrade),
        },
        neutral_items: {
            artifacts: neutralResult.filter((n) => n.neutral_type !== 'enhancement'),
            enhancements: neutralResult.filter((n) => n.neutral_type === 'enhancement'),
        },
        bosses: bossResult,
        heroes: heroResult,
        ...(Object.keys(skipped).length && { skipped }),
    };
}

function renderMarkdown(data) {
    const lines = [`# Patch ${data.patch_number}`, ''];
    lines.push(`Timestamp: ${data.patch_timestamp}`, '');
    lines.push(`- Global changes: ${data.general.global_changes.length}`);
    const neutralCount = (data.neutral_items?.artifacts?.length || 0) + (data.neutral_items?.enhancements?.length || 0);
    const itemCount = (data.items?.base?.length || 0) + (data.items?.upgrade?.length || 0);
    lines.push(`- Neutral items: ${neutralCount}`);
    lines.push(`- Items: ${itemCount}`);
    lines.push(`- Heroes: ${data.heroes.length}`, '');
    lines.push('Labels are filled manually in draft.json where necessary.');
    return lines.join('\n');
}

function renderChangelog(diff, options) {
    return renderMarkdown(buildChangelogData(diff, options));
}

module.exports = {
    LANGS,
    buildChangelogData,
    renderMarkdown,
    renderChangelog,
    buildItemDescription,
    buildItemDescriptionSections,
    buildAbilityValues,
    orderAbilityNotes,
    buildItemCharacteristics,
    flattenDiff,
    isCosmetic,
    normText,
    normTalentText,
    talentDescriptionNote,
    talentTooltipText,
};
