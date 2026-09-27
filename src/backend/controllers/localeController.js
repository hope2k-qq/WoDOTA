const { lookupAsn } = require('../utils/asnLookup');
const { getClientIp } = require('../utils/clientIp');

const SUPPORTED = ['ru', 'uk', 'en', 'cs'];
const FALLBACK = 'en';

const COUNTRY_TO_LANG = {
    RU: 'ru',
    UA: 'uk',
    CZ: 'cs',
    BY: 'ru',
    KZ: 'ru'
};

const fromAcceptLanguage = (header = '') => {
    const tags = header
        .split(',')
        .map((part) => part.split(';')[0].trim().split('-')[0].toLowerCase())
        .filter(Boolean);

    return tags.find((tag) => SUPPORTED.includes(tag)) || null;
};

exports.detectLanguage = async (req, res) => {
    const ip = getClientIp(req);

    let country = '';
    try {
        const net = await lookupAsn(ip);
        country = net.country || '';
    } catch {
        country = '';
    }

    const byCountry = COUNTRY_TO_LANG[country] || null;
    const byHeader = fromAcceptLanguage(req.headers['accept-language']);

    res.set('Cache-Control', 'no-store');
    res.json({
        lang: byCountry || byHeader || FALLBACK,
        country: country || null,
        source: byCountry ? 'country' : byHeader ? 'header' : 'fallback'
    });
};
