const fs = require('fs');
const path = require('path');
const { buildSnapshot } = require('../scripts/patches/buildSnapshot');
const { diffSnapshots } = require('../scripts/patches/diffSnapshots');
const { buildChangelogData } = require('../scripts/patches/renderChangelog');
const {
    sourceDir,
    draftFile,
    changelogFile,
    publishedFile,
    skippedFile,
    listPatchVersions,
    hasPatch,
    previousVersion,
} = require('../scripts/patches/versions');

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

function buildChangelogBetween(from, to) {
    const oldSnap = getSnapshot(from);
    const newSnap = getSnapshot(to);
    const diff = diffSnapshots(oldSnap, newSnap);
    const heroList = Object.keys(newSnap.heroes || {}).map((k) =>
        k.replace('npc_dota_hero_', '')
    );
    const data = buildChangelogData(diff, {
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

function buildChangelogFor(version, from) {
    const prev = from || previousVersion(version);
    if (!prev) return null;
    return buildChangelogBetween(prev, version);
}

function createPatch(version, from) {
    try {
        return buildChangelogFor(version, from);
    } finally {
        clearSnapshotCache();
    }
}

function createAllPatches() {
    try {
        return listPatchVersions()
            .map((v) => {
                const r = buildChangelogFor(v);
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

function readPublished(version) {
    const file = publishedFile(version);
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

function publishPatch(version, name) {
    const changelog = readPatch(version);
    if (!changelog) return null;

    const data = stripRawValues(JSON.parse(JSON.stringify(changelog)));
    if (name) {
        data.patch_name = name;
    }

    const file = publishedFile(version);
    writeJson(file, data);
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
