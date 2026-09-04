function isPlainObject(x) {
    return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function deepDiff(a, b) {
    if (isPlainObject(a) && isPlainObject(b)) {
        const added = {};
        const removed = {};
        const changed = {};

        for (const k of Object.keys(b)) {
            if (!(k in a)) added[k] = b[k];
        }
        for (const k of Object.keys(a)) {
            if (!(k in b)) removed[k] = a[k];
        }
        for (const k of Object.keys(a)) {
            if (k in b) {
                const d = deepDiff(a[k], b[k]);
                if (d !== undefined) changed[k] = d;
            }
        }

        const res = {};
        if (Object.keys(added).length) res.added = added;
        if (Object.keys(removed).length) res.removed = removed;
        if (Object.keys(changed).length) res.changed = changed;
        return Object.keys(res).length ? res : undefined;
    }
    
    if (JSON.stringify(a) === JSON.stringify(b)) return undefined;
    return { old: a, new: b };
}

function countChanges(diff) {
    if (diff === undefined) return 0;
    if ('old' in diff && 'new' in diff && Object.keys(diff).length === 2) return 1;

    let total = 0;
    if (diff.added) total += leafCount(diff.added);
    if (diff.removed) total += leafCount(diff.removed);
    if (diff.changed) {
        for (const k of Object.keys(diff.changed)) total += countChanges(diff.changed[k]);
    }
    return total;
}

function leafCount(value) {
    if (!isPlainObject(value)) return 1;
    let total = 0;
    for (const k of Object.keys(value)) total += leafCount(value[k]);
    return total;
}

const SECTIONS = ['items', 'abilities', 'heroes', 'localization', 'talents', 'units'];

function diffSnapshots(oldSnap, newSnap) {
    const sections = {};
    const summary = {};

    for (const section of SECTIONS) {
        const d = deepDiff(oldSnap[section] || {}, newSnap[section] || {});
        sections[section] = d || {};
        summary[section] = countChanges(d);
    }

    return {
        from: oldSnap.version,
        to: newSnap.version,
        generatedAt: new Date().toISOString(),
        summary,
        sections,
    };
}

module.exports = { diffSnapshots, deepDiff };
