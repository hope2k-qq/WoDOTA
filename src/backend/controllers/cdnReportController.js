const { lookupAsn } = require('../utils/asnLookup');

const MAX_BODY = 8 * 1024;
const RATE_WINDOW = 60 * 1000;
const RATE_LIMIT = 10;
const VERDICTS = ['cdn_ok_on_retry', 'instant_fail', 'timeout'];

const rateBuckets = new Map();

const getClientIp = (req) => {
    const forwarded = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = forwarded || req.ip || '';
    return ip.replace(/^::ffff:/, '');
};

const isRateLimited = (ip) => {
    const now = Date.now();
    const bucket = rateBuckets.get(ip);

    if (!bucket || now - bucket.start > RATE_WINDOW) {
        rateBuckets.set(ip, { start: now, count: 1 });
        if (rateBuckets.size > 10000) rateBuckets.clear();
        return false;
    }

    bucket.count += 1;
    return bucket.count > RATE_LIMIT;
};

const parseBrowser = (ua = '') => {
    const pairs = [
        [/YaBrowser\/(\d+)/, 'Yandex'],
        [/OPR\/(\d+)/, 'Opera'],
        [/Edg\/(\d+)/, 'Edge'],
        [/Firefox\/(\d+)/, 'Firefox'],
        [/Chrome\/(\d+)/, 'Chrome'],
        [/Version\/(\d+).*Safari/, 'Safari']
    ];

    for (const [re, name] of pairs) {
        const m = ua.match(re);
        if (m) return `${name} ${m[1]}`;
    }
    return 'unknown';
};

const parsePlatform = (ua = '') => {
    if (/Android/i.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Windows/i.test(ua)) return 'windows';
    if (/Mac OS X/i.test(ua)) return 'mac';
    if (/Linux/i.test(ua)) return 'linux';
    return 'other';
};

const num = (value) => (typeof value === 'number' && isFinite(value) ? value : null);

const createReport = async (req, res) => {
    let body = req.body;

    try {
        if (Buffer.isBuffer(body)) body = body.toString('utf8');
        if (typeof body === 'string') {
            if (body.length > MAX_BODY) return res.status(413).end();
            body = JSON.parse(body);
        }
    } catch {
        return res.status(400).end();
    }

    if (!body || typeof body !== 'object') return res.status(400).end();
    if (!VERDICTS.includes(body.verdict)) return res.status(400).end();

    const ip = getClientIp(req);
    if (isRateLimited(ip)) return res.status(429).end();

    const collection = req.app.locals.cdn_reports;
    if (!collection) return res.status(503).end();

    try {
        const net = await lookupAsn(ip);
        const ua = String(body.ua || '');
        const conn = body.conn || {};

        await collection.insertOne({
            ts: new Date(),
            verdict: body.verdict,
            failed: num(body.failed) || 0,
            firstUrl: String(body.firstUrl || '').slice(0, 300),
            controlOk: !!(body.control && body.control.ok),
            controlMs: num(body.control && body.control.ms),
            cdnOk: !!(body.cdn && body.cdn.ok),
            cdnMs: num(body.cdn && body.cdn.ms),
            navProto: String(body.navProto || ''),
            cdnProto: String(body.cdnProto || ''),
            connType: String(conn.type || ''),
            effectiveType: String(conn.effectiveType || ''),
            rtt: num(conn.rtt),
            downlink: num(conn.downlink),
            saveData: !!conn.saveData,
            browser: parseBrowser(ua),
            platform: parsePlatform(ua),
            lang: String(body.lang || '').slice(0, 16),
            page: String(body.page || '').slice(0, 120),
            asn: net.asn,
            provider: net.name,
            country: net.country
        });

        return res.status(204).end();
    } catch (error) {
        console.error('cdn-report insert failed:', error.message);
        return res.status(500).end();
    }
};

const tally = (docs, keyFn) => {
    const counts = {};
    for (const doc of docs) {
        const key = keyFn(doc) || '(пусто)';
        counts[key] = (counts[key] || 0) + 1;
    }
    return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
};

const buildStats = (docs) => {
    const providers = {};

    for (const doc of docs) {
        const key = `${doc.asn || '?'}|${doc.provider || ''}|${doc.country || ''}`;
        if (!providers[key]) {
            providers[key] = {
                asn: doc.asn || '?',
                provider: doc.provider || '',
                country: doc.country || '',
                count: 0,
                mobile: 0,
                verdicts: {}
            };
        }
        const entry = providers[key];
        entry.count += 1;
        if (doc.connType === 'cellular' || doc.platform === 'android' || doc.platform === 'ios') {
            entry.mobile += 1;
        }
        entry.verdicts[doc.verdict] = (entry.verdicts[doc.verdict] || 0) + 1;
    }

    return {
        total: docs.length,
        byProvider: Object.values(providers).sort((a, b) => b.count - a.count).slice(0, 40),
        byVerdict: tally(docs, (d) => d.verdict),
        byCountry: tally(docs, (d) => d.country),
        byConnection: tally(docs, (d) => d.connType || d.effectiveType),
        byPlatform: tally(docs, (d) => d.platform),
        byBrowser: tally(docs, (d) => d.browser),
        byCdnProtocol: tally(docs, (d) => d.cdnProto),
        byNavProtocol: tally(docs, (d) => d.navProto)
    };
};

const VERDICT_HINTS = {
    cdn_ok_on_retry: 'хост доступен при повторной пробе — не блокировка, а сбой соединения (главный подозреваемый QUIC/HTTP-3)',
    instant_fail: 'мгновенный отказ — DNS не резолвится либо режет блокировщик или антивирус',
    timeout: 'запрос уходит в никуда — блокировка по IP или DPI у провайдера'
};

const CONTROL_IP = '91.238.111.225';

const buildSelfCheck = async (req) => {
    const ip = getClientIp(req);
    const [mine, control] = await Promise.all([lookupAsn(ip), lookupAsn(CONTROL_IP)]);

    let diagnosis;
    if (!control.asn) {
        diagnosis = 'DNS с сервера не работает: резолв не прошёл даже для контрольного адреса. Проверь исходящий UDP 53 на VPS.';
    } else if (ip === '127.0.0.1' || ip === '::1' || !ip) {
        diagnosis = 'nginx не передаёт реальный IP. Добавь в конфиг proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;';
    } else if (!mine.asn) {
        diagnosis = `Контрольный адрес резолвится, а ${ip} — нет. Возможно это серый или необъявленный адрес.`;
    } else {
        diagnosis = 'Резолв работает.';
    }

    return { ip, mine, control, diagnosis };
};

const renderHtml = (stats, hours, selfCheck) => {
    const rows = stats.byProvider
        .map((p) => `<tr><td>${p.asn}</td><td>${p.provider || '—'}</td><td>${p.country || '—'}</td>` +
            `<td class="n">${p.count}</td><td class="n">${p.mobile}</td>` +
            `<td>${Object.entries(p.verdicts).map(([k, v]) => `${k}: ${v}`).join('<br>')}</td></tr>`)
        .join('');

    const block = (title, obj) => `<h2>${title}</h2><ul>` +
        Object.entries(obj).map(([k, v]) => `<li><b>${k}</b> — ${v}</li>`).join('') + '</ul>';

    const hints = Object.entries(stats.byVerdict)
        .map(([k, v]) => `<li><b>${k}</b> — ${v}<br><span class="hint">${VERDICT_HINTS[k] || ''}</span></li>`)
        .join('');

    return `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CDN reports</title><style>
body{font:14px/1.5 system-ui,sans-serif;background:#12141c;color:#e6e8ef;margin:0;padding:20px}
h1{font-size:20px} h2{font-size:15px;margin:22px 0 6px;color:#9aa3b8;text-transform:uppercase;letter-spacing:.05em}
table{border-collapse:collapse;width:100%;margin-top:8px} td,th{border-bottom:1px solid #262b39;padding:7px 8px;text-align:left;vertical-align:top}
th{color:#9aa3b8;font-weight:600} .n{text-align:right;font-variant-numeric:tabular-nums}
ul{list-style:none;padding:0;margin:0} li{padding:3px 0;border-bottom:1px solid #1c2030}
.hint{color:#8b93a7} .total{font-size:28px;font-weight:700}
</style></head><body>
<h1>Отчёты о недоступности CDN — за ${hours} ч</h1>
<div class="total">${stats.total}</div>
<h2>Самодиагностика резолва</h2>
<ul>
<li><b>твой IP для сервера</b> — ${selfCheck.ip || '(не определён)'}</li>
<li><b>твой ASN</b> — ${selfCheck.mine.asn || '—'} ${selfCheck.mine.name || ''} ${selfCheck.mine.country || ''}</li>
<li><b>контрольный ${CONTROL_IP}</b> — ${selfCheck.control.asn || '—'} ${selfCheck.control.name || ''}</li>
<li><span class="hint">${selfCheck.diagnosis}</span></li>
</ul>
<h2>Провайдеры</h2>
<table><tr><th>ASN</th><th>Провайдер</th><th>Страна</th><th class="n">Всего</th><th class="n">Моб.</th><th>Вердикты</th></tr>${rows}</table>
<h2>Вердикты</h2><ul>${hints}</ul>
${block('Страны', stats.byCountry)}
${block('Тип соединения', stats.byConnection)}
${block('Платформы', stats.byPlatform)}
${block('Браузеры', stats.byBrowser)}
${block('Протокол до CDN', stats.byCdnProtocol)}
${block('Протокол до сайта', stats.byNavProtocol)}
</body></html>`;
};

const getStats = async (req, res) => {
    const collection = req.app.locals.cdn_reports;
    if (!collection) return res.status(503).json({ error: 'collection is not ready' });

    const hours = Math.min(Math.max(parseInt(req.query.hours, 10) || 24, 1), 720);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
        const docs = await collection.find({ ts: { $gte: since } }).limit(50000).toArray();
        const stats = buildStats(docs);
        const selfCheck = await buildSelfCheck(req);

        if (req.query.format === 'json') {
            return res.json({ hours, selfCheck, ...stats });
        }

        res.set('Content-Type', 'text/html; charset=utf-8');
        return res.send(renderHtml(stats, hours, selfCheck));
    } catch (error) {
        console.error('cdn-report stats failed:', error.message);
        return res.status(500).json({ error: 'Failed to build stats' });
    }
};

module.exports = { createReport, getStats };
