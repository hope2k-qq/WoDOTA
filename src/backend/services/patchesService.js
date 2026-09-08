const fs = require('fs');
const path = require('path');
const { buildSnapshot } = require('../scripts/patches/buildSnapshot');
const { diffSnapshots } = require('../scripts/patches/diffSnapshots');
const { buildChangelogData } = require('../scripts/patches/renderChangelog');
const assetIndex = require('../scripts/patches/assetIndex');
const {
    sourceDir,
    draftFile,
    changelogFile,
    publishedFile,
    publishedLangFile,
    skippedFile,
    listPatchVersions,
    hasPatch,
    previousVersion,
} = require('../scripts/patches/versions');

// языки патчлога (чешский отдельно не генерируется — при публикации берётся копия en)
const LANG_KEYS = new Set(['ru', 'en', 'uk', 'cs']);
const isLangMap = (node) => {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return false;
    const keys = Object.keys(node);
    return keys.length > 0 && keys.every((k) => LANG_KEYS.has(k));
};

// убрать чешский из уже собранных данных (генерируем только ru/en/uk)
function stripCs(node) {
    if (Array.isArray(node)) {
        node.forEach(stripCs);
    } else if (node && typeof node === 'object') {
        if (isLangMap(node) && 'cs' in node) delete node.cs;
        Object.values(node).forEach(stripCs);
    }
    return node;
}

// поднимаем icon из note на уровень заметки (старые данные клали его внутрь note,
// из-за чего note переставал быть чистой лок-картой и не сворачивался в строку)
function hoistNoteIcons(node) {
    if (Array.isArray(node)) {
        node.forEach(hoistNoteIcons);
    } else if (node && typeof node === 'object') {
        const note = node.note;
        if (note && typeof note === 'object' && !Array.isArray(note) && 'icon' in note) {
            if (node.icon == null) node.icon = note.icon;
            delete note.icon;
        }
        Object.values(node).forEach(hoistNoteIcons);
    }
    return node;
}

// проекция патчлога на один язык: каждую лок-карту заменяем ПРОСТО СТРОКОЙ
// нужного языка (никаких других языков в файле не остаётся)
function projectLang(node, sourceLang) {
    if (Array.isArray(node)) return node.map((x) => projectLang(x, sourceLang));
    if (node && typeof node === 'object') {
        if (isLangMap(node)) {
            return node[sourceLang] ?? node.en ?? node.ru ?? node.uk ?? '';
        }
        const out = {};
        for (const [k, v] of Object.entries(node)) out[k] = projectLang(v, sourceLang);
        return out;
    }
    return node;
}

// пары «файл языка -> откуда берём текст» (cs = копия en)
const PUBLISH_LANGS = [['ru', 'ru'], ['uk', 'uk'], ['en', 'en'], ['cs', 'en']];

const snapshotCache = new Map();

function getSnapshot(version) {
    if (!snapshotCache.has(version)) {
        snapshotCache.set(version, buildSnapshot(sourceDir(version), version));
    }
    return snapshotCache.get(version);
}

function clearSnapshotCache() {
    snapshotCache.clear();
}

function writeJson(file, data) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function buildChangelogBetween(from, to, assetKeys = null) {
    const oldSnap = getSnapshot(from);
    const newSnap = getSnapshot(to);
    const diff = diffSnapshots(oldSnap, newSnap);
    const heroList = Object.keys(newSnap.heroes || {}).map((k) =>
        k.replace('npc_dota_hero_', '')
    );
    const data = buildChangelogData(diff, {
        assetKeys,
        heroList,
        newHeroes: newSnap.heroes,
        oldTalents: oldSnap.talents,
        newTalents: newSnap.talents,
        oldAbilities: oldSnap.abilities,
        newAbilities: newSnap.abilities,
        oldItems: oldSnap.items,
        newItems: newSnap.items,
        oldShops: oldSnap.shops,
        newShops: newSnap.shops,
        oldNeutrals: oldSnap.neutrals,
        newNeutrals: newSnap.neutrals,
        oldLocalization: oldSnap.localization,
        newLocalization: newSnap.localization,
        newBaseLocalization: newSnap.baseLocalization,
        oldActivelist: oldSnap.activelist,
        newActivelist: newSnap.activelist,
        oldHeroAbilityMap: oldSnap.heroAbilityMap,
        newHeroAbilityMap: newSnap.heroAbilityMap,
        oldInnateAbilities: oldSnap.innateAbilities,
        newInnateAbilities: newSnap.innateAbilities,
        oldUnits: oldSnap.units,
        newUnits: newSnap.units,
        oldCreepAbilityMap: oldSnap.creepAbilityMap,
        newCreepAbilityMap: newSnap.creepAbilityMap,
        oldPresent: oldSnap.present,
        newPresent: newSnap.present,
    });
    
    stripCs(data); // чешский в changelog не генерируем — только ru/en/uk
    hoistNoteIcons(data); // icon — на уровень заметки, а не внутри note
    const { skipped, ...mainData } = data;
    writeJson(skippedFile(to), skipped || {});

    writeJson(draftFile(to), mainData);

    let seeded = false;
    if (!fs.existsSync(changelogFile(to))) {
        writeJson(changelogFile(to), mainData);
        seeded = true;
    }

    return { data: mainData, seeded };
}

function buildChangelogFor(version, from, assetKeys = null) {
    const prev = from || previousVersion(version);
    if (!prev) return null;
    return buildChangelogBetween(prev, version, assetKeys);
}

// Список ключей бакета грузим только здесь (на время генерации) и не храним после.
async function createPatch(version, from) {
    const assetKeys = await assetIndex.loadAssetKeys();
    try {
        return buildChangelogFor(version, from, assetKeys);
    } finally {
        clearSnapshotCache();
    }
}

async function createAllPatches() {
    const assetKeys = await assetIndex.loadAssetKeys();
    try {
        return listPatchVersions()
            .map((v) => {
                const r = buildChangelogFor(v, undefined, assetKeys);
                return r ? { version: v, seeded: r.seeded, draft: r.data } : null;
            })
            .filter(Boolean)
            .reverse();
    } finally {
        clearSnapshotCache();
    }
}

function readPatch(version) {
    const file = changelogFile(version);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function readPublished(version, lang) {
    // если запрошен конкретный язык и есть его файл — отдаём его, иначе общий published.json
    const candidate = lang ? publishedLangFile(version, lang) : null;
    const file = candidate && fs.existsSync(candidate) ? candidate : publishedFile(version);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function listPublishedVersions() {
    return listPatchVersions().filter((v) => fs.existsSync(publishedFile(v)));
}

function stripRawValues(node) {
    if (Array.isArray(node)) {
        node.forEach(stripRawValues);
    } else if (node && typeof node === 'object') {
        delete node.old_raw_value;
        delete node.new_raw_value;
        Object.values(node).forEach(stripRawValues);
    }
    return node;
}

// Собирает картинки, которые надо перенести в папку патча: все image-поля, кроме
// стандартных (pages/patches/…), превью героев (heroesPreview) и уже обрезанных (без «/»).
// Поля icon (public фронта, напр. /health_regen.png) не трогаем — это не картинки бакета.
function collectPatchImages(node, out = new Set()) {
    if (Array.isArray(node)) {
        node.forEach((v) => collectPatchImages(v, out));
    } else if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
            if (k === 'image' && typeof v === 'string') {
                if (
                    v.includes('/')                    // есть путь (не уже обрезанное имя)
                    && !v.startsWith('/')              // не фронтовая public-иконка (/str.png, /health_regen.png)
                    && !v.startsWith('pages/patches/') // не стандартная картинка
                    && !v.includes('heroesPreview')    // не превью героя
                    && !v.includes('innate_icon')      // не общий innate-иконка
                ) {
                    out.add(v);
                }
            } else {
                collectPatchImages(v, out);
            }
        }
    }
    return out;
}

// Имя файла в папке патча. Для талантов (…/talents/<hero>/<n>.webp) всегда добавляем имя
// героя в начало (warlock_8.webp), чтобы ключ был уникален (у талантов имена — просто номера).
// Способности уже названы по ability_id (начинается с имени героя), их имя оставляем как есть.
function patchImageName(src) {
    const parts = String(src).split('/');
    const file = parts.pop();
    if (parts[parts.length - 2] === 'talents') {
        return `${parts[parts.length - 1]}_${file}`; // <hero>_<n>.webp
    }
    return file;
}

// Строит карту исходный_ключ → имя файла для папки патча (с защитой от остаточных коллизий).
function buildPatchImageNames(sources) {
    const prelim = sources.map((s) => [s, patchImageName(s)]);
    const counts = {};
    for (const [, n] of prelim) counts[n] = (counts[n] || 0) + 1;
    const map = new Map();
    for (const [s, n] of prelim) {
        if (counts[n] > 1) {
            const parts = String(s).split('/');
            const file = parts.pop();
            const parent = parts[parts.length - 1] || '';
            map.set(s, parent ? `${parent}_${file}` : n);
        } else {
            map.set(s, n);
        }
    }
    return map;
}

// Обрезает скопированные картинки до имени файла из карты (фронт достроит путь папки патча).
function trimCopiedImages(node, destMap, copied) {
    if (Array.isArray(node)) {
        node.forEach((v) => trimCopiedImages(v, destMap, copied));
    } else if (node && typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) {
            if (k === 'image' && typeof v === 'string' && copied.has(v)) {
                node[k] = destMap.get(v);
            } else {
                trimCopiedImages(v, destMap, copied);
            }
        }
    }
}

async function publishPatch(version, name) {
    const changelog = readPatch(version);
    if (!changelog) return null;

    const data = stripRawValues(JSON.parse(JSON.stringify(changelog)));
    stripCs(data); // на всякий случай: в публичной копии чешского быть не должно
    hoistNoteIcons(data); // icon из старых данных поднимаем на уровень заметки
    if (name) {
        data.patch_name = name;
    }

    // Переносим используемые картинки в бакете в pages/patches/<version>/ и обрезаем
    // их путь в published до имени файла (фронт грузит из папки патча).
    const sources = [...collectPatchImages(data)];
    const destMap = buildPatchImageNames(sources);
    const copied = await assetIndex.copyPatchImages(version, destMap);
    if (copied.size) trimCopiedImages(data, destMap, copied);

    const file = publishedFile(version);
    writeJson(file, data);

    // дополнительно — по файлу на язык (cs = копия en), где note уже готовая строка;
    // фронт грузит только нужный и берёт текст напрямую
    for (const [target, source] of PUBLISH_LANGS) {
        writeJson(publishedLangFile(version, target), projectLang(data, source));
    }

    return { file, data };
}

module.exports = {
    getSnapshot,
    clearSnapshotCache,
    buildChangelogBetween,
    buildChangelogFor,
    createPatch,
    createAllPatches,
    readPatch,
    readPublished,
    listPublishedVersions,
    publishPatch,
    listPatchVersions,
    hasPatch,
    previousVersion,
};
