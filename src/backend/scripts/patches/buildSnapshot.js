const fs = require('fs');
const path = require('path');
const { parseKV } = require('./kvParser');
const { extractLuaTable } = require('./luaTable');

const LOCALES = [
    ['ru', 'addon_russian.txt'],
    ['en', 'addon_english.txt'],
    ['uk', 'addon_ukrainian.txt'],
];

const BASE_LOCALES = [
    ['ru', 'abilities_russian.txt'],
    ['en', 'abilities_english.txt'],
    ['uk', 'abilities_ukrainian.txt'],
];

function readIfExists(dir, file) {
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) return null;
    return fs.readFileSync(full, 'utf-8');
}

function parseKVSection(dir, file, rootKey) {
    const raw = readIfExists(dir, file);
    if (!raw) return {};
    const parsed = parseKV(raw);
    return (rootKey ? parsed[rootKey] : parsed) || {};
}

function parseTokens(dir, file) {
    const raw = readIfExists(dir, file);
    if (!raw) return {};
    const parsed = parseKV(raw);
    return (parsed.lang && parsed.lang.Tokens) || parsed.Tokens || {};
}

const stripCustom = (id) => String(id).replace(/_custom$/, '');

function buildAbilities(patchDir) {
    const abilities = { ...parseKVSection(patchDir, 'npc_abilities_custom.txt', 'DOTAAbilities') };
    const known = new Set(Object.keys(abilities).map(stripCustom));
    let heroFiles = [];
    try {
        heroFiles = fs
            .readdirSync(patchDir)
            .filter((name) => /^npc_dota_hero_.+\.txt$/.test(name));
    } catch {
        heroFiles = [];
    }
    for (const file of heroFiles) {
        const perHero = parseKVSection(patchDir, file, 'DOTAAbilities');
        for (const [id, kv] of Object.entries(perHero)) {
            if (id === 'Version') continue;
            if (known.has(stripCustom(id))) continue;
            abilities[id] = kv;
            known.add(stripCustom(id));
        }
    }
    return abilities;
}

function buildHeroes(patchDir, activelist) {
    const custom = parseKVSection(patchDir, 'npc_heroes_custom.txt', 'DOTAHeroes');
    const base = parseKVSection(patchDir, 'npc_heroes.txt', 'DOTAHeroes');
    const roster = new Set([...Object.keys(custom), ...Object.keys(activelist)]);
    const heroes = {};
    for (const hero of roster) {
        if (hero === 'Version') continue;
        const baseHero = base[hero];
        const customHero = custom[hero];
        if (customHero && typeof customHero === 'object') {
            heroes[hero] = baseHero && typeof baseHero === 'object'
                ? { ...baseHero, ...customHero }
                : customHero;
        } else if (baseHero && typeof baseHero === 'object') {
            heroes[hero] = baseHero;
        }
    }
    return heroes;
}

function buildItems(patchDir, separateIds = new Set()) {
    const base = parseKVSection(patchDir, 'items.txt', 'DOTAAbilities');
    const custom = parseKVSection(patchDir, 'npc_items_custom.txt', 'DOTAAbilities');
    
    const baseByCanon = {};
    for (const [id, kv] of Object.entries(base)) {
        if (id !== 'Version' && kv && typeof kv === 'object') baseByCanon[stripCustom(id)] = kv;
    }
    const items = {};
    const known = new Set();
    for (const [id, kv] of Object.entries(custom)) {
        if (id === 'Version' || !kv || typeof kv !== 'object' || Array.isArray(kv)) continue;
        const canon = stripCustom(id);

        const separate = id.endsWith('_custom') && separateIds.has(canon);
        const baseKv = separate ? undefined : baseByCanon[canon];
        items[id] = baseKv
            ? {
                ...baseKv,
                ...kv,
                ...((baseKv.AbilityValues || kv.AbilityValues) && {
                    AbilityValues: { ...(baseKv.AbilityValues || {}), ...(kv.AbilityValues || {}) },
                }),
            }
            : kv;
        if (!separate) known.add(canon);
    }
    for (const [id, kv] of Object.entries(base)) {
        if (id === 'Version') continue;
        if (known.has(stripCustom(id))) continue; 
        items[id] = kv;
        known.add(stripCustom(id));
    }
    return items;
}

function buildShops(patchDir) {
    const root = parseKVSection(patchDir, 'shops.txt', 'dota_shops');
    const shops = {};
    for (const [category, block] of Object.entries(root)) {
        if (!block || typeof block !== 'object') continue;
        const items = Array.isArray(block.item) ? block.item : block.item ? [block.item] : [];
        shops[category] = items.filter((id) => typeof id === 'string');
    }
    return shops;
}

function buildNeutrals(patchDir) {
    const tiers = parseKVSection(patchDir, 'npc_neutral_items_custom.txt', 'neutral_items').neutral_tiers || {};
    const map = {};
    const ensureEntry = (id, kind) => {
        if (!map[id]) map[id] = { kind, tiers: [] };
        map[id].kind = kind;
        if (!Array.isArray(map[id].tiers)) map[id].tiers = [];
        if (kind === 'enhancement' && !Array.isArray(map[id].ranks)) map[id].ranks = [];
        return map[id];
    };
    for (const [tierKey, block] of Object.entries(tiers)) {
        const tier = Number(tierKey);
        if (!Number.isFinite(tier) || !block || typeof block !== 'object') continue;
        const collectItems = (group) => {
            for (const id of Object.keys(group || {})) {
                if (typeof id !== 'string' || !id.startsWith('item_')) continue;
                const entry = ensureEntry(id, 'artifact');
                if (!entry.tiers.includes(tier)) entry.tiers.push(tier);
            }
        };
        const collectEnhancements = (group, category) => {
            for (const [id, rawLevel] of Object.entries(group || {})) {
                if (typeof id !== 'string' || !id.startsWith('item_')) continue;
                const level = Number(rawLevel);
                const entry = ensureEntry(id, 'enhancement');
                if (!entry.tiers.includes(tier)) entry.tiers.push(tier);
                if (Number.isFinite(level) && !entry.ranks.some((item) => item.tier === tier && item.level === level)) {
                    entry.ranks.push({ tier, level, category });
                }
            }
        };
        collectItems(block.items);
        for (const [category, group] of Object.entries(block.enhancements || {})) collectEnhancements(group, category);
    }
    for (const entry of Object.values(map)) {
        entry.tiers.sort((a, b) => a - b);
        if (Array.isArray(entry.ranks)) entry.ranks.sort((a, b) => a.tier - b.tier || a.level - b.level);
    }
    return map;
}

function buildUnits(patchDir) {
    const all = parseKVSection(patchDir, 'npc_units_custom.txt', 'DOTAUnits');
    const units = {};
    const creepAbilityMap = {};
    for (const [unitId, kv] of Object.entries(all)) {
        if (!/^npc_woda_creep\d+$/.test(unitId) || !kv || typeof kv !== 'object' || Array.isArray(kv)) continue;
        units[unitId] = kv;
        for (const [key, ability] of Object.entries(kv)) {
            if (!/^Ability\d+$/.test(key)) continue;
            if (typeof ability === 'string' && ability && ability !== 'generic_hidden') {
                if (!creepAbilityMap[ability]) creepAbilityMap[ability] = [];
                if (!creepAbilityMap[ability].includes(unitId)) creepAbilityMap[ability].push(unitId);
            }
        }
    }
    return { units, creepAbilityMap };
}

function buildHeroAbilities(patchDir) {
    const raw = readIfExists(patchDir, 'heroesAbilities.json');
    const heroAbilityMap = {};
    const innateAbilities = [];
    if (!raw) return { heroAbilityMap, innateAbilities };
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { heroAbilityMap, innateAbilities };
    }
    for (const [hero, block] of Object.entries(parsed.heroes || {})) {
        if (!block || typeof block !== 'object') continue;
        for (const abilityId of Object.values(block.abilities || {})) {
            if (typeof abilityId === 'string' && abilityId) heroAbilityMap[abilityId] = hero;
        }
        if (typeof block.innate === 'string' && block.innate) {
            heroAbilityMap[block.innate] = hero;
            innateAbilities.push(block.innate);
        }
    }
    return { heroAbilityMap, innateAbilities };
}

function buildSnapshot(patchDir, version) {
    const activelist = parseKVSection(patchDir, 'activelist.txt', 'Whitelist');
    const abilities = buildAbilities(patchDir);
    const shops = buildShops(patchDir);

    const shopItemIds = new Set();
    for (const ids of Object.values(shops)) for (const id of ids) shopItemIds.add(id);
    const separateItemIds = new Set();
    for (const id of shopItemIds) {
        if (id.endsWith('_custom') && shopItemIds.has(stripCustom(id))) {
            const canon = stripCustom(id);
            separateItemIds.add(canon);
            // у base и custom версии — разные рецепты, их тоже нельзя склеивать
            separateItemIds.add(canon.replace(/^item_/, 'item_recipe_'));
        }
    }
    const items = buildItems(patchDir, separateItemIds);
    const heroes = buildHeroes(patchDir, activelist);
    const neutrals = buildNeutrals(patchDir);
    const { units, creepAbilityMap } = buildUnits(patchDir);
    const { heroAbilityMap, innateAbilities } = buildHeroAbilities(patchDir);

    const localization = {};
    for (const [lng, file] of LOCALES) {
        localization[lng] = parseTokens(patchDir, file);
    }
    
    const baseLocalization = {};
    for (const [lng, file] of BASE_LOCALES) {
        baseLocalization[lng] = parseTokens(patchDir, file);
    }

    let talents = {};
    const talentsRaw = readIfExists(patchDir, 'talents_list.lua');
    if (talentsRaw) {
        try {
            talents = extractLuaTable(talentsRaw, 'herotalents') || {};
        } catch (err) {
            talents = { _error: `Не удалось разобрать talents_list.lua: ${err.message}` };
        }
    }
    
    const exists = (file) => fs.existsSync(path.join(patchDir, file));
    const present = {
        neutrals: exists('npc_neutral_items_custom.txt'),
        shops: exists('shops.txt'),
        talents: !!talentsRaw,
        heroesAbilities: exists('heroesAbilities.json'),
        itemsBase: exists('items.txt'),
        heroesBase: exists('npc_heroes.txt'),
        units: exists('npc_units_custom.txt'),
    };

    return {
        version,
        generatedAt: new Date().toISOString(),
        counts: {
            items: Object.keys(items).length,
            abilities: Object.keys(abilities).length,
            heroes: Object.keys(heroes).length,
            talents: Object.keys(talents).length,
        },
        present,
        items,
        abilities,
        heroes,
        activelist,
        shops,
        neutrals,
        units,
        creepAbilityMap,
        heroAbilityMap,
        innateAbilities,
        localization,
        baseLocalization,
        talents,
    };
}

module.exports = { buildSnapshot };
