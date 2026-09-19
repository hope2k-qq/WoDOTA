const fs = require('fs');
const path = require('path');
const { parseKV } = require('./kvParser');
const { extractLuaTable } = require('./luaTable');
const { ARTIFACT_COST_TIER, KNOWN_ARTIFACTS, ENHANCEMENT_TIERS, ENHANCEMENTS_SINCE } = require('./legacyNeutrals');

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

function decodeText(buf) {
    if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.toString('utf16le', 2);
    if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
        return Buffer.from(buf.subarray(2)).swap16().toString('utf16le');
    }
    return buf.toString('utf-8');
}

function readIfExists(dir, file) {
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) return null;
    return decodeText(fs.readFileSync(full));
}

function mergeDuplicateBlocks(value) {
    if (!Array.isArray(value)) return value;
    const blocks = value.filter((v) => v && typeof v === 'object' && !Array.isArray(v));
    if (!blocks.length) return value[value.length - 1];
    return blocks.reduce((acc, kv) => ({
        ...acc,
        ...kv,
        ...((acc.AbilityValues || kv.AbilityValues) && {
            AbilityValues: { ...(acc.AbilityValues || {}), ...(kv.AbilityValues || {}) },
        }),
    }), {});
}

function unwrapValueBlocks(kv) {
    const values = kv && kv.AbilityValues;
    if (!values || typeof values !== 'object') return kv;
    const flat = {};
    for (const [key, raw] of Object.entries(values)) {
        flat[key] = (raw && typeof raw === 'object' && !Array.isArray(raw) && 'value' in raw)
            ? raw.value
            : raw;
    }
    return { ...kv, AbilityValues: flat };
}

function parseKVSection(dir, file, rootKey) {
    const raw = readIfExists(dir, file);
    if (!raw) return {};
    const parsed = parseKV(raw);
    const section = (rootKey ? parsed[rootKey] : parsed) || {};
    const out = {};
    for (const [key, value] of Object.entries(section)) {
        out[key] = unwrapValueBlocks(mergeDuplicateBlocks(value));
    }
    return out;
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
    const take = (source) => {
        for (const [id, kv] of Object.entries(source || {})) {
            if (id === 'Version' || !kv || typeof kv !== 'object') continue;
            if (known.has(stripCustom(id))) continue;
            abilities[id] = kv;
            known.add(stripCustom(id));
        }
    };
    for (const file of heroFiles) {
        take(parseKVSection(patchDir, file, 'DOTAAbilities'));
        for (const heroKv of Object.values(parseKVSection(patchDir, file, 'DOTAHeroes'))) {
            if (!heroKv || typeof heroKv !== 'object') continue;
            const defs = heroKv.AbilityDefinitions;
            if (!defs || typeof defs !== 'object') continue;
            const unwrapped = {};
            for (const [id, kv] of Object.entries(defs)) {
                unwrapped[id] = unwrapValueBlocks(mergeDuplicateBlocks(kv));
            }
            take(unwrapped);
        }
    }
    return abilities;
}

function buildHeroBase(patchDir) {
    const base = { ...parseKVSection(patchDir, 'npc_heroes.txt', 'DOTAHeroes') };
    let heroFiles = [];
    try {
        heroFiles = fs
            .readdirSync(patchDir)
            .filter((name) => /^npc_dota_hero_.+\.txt$/.test(name));
    } catch {
        heroFiles = [];
    }
    for (const file of heroFiles) {
        const perHero = parseKVSection(patchDir, file, 'DOTAHeroes');
        for (const [id, kv] of Object.entries(perHero)) {
            if (id === 'Version' || !kv || typeof kv !== 'object') continue;
            const known = base[id];
            base[id] = known && typeof known === 'object' ? { ...known, ...kv } : kv;
        }
    }
    return base;
}

function buildHeroes(patchDir, activelist) {
    const custom = parseKVSection(patchDir, 'npc_heroes_custom.txt', 'DOTAHeroes');
    const base = buildHeroBase(patchDir);
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

function buildItems(patchDir) {
    const base = parseKVSection(patchDir, 'items.txt', 'DOTAAbilities');
    const custom = parseKVSection(patchDir, 'npc_items_custom.txt', 'DOTAAbilities');

    const items = {};
    const taken = new Set();
    for (const [id, kv] of Object.entries(custom)) {
        if (id === 'Version' || !kv || typeof kv !== 'object' || Array.isArray(kv)) continue;
        const baseKv = base[id] && typeof base[id] === 'object' ? base[id] : undefined;
        items[id] = baseKv
            ? {
                ...baseKv,
                ...kv,
                ...((baseKv.AbilityValues || kv.AbilityValues) && {
                    AbilityValues: { ...(baseKv.AbilityValues || {}), ...(kv.AbilityValues || {}) },
                }),
            }
            : kv;
        taken.add(id);
    }
    for (const [id, kv] of Object.entries(base)) {
        if (id === 'Version' || taken.has(id)) continue;
        items[id] = kv;
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

function legacyNeutrals(items, version) {
    const map = {};
    for (const [id, kv] of Object.entries(items || {})) {
        const canonical = KNOWN_ARTIFACTS.has(id)
            ? id
            : (KNOWN_ARTIFACTS.has(stripCustom(id)) ? stripCustom(id) : null);
        if (!canonical) continue;
        const tier = ARTIFACT_COST_TIER[Number(kv && kv.ItemCost)];
        if (!tier) continue;
        if (map[canonical] && canonical !== id) continue;
        map[canonical] = { kind: 'artifact', tiers: [tier] };
    }
    if (version && String(version) >= String(ENHANCEMENTS_SINCE)) {
        for (const [id, tiers] of Object.entries(ENHANCEMENT_TIERS)) {
            if (!(id in (items || {}))) continue;
            map[id] = {
                kind: 'enhancement',
                tiers: [...tiers],
                ranks: tiers.map((tier, i) => ({ tier, level: i + 1, category: 'global' })),
            };
        }
    }
    return map;
}

function buildNeutrals(patchDir, items, version) {
    const raw = readIfExists(patchDir, 'npc_neutral_items_custom.txt');
    if (!raw) return legacyNeutrals(items, version);
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

const TALENT_BRANCHES = { 1: 'strength', 2: 'agility', 3: 'intelligence' };

function buildBasicTalents(rawLua, heroTalents, localization) {
    const names = extractLuaTable(rawLua, 'basictalents');
    const list = Array.isArray(names) ? names : [];
    if (!list.length) return {};
    const known = new Set(list.map((n) => String(n).replace(/^modifier_woda_talent_/, '')));
    const seen = {};
    for (const hero of Object.values(heroTalents || {})) {
        if (!hero || typeof hero !== 'object') continue;
        for (const [branch, rows] of Object.entries(hero)) {
            if (!rows || typeof rows !== 'object') continue;
            for (const [row, cells] of Object.entries(rows)) {
                const cellList = Array.isArray(cells) ? cells : Object.values(cells || {});
                for (const cell of cellList) {
                    if (!Array.isArray(cell) || typeof cell[0] !== 'string') continue;
                    if (!cell[0].startsWith('modifier_woda_talent_')) continue;
                    const name = cell[0].replace('modifier_woda_talent_', '');
                    if (!known.has(name)) continue;
                    const requires = Array.isArray(cell[4]) && cell[4].length
                        ? `${String(cell[4][0]).replace('modifier_woda_talent_', '')}:${cell[4][1]}`
                        : '';
                    const key = `${TALENT_BRANCHES[branch] || branch}|${row}|${cell[2]}|${requires}`;
                    const bucket = seen[name] || (seen[name] = {});
                    bucket[key] = (bucket[key] || 0) + 1;
                }
            }
        }
    }
    const token = (lng, name) => {
        const tokens = (localization && localization[lng]) || {};
        const wanted = `woda_talent_${name}_0`.toLowerCase();
        for (const [k, v] of Object.entries(tokens)) if (k.toLowerCase() === wanted) return String(v);
        return null;
    };
    const out = {};
    for (const name of known) {
        const bucket = seen[name];
        if (!bucket) continue;
        const [key, heroes] = Object.entries(bucket).sort((a, b) => b[1] - a[1])[0];
        const [branch, row, max, requires] = key.split('|');
        out[name] = {
            branch,
            level: row,
            max_rank: max,
            requires,
            heroes: String(heroes),
            text_ru: token('ru', name),
            text_en: token('en', name),
            text_uk: token('uk', name),
        };
    }
    return out;
}

function buildSnapshot(patchDir, version) {
    const activelist = parseKVSection(patchDir, 'activelist.txt', 'Whitelist');
    const abilities = buildAbilities(patchDir);
    const shops = buildShops(patchDir);

    const items = buildItems(patchDir);
    const heroes = buildHeroes(patchDir, activelist);
    const neutrals = buildNeutrals(patchDir, items, version);
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
    let basicTalents = {};
    let lockedTalents = {};
    const talentsRaw = readIfExists(patchDir, 'talents_list.lua');
    if (talentsRaw) {
        try {
            talents = extractLuaTable(talentsRaw, 'herotalents') || {};
        } catch (err) {
            talents = { _error: `Не удалось разобрать talents_list.lua: ${err.message}` };
        }
        try {
            lockedTalents = extractLuaTable(talentsRaw, 'LockedTalents') || {};
        } catch (err) {
            lockedTalents = { _error: `Не удалось разобрать LockedTalents: ${err.message}` };
        }
        try {
            basicTalents = buildBasicTalents(talentsRaw, talents, localization);
        } catch (err) {
            basicTalents = { _error: `Не удалось разобрать basictalents: ${err.message}` };
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
        basicTalents,
        lockedTalents,
    };
}

module.exports = { buildSnapshot };
