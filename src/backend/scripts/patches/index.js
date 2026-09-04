#!/usr/bin/env node
// CLI для работы с патчами (генерация файлов). Ту же логику эндпоинты
// используют через services/patchesService.js.
//
// Структура папки патча:
//   assets/patches/<версия>/source/   сырые файлы (npc_*.txt, *.lua, ...)
//   assets/patches/<версия>/result/   готовые файлы (snapshot.json, changelog.json/.md)
//
// Команды:
//   node scripts/patches/index.js list                     список патчей (по порядку)
//   node scripts/patches/index.js build <версия>           snapshot.json в result/
//   node scripts/patches/index.js build-all
//   node scripts/patches/index.js compare <from> <to>      changes.json в result/ версии to
//   node scripts/patches/index.js changelog <версия> [from]  changelog.json/.md (from по умолчанию — предыдущий)
//   node scripts/patches/index.js changelog-all
//   node scripts/patches/index.js publish <версия> [название]  published.json (публичная копия без сырых значений)
//   node scripts/patches/index.js publish-all                  publish каждому, у кого ещё нет published.json

const fs = require('fs');
const path = require('path');
const { buildSnapshot } = require('./buildSnapshot');
const { diffSnapshots } = require('./diffSnapshots');
const { renderMarkdown } = require('./renderChangelog');
const {
    sourceDir,
    resultDir,
    listPatchVersions,
    hasPatch,
    previousVersion,
} = require('./versions');
const patchesService = require('../../services/patchesService');

function writeJson(file, data) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function build(version) {
    if (!hasPatch(version)) throw new Error(`Патч ${version} не найден`);
    const snapshot = buildSnapshot(sourceDir(version), version);
    writeJson(path.join(resultDir(version), 'snapshot.json'), snapshot);
    console.log(
        `[build ${version}] items=${snapshot.counts.items} abilities=${snapshot.counts.abilities} heroes=${snapshot.counts.heroes} talents=${snapshot.counts.talents}`
    );
    return snapshot;
}

function compare(from, to) {
    const diff = diffSnapshots(
        buildSnapshot(sourceDir(from), from),
        buildSnapshot(sourceDir(to), to)
    );
    writeJson(path.join(resultDir(to), 'changes.json'), diff);
    console.log(`[compare ${from} -> ${to}] -> ${to}/result/changes.json`);
    return diff;
}

// Делегируем сборку сервису (пишет result/draft.json, сеет changelog.json если
// его нет, чистит кэш). Дополнительно рендерим draft.md рядом для чтения.
function changelog(to, from) {
    const base = from || previousVersion(to);
    if (!base) {
        console.log(`[changelog] ${to} — первый патч, сравнивать не с чем`);
        return null;
    }
    const { data, seeded } = patchesService.createPatch(to, from);
    fs.writeFileSync(path.join(resultDir(to), 'draft.md'), renderMarkdown(data), 'utf-8');
    const abilityCount = data.heroes.reduce((total, hero) => total + hero.abilities.length, 0);
    const talentCount = data.heroes.reduce(
        (total, hero) => total + Object.values(hero.talents).reduce((sum, category) => sum + category.length, 0),
        0
    );
    console.log(
        `[changelog ${base} -> ${to}] героев=${data.heroes.length} способностей=${abilityCount} талантов=${talentCount} -> ${to}/result/draft.(json|md)` +
            (seeded ? ' + засеян changelog.json (нужна вычитка)' : ' (changelog.json не тронут)')
    );
    return data;
}

// Публичная копия changelog.json без сырых значений (?name -> patch_name).
function publish(version, name) {
    const result = patchesService.publishPatch(version, name);
    if (!result) {
        console.log(`[publish ${version}] нет changelog.json — сначала changelog ${version}`);
        return null;
    }
    console.log(
        `[publish ${version}] -> ${version}/result/published.json` + (name ? ` (название: ${name})` : '')
    );
    return result;
}

// Публикует каждый патч, у кого ещё НЕТ published.json (ручные названия не затираем).
function publishAll() {
    const already = new Set(patchesService.listPublishedVersions());
    for (const v of listPatchVersions()) {
        if (already.has(v)) {
            console.log(`[publish ${v}] уже опубликован — пропуск`);
            continue;
        }
        publish(v);
    }
}

function main() {
    const [cmd, a, b] = process.argv.slice(2);

    switch (cmd) {
        case 'list':
            console.log('Патчи (по порядку):', listPatchVersions().join(' < ') || '(нет)');
            break;
        case 'build':
            if (!a) throw new Error('Укажите версию: build <версия>');
            build(a);
            break;
        case 'build-all':
            for (const v of listPatchVersions()) build(v);
            break;
        case 'compare':
            if (!a || !b) throw new Error('Укажите версии: compare <from> <to>');
            compare(a, b);
            break;
        case 'changelog':
            if (!a) throw new Error('Укажите версию: changelog <версия> [from]');
            if (!hasPatch(a)) throw new Error(`Патч ${a} не найден`);
            changelog(a, b);
            break;
        case 'changelog-all':
            for (const v of listPatchVersions()) changelog(v);
            break;
        case 'publish':
            if (!a) throw new Error('Укажите версию: publish <версия> [название]');
            if (!hasPatch(a)) throw new Error(`Патч ${a} не найден`);
            publish(a, b);
            break;
        case 'publish-all':
            publishAll();
            break;
        default:
            console.log(
                'Команды: list | build <версия> | build-all | compare <from> <to> | changelog <версия> [from] | changelog-all | publish <версия> [название] | publish-all'
            );
    }
}

try {
    main();
} catch (err) {
    console.error('Ошибка:', err.message);
    process.exit(1);
}
