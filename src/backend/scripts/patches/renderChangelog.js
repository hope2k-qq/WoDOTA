const { replacementsHeroes } = require('../../config/replacements_heroes2');
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

function localizedTalentText(localization, lang, talentId) {
    if (!talentId) return '';
    const sourceLang = lang === 'cs' ? 'en' : lang;
    const tokens = localization[sourceLang] || {};
    return normText(tokens[`${talentId}_0`] ?? tokens[talentId] ?? talentId);
}

function structuralTalentNote(move, context) {
    const destination = move.new || move.old;
    const oldDestinationId = Object.entries(context.oldPositions).find(([, position]) =>
        position.branch === destination.branch && position.level === destination.level
    )?.[0];
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
        const oldText = localizedTalentText(context.oldLocalization, lang, oldTalentId);
        const newText = localizedTalentText(context.newLocalization, lang, newTalentId);
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
        added: { ru: 'Добавлена способность', en: 'Ability added', uk: 'Додано здібність', cs: 'Přidána schopnost' },
        removed: { ru: 'Удалена способность', en: 'Ability removed', uk: 'Видалено здібність', cs: 'Schopnost odebrána' },
    },
    item: {
        added: { ru: 'Добавлен предмет', en: 'Item added', uk: 'Додано предмет', cs: 'Přidán předmět' },
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
            ru: `Перемещён с тира ${oldValue} в тир ${newValue}`,
            en: `Moved from tier ${oldValue} to tier ${newValue}`,
            uk: `Переміщено з тіру ${oldValue} до тіру ${newValue}`,
            cs: `Přesunuto z tieru ${oldValue} do tieru ${newValue}`,
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
            ru: `Добавлен в тир ${tier}`,
            en: `Added to tier ${tier}`,
            uk: `Додано до тіру ${tier}`,
            cs: `Přidáno do tieru ${tier}`,
        })
        : (isRank ? {
            ru: `Удалён из разряда ${tier}`,
            en: `Removed from rank ${tier}`,
            uk: `Видалено з розряду ${tier}`,
            cs: `Odebráno z ranku ${tier}`,
        } : {
            ru: `Удалён из тира ${tier}`,
            en: `Removed from tier ${tier}`,
            uk: `Видалено з тіру ${tier}`,
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
    const head = !innateKnown ? NEW_HEAD.unknown : (innate ? NEW_HEAD.innate : NEW_HEAD.basic);
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
    NEW_HEAD.unknown.ru,
];
function isAbilityNatureNote(note) {
    if (!note) return false;
    if (note.parameter === 'Innate') return true;
    const ru = note.note?.ru || '';
    return NATURE_HEAD_RU.some((head) => ru.startsWith(head));
}

function itemDisplayName(itemId) {
    const smallWords = new Set(['a', 'an', 'and', 'at', 'for', 'from', 'in', 'of', 'on', 'the', 'to', 'with']);
    return String(itemId)
        .replace(/^item_/, '')
        .replace(/_custom$/, '')
        .split('_')
        .map((word, index) => index > 0 && smallWords.has(word)
            ? word
            : `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
        .join(' ');
}

function localizedItemName(itemId, localizationSources) {
    const canonicalId = String(itemId).replace(/_custom$/, '');
    const targets = [`dota_tooltip_ability_${itemId}`, `dota_tooltip_ability_${canonicalId}`]
        .map((target) => target.toLowerCase());
    for (const source of localizationSources || []) {
        const tokens = source?.en || {};
        const key = Object.keys(tokens).find((token) => targets.includes(token.toLowerCase()));
        if (key && String(tokens[key]).trim()) {
            return normText(String(tokens[key]).replace(/<[^>]+>/g, ' '));
        }
    }
    return itemDisplayName(itemId);
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
    const en = pick('en');
    const ru = pick('ru');
    if (!en && !ru) return null;
    return { ru: ru || en, en: en || ru, uk: pick('uk') || en || ru, cs: en || ru };
}

function recipeIndex(items, localizationSources = []) {
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
                        cost: Number(items[lookupId]?.ItemCost) || 0,
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
    const oldIds = new Set(oldC.map((c) => norm(c.id)));
    const newIds = new Set(newC.map((c) => norm(c.id)));
    const added = newC.filter((c) => !oldIds.has(norm(c.id)));
    const removed = oldC.filter((c) => !newIds.has(norm(c.id)));
    const lines = { ru: [], en: [], uk: [], cs: [] };

    // --- состав ---
    if (added.length === 1 && removed.length === 1) {
        const a = added[0];
        const r = removed[0];
        lines.ru.push(`Теперь для сборки требуется не ${r.name} (${r.cost} золота), а ${a.name} (${a.cost} золота)`);
        lines.en.push(`Now requires ${a.name} (${a.cost} gold) instead of ${r.name} (${r.cost} gold)`);
        lines.uk.push(`Тепер для збирання потрібен ${a.name} (${a.cost} золота) замість ${r.name} (${r.cost} золота)`);
        lines.cs.push(`Nyní vyžaduje ${a.name} (${a.cost} zlata) místo ${r.name} (${r.cost} zlata)`);
    } else {
        for (const a of added) {
            lines.ru.push(`Теперь для сборки также требуется ${a.name} (${a.cost} золота)`);
            lines.en.push(`Now also requires ${a.name} (${a.cost} gold)`);
            lines.uk.push(`Тепер для збирання також потрібен ${a.name} (${a.cost} золота)`);
            lines.cs.push(`Nyní také vyžaduje ${a.name} (${a.cost} zlata)`);
        }
        for (const r of removed) {
            lines.ru.push(`Больше не требует ${r.name} для сборки`);
            lines.en.push(`No longer requires ${r.name}`);
            lines.uk.push(`Більше не потребує ${r.name} для збирання`);
            lines.cs.push(`Již nevyžaduje ${r.name}`);
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
    if (oc !== nc) {
        // стоимость рецепта изменилась → строка с рецептом и общей стоимостью в скобках
        const d = nc > oc ? 'inc' : 'dec';
        let ruT;
        let enT;
        let ukT;
        let csT;
        if (ot === nt) {
            ruT = ` (общая стоимость прежняя — ${nt} золота)`;
            enT = `. Total cost unchanged at ${nt}g`;
            ukT = ` (загальна вартість незмінна — ${nt} золота)`;
            csT = ` (celková cena beze změny — ${nt} zlata)`;
        } else {
            const td = nt > ot ? 'inc' : 'dec';
            ruT = ` (общая стоимость ${TC[td].ru} с ${ot} до ${nt} золота)`;
            enT = `. Total cost ${TC[td].en} from ${ot}g to ${nt}g`;
            ukT = ` (загальну вартість ${TC[td].uk} з ${ot} до ${nt} золота)`;
            csT = ` (celková cena ${TC[td].cs} z ${ot} na ${nt} zlata)`;
        }
        lines.ru.push(`Стоимость рецепта ${RC[d].ru} с ${oc} до ${nc} золота${ruT}`);
        lines.en.push(`Recipe cost ${RC[d].en} from ${oc} to ${nc}${enT}`);
        lines.uk.push(`Вартість рецепта ${RC[d].uk} з ${oc} до ${nc} золота${ukT}`);
        lines.cs.push(`Cena receptu ${RC[d].cs} z ${oc} na ${nc} zlata${csT}`);
    } else if (ot !== nt && !compChanged) {
        // стоимость рецепта та же, а общая изменилась (каскад цены компонента)
        const td = nt > ot ? 'inc' : 'dec';
        if (nc > 0) {
            lines.ru.push(`Стоимость рецепта прежняя (${nc} золота). Общая стоимость ${TC[td].ru} с ${ot} до ${nt} золота`);
            lines.en.push(`Recipe cost unchanged at ${nc}. Total cost ${TC[td].en} from ${ot}g to ${nt}g`);
            lines.uk.push(`Вартість рецепта незмінна (${nc} золота). Загальну вартість ${TC[td].uk} з ${ot} до ${nt} золота`);
            lines.cs.push(`Cena receptu beze změny (${nc} zlata). Celková cena ${TC[td].cs} z ${ot} na ${nt} zlata`);
        } else {
            lines.ru.push(`Общая стоимость ${TC[td].ru} с ${ot} до ${nt} золота`);
            lines.en.push(`Total cost ${TC[td].en} from ${ot}g to ${nt}g`);
            lines.uk.push(`Загальну вартість ${TC[td].uk} з ${ot} до ${nt} золота`);
            lines.cs.push(`Celková cena ${TC[td].cs} z ${ot} na ${nt} zlata`);
        }
    }
    // если менялся только состав (oc===nc, а общую объясняют компоненты) — строку про
    // стоимость не добавляем, достаточно строк про компоненты

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
    // стоимость (Item Cost) — в самый верх, затем рецепт, затем остальное
    const rank = (note) => (note.parameter === 'ItemCost' ? 0 : note.parameter === 'recipe' ? 1 : 2);
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
        .replace(/\s+/g, ' ')
        .replace(/[.\s]+$/, '')
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
    return String(version).replace('.', ',');
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

function buildItemDescription(itemId, itemKV, localizationSources) {
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
        const cleaned = normText(spaced).replace(/\s+([.,;:!?])/g, '$1');
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
    AbilityCooldown: { ru: 'Перезарядка', en: 'Cooldown', uk: 'Перезаряджання', cs: 'Cooldown' },
    AbilityChargeRestoreTime: { ru: 'Восстановление заряда', en: 'Charge restore time', uk: 'Відновлення заряду', cs: 'Charge restore time' },
    AbilityManaCost: { ru: 'Расход маны', en: 'Mana cost', uk: 'Витрати мани', cs: 'Mana cost' },
    ItemCost: { ru: 'Стоимость', en: 'Cost', uk: 'Вартість', cs: 'Cost' },
};

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
        const value = normalizedAbilityValue(abilityKV[key]);
        if (value) result.push({ key, label, value });
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
        result[lang] = segments.length ? `${segments.join('. ')}.` : null;
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
        const positive = prefix.includes('+');
        const reduce = prefix.includes('-');
        let value = normalizedAbilityValue(raw, percent, options);
        if (!value) continue;
        if (positive) {
            value = value.split(' / ').map((part) => part.startsWith('-') ? part : `+${part}`).join(' / ');
        } else if (reduce) {
            // reduce-статы: в токене префикс «-» → показываем как отрицательное значение
            value = value.split(' / ').map((part) => /^[+-]/.test(part) ? part : `-${part}`).join(' / ');
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

// Кандидаты ключа картинки предмета: и по texture, и по id, у чар — без «enhancement_».
function itemImageCandidates(id, texture) {
    const clean = (s) => String(s).replace(/^item_/, '').replace(/_custom$/, '');
    const names = [];
    if (texture) names.push(clean(texture));
    names.push(clean(id));
    const cands = [];
    for (const n of names) {
        const noEnh = n.replace(/^enhancement_/, '');
        cands.push(`images/items/${noEnh}.webp`);
        if (noEnh !== n) cands.push(`images/items/${n}.webp`);
    }
    return cands;
}
// Кандидаты ключа способности: по texture, по id и по id с заменой имени героя
// (antimage → anti-mage), т.к. в бакете файлы бывают с дефисом.
function abilityImageCandidates(id, texture, altId) {
    const clean = (s) => String(s).replace(/_custom$/, '');
    const cands = [];
    if (texture) cands.push(`abilities/${clean(texture)}.webp`);
    cands.push(`abilities/${clean(id)}.webp`);
    if (altId && altId !== id) cands.push(`abilities/${clean(altId)}.webp`);
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

// Порядок способностей в списке: врождённая → упразднённая → новая → обычные.
function orderAbilities(list) {
    const rank = (ab) => (ab.innate ? 0 : ab.is_removed ? 1 : ab.is_new ? 2 : 3);
    return list
        .map((ab, index) => ({ ab, index }))
        .sort((a, b) => rank(a.ab) - rank(b.ab) || a.index - b.index)
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
function orderAbilityNotes(notes) {
    const list = [...(notes || [])];
    const natureNotes = list.filter(isAbilityNatureNote);
    const nonNature = list.filter((note) => !isAbilityNatureNote(note));
    const levelup = nonNature.filter(isLevelupNote);
    const semantic = nonNature.filter((note) => !isLevelupNote(note) && !abilityNoteHasPlaceholder(note));
    const ordinary = nonNature.filter((note) => !isLevelupNote(note) && abilityNoteHasPlaceholder(note));
    const head = natureNotes.length
        ? [natureNotes.find((note) => note.parameter === 'Innate') || natureNotes[0]]
        : [];
    return [...head, ...semantic, ...levelup, ...ordinary];
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
        .replace(/_/g, ' ');
}

// читаемое имя сущности из id: antimage -> «antimage», phantom_assassin -> «phantom assassin»
function readableEntityName(id) {
    return String(id).replace(/^boss_/, '').replace(/_/g, ' ');
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

// «+4% / +5%» -> «+4%/5%» (плюс только у первого тира)
function joinTierValue(value) {
    return String(value).split(' / ').map((p, i) => (i === 0 ? p : p.replace(/^\+/, ''))).join('/');
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

// Параметры чар готовыми нотами: «+4%/5% к здоровью» (+ флаг красного из данных)
function enhancementStatNotes(values) {
    return (values || []).map((v) => {
        const value = joinTierValue(v.value);
        const label = (l) => (v.label && (v.label[l] || v.label.en || v.label.ru)) || '';
        return {
            note: Object.fromEntries(NATURE_LANGS.map((l) => [l, `${value} ${label(l)}`.trim()])),
            ...(v.negative && { negative: true }),
        };
    });
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
    const describeNew = (id, kv) => buildItemDescription(id, kv, localizationSources);
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
    const abilityBlock = (hero, abilityId) => {
        if (!hero.abilities.has(abilityId)) {
            hero.abilities.set(abilityId, { ability_id: replaceHeroKey(abilityId), ability_notes: [] });
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
            boss.abilities.set(abilityId, { ability_id: replaceHeroKey(abilityId), ability_notes: [] });
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
    
    if (options.oldPresent?.neutrals && options.newPresent?.neutrals) {
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
        if (mappedId in abilities) return { id: mappedId, value: abilities[mappedId] };
        const customId = `${mappedId}_custom`;
        if (customId in abilities) return { id: customId, value: abilities[customId] };
        const canonicalId = abilityCanon(mappedId);
        if (canonicalId in abilities) return { id: canonicalId, value: abilities[canonicalId] };
        return { id: mappedId, value: undefined };
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
            if (newHero && !structuralAbilityChanges.has(`added:${abilityCanon(mappedId)}`)
                && !changedAbilityCanons.has(abilityCanon(mappedId))) {
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
                // Новую способность показываем только описанием (block.description),
                // без пометки «Новая базовая/врождённая способность. Активная/Пассивная.»
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

    const oldTalents = options.oldTalents || {};
    const newTalents = options.newTalents || {};
    const talentPositions = new Map();
    for (const heroKey of new Set([...Object.keys(oldTalents), ...Object.keys(newTalents)])) {
        const heroId = stripHeroPrefix(heroKey);
        if (isAddedHero(heroId)) continue;
        const oldPositions = heroTalentPositions(oldTalents[heroKey], heroId);
        const newPositions = heroTalentPositions(newTalents[heroKey], heroId);
        talentPositions.set(heroId, { old: oldPositions, new: newPositions });
        for (const move of talentMoves(oldTalents[heroKey], newTalents[heroKey], heroId)) {
            talentBlock(heroBlock(heroId), move.id, move.new || move.old).talents_notes.push(
                structuralTalentNote(move, {
                    oldPositions,
                    oldLocalization,
                    newLocalization,
                })
            );
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
        const note = talentRawNote('changed', values.old, values.new);
        const positions = talentPositions.get(heroId);
        const position = positions?.new[key] || positions?.old[key];
        talentBlock(heroBlock(heroId), key, position).talents_notes.push(note);
    }

    for (const heroKey of Object.keys(newTalents)) {
        const heroId = stripHeroPrefix(heroKey);
        if (!isAddedHero(heroId)) continue;
        const positions = heroTalentPositions(newTalents[heroKey], heroId);
        for (const [talentId, position] of Object.entries(positions)) {
            const note = Object.fromEntries(
                LANGS.map((lang) => [lang, localizedTalentText(newLocalization, lang, talentId) || null])
            );
            if (!LANGS.some((lang) => note[lang])) continue;
            talentBlock(heroBlock(heroId), talentId, position).talents_notes.push(readyNote('added', null, null, note));
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
                hero_notes: hero.hero_notes,
                abilities: orderAbilities(dedupeAbilities([...hero.abilities.values()])).map((ab) => orderAbilityFields(ab, heroName)),
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
        .map((boss) => ({
            boss_id: boss.boss_id,
            name: readableEntityName(boss.boss_id),
            image: resolveImage(assetKeys, heroImagePath(boss.boss_id.replace(/^boss_/, '').replace(/_boss.*$/, '')), STD_IMAGE.hero),
            abilities: dedupeAbilities([...boss.abilities.values()]).map(orderAbilityFields),
        }))
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
            abilities: dedupeAbilities([...creep.abilities.values()]).map(orderAbilityFields),
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
                name: readableItemName(item.item_id),
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
            const isNew = item.is_new && !existedBefore;
            const ranks = normalizeEnhancementRanks(newNeutrals[item.item_id]);
            const newRanks = addedNeutralRanks.get(item.item_id) || [];
            const rankNumbers = (isNew ? ranks : newRanks).map((entry) => entry.tier);
            const rankValue = rankNumbers.length > 1 ? rankNumbers : rankNumbers[0] ?? null;
            const enhancementLevels = (isNew ? ranks : newRanks).map((entry) => entry.level);
            const enhancementLevel = enhancementLevels.length > 1 ? enhancementLevels : enhancementLevels[0] ?? null;
            const currentTiers = normalizeTiers(newNeutrals[item.item_id]);
            const tierValue = isNew
                ? (currentTiers.length > 1 ? currentTiers : currentTiers[0] ?? null)
                : null;
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
                name: readableItemName(item.item_id),
                image: resolveImage(assetKeys, itemImageCandidates(item.item_id, texture), STD_IMAGE.item),
                neutral_type: kind,
                is_new: isNew,
                tier: kind === 'artifact' ? tierValue : null,
                ...(kind === 'enhancement' && rankValue != null && { rank: rankValue }),
                ...(kind === 'enhancement' && enhancementLevel != null && { enhancement_level: enhancementLevel }),
                ...(newRankValue != null && { new_rank: newRankValue }),
                // у нейтралок нет покупной стоимости — заметку Item Cost не выводим
                neutral_item_notes: orderItemNotes((item.item_notes || []).filter((note) => note.parameter !== 'ItemCost')),
            };
            // готовая подпись «Новые чары N разряда» / «Новый артефакт N разряда»
            if (isNew) {
                const captionValue = kind === 'enhancement' ? (newRankValue ?? rankValue) : tierValue;
                const caption = neutralCaption(kind, captionValue);
                if (caption) neutral.caption = caption;
            }
            if (isNew || selectedLevel != null) {
                neutral.description = describeNew(item.item_id, newItems[item.item_id]);
                neutral.description_sections = describeNewSections(item.item_id, newItems[item.item_id]);
                if (kind === 'enhancement') {
                    // чары: параметры готовыми нотами (+4%/5% к здоровью, красный флаг)
                    const values = buildItemCharacteristics(item.item_id, newItems[item.item_id], itemStatLocalizationSources, {
                        includeReadableTokens: true,
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
    buildItemCharacteristics,
    flattenDiff,
    isCosmetic,
    normText,
};
