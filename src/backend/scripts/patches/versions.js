const fs = require('fs');
const path = require('path');

const PATCHES_DIR = path.join(__dirname, '..', '..', 'assets', 'patches');

const SOURCE_SUBDIR = 'source';
const RESULT_SUBDIR = 'result';

const patchDir = (version) => path.join(PATCHES_DIR, version);
const sourceDir = (version) => path.join(PATCHES_DIR, version, SOURCE_SUBDIR);
const resultDir = (version) => path.join(PATCHES_DIR, version, RESULT_SUBDIR);
const draftFile = (version) => path.join(resultDir(version), 'draft.json');
const changelogFile = (version) => path.join(resultDir(version), 'changelog.json');
const publishedFile = (version) => path.join(resultDir(version), 'published.json');
const publishedLangFile = (version, lang) => path.join(resultDir(version), `published.${lang}.json`);
const skippedFile = (version) => path.join(resultDir(version), 'skipped.json');

function parseVersion(v) {
    const m = /^(\d+)\.(\d+)([a-z]*)$/.exec(String(v).trim());
    if (!m) return null;
    return { major: +m[1], minor: +m[2], letter: m[3] || '' };
}

function compareVersions(a, b) {
    const pa = parseVersion(a);
    const pb = parseVersion(b);
    if (!pa || !pb) return String(a).localeCompare(String(b));
    if (pa.major !== pb.major) return pa.major - pb.major;
    if (pa.minor !== pb.minor) return pa.minor - pb.minor;
    if (pa.letter < pb.letter) return -1;
    if (pa.letter > pb.letter) return 1;
    return 0;
}

function listPatchVersions() {
    if (!fs.existsSync(PATCHES_DIR)) return [];
    return fs
        .readdirSync(PATCHES_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && parseVersion(d.name))
        .map((d) => d.name)
        .sort(compareVersions);
}

function hasPatch(version) {
    return listPatchVersions().includes(version);
}

function previousVersion(version) {
    const all = listPatchVersions();
    const i = all.indexOf(version);
    return i > 0 ? all[i - 1] : null;
}

module.exports = {
    PATCHES_DIR,
    patchDir,
    sourceDir,
    resultDir,
    draftFile,
    changelogFile,
    publishedFile,
    publishedLangFile,
    skippedFile,
    parseVersion,
    compareVersions,
    listPatchVersions,
    hasPatch,
    previousVersion,
};
