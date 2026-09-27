const CHECK_TIMEOUT = 4000;
const CACHE_TTL = 60 * 60 * 1000;
const CACHE_LIMIT = 5000;
const MAX_URLS = 5;
const ALLOWED_HOST = 'cdn.wodota.net';

const cache = new Map();

const getCached = (url) => {
    const hit = cache.get(url);
    if (!hit) return null;
    if (Date.now() - hit.at > CACHE_TTL) {
        cache.delete(url);
        return null;
    }
    return hit.missing;
};

const putCached = (url, missing) => {
    if (cache.size >= CACHE_LIMIT) {
        cache.delete(cache.keys().next().value);
    }
    cache.set(url, { at: Date.now(), missing });
};

const isOurCdn = (url) => {
    try {
        return new URL(url).hostname === ALLOWED_HOST;
    } catch {
        return false;
    }
};

const checkOne = async (url) => {
    const cached = getCached(url);
    if (cached !== null) return cached;

    try {
        const response = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(CHECK_TIMEOUT)
        });
        const missing = response.status === 404 || response.status === 403;
        putCached(url, missing);
        return missing;
    } catch {
        return false;
    }
};

const checkAssets = async (urls) => {
    const list = (Array.isArray(urls) ? urls : [])
        .filter((url) => typeof url === 'string' && isOurCdn(url))
        .slice(0, MAX_URLS);

    if (!list.length) return { checked: 0, missing: 0, missingUrls: [] };

    const results = await Promise.all(list.map(async (url) => ({ url, missing: await checkOne(url) })));
    const missingUrls = results.filter((r) => r.missing).map((r) => r.url);

    return { checked: list.length, missing: missingUrls.length, missingUrls };
};

module.exports = { checkAssets };
