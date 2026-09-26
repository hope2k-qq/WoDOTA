const dnsModule = require('dns');
const dns = dnsModule.promises;

const publicResolver = new dnsModule.promises.Resolver();
publicResolver.setServers(['8.8.8.8', '1.1.1.1']);

const LOOKUP_TIMEOUT = 2500;
const CACHE_TTL = 24 * 60 * 60 * 1000;
const CACHE_LIMIT = 5000;

const cache = new Map();

const resolveTxt = async (name) => {
    try {
        return await publicResolver.resolveTxt(name);
    } catch {
        return await dns.resolveTxt(name);
    }
};

const withTimeout = (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('dns timeout')), ms))
    ]);
};

const isIPv4 = (ip) => /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);

const buildV4Query = (ip) => `${ip.split('.').reverse().join('.')}.origin.asn.cymru.com`;

const buildV6Query = (ip) => {
    const parts = ip.split('::');
    const head = (parts[0] || '').split(':').filter(Boolean);
    const tail = (parts[1] || '').split(':').filter(Boolean);
    const fill = new Array(8 - head.length - tail.length).fill('0');
    const groups = [...head, ...fill, ...tail].map((g) => g.padStart(4, '0'));
    const nibbles = groups.join('').split('').reverse().join('.');
    return `${nibbles}.origin6.asn.cymru.com`;
};

const firstRecord = (records) => {
    if (!records || !records.length) return '';
    const flat = records[0];
    return Array.isArray(flat) ? flat.join('') : String(flat);
};

const getFromCache = (ip) => {
    const hit = cache.get(ip);
    if (!hit) return null;
    if (Date.now() - hit.at > CACHE_TTL) {
        cache.delete(ip);
        return null;
    }
    return hit.value;
};

const putInCache = (ip, value) => {
    if (cache.size >= CACHE_LIMIT) {
        const oldest = cache.keys().next().value;
        cache.delete(oldest);
    }
    cache.set(ip, { at: Date.now(), value });
};

const lookupAsName = async (asn) => {
    try {
        const records = await withTimeout(resolveTxt(`AS${asn}.asn.cymru.com`), LOOKUP_TIMEOUT);
        const parts = firstRecord(records).split('|').map((p) => p.trim());
        return parts[4] || '';
    } catch {
        return '';
    }
};

const lookupAsn = async (ip) => {
    const unknown = { asn: '', name: '', country: '' };

    if (!ip) return unknown;

    const cached = getFromCache(ip);
    if (cached) return cached;

    try {
        const query = isIPv4(ip) ? buildV4Query(ip) : buildV6Query(ip);
        const records = await withTimeout(resolveTxt(query), LOOKUP_TIMEOUT);

        const parts = firstRecord(records).split('|').map((p) => p.trim());
        const asn = (parts[0] || '').split(/\s+/)[0];
        const country = parts[2] || '';

        if (!asn) {
            putInCache(ip, unknown);
            return unknown;
        }

        const value = { asn: `AS${asn}`, name: await lookupAsName(asn), country };
        putInCache(ip, value);
        return value;
    } catch {
        putInCache(ip, unknown);
        return unknown;
    }
};

module.exports = { lookupAsn };
