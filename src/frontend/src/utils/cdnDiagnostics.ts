const API_URL = process.env.REACT_APP_API_URL;

const CDN_ORIGIN = 'https://cdn.wodota.net';
const CDN_PROBE = `${CDN_ORIGIN}/abilities/innate_icon_small.png`;
const CONTROL_PROBE = '/wd.png';

const PROBE_TIMEOUT = 5000;
const COLLECT_DELAY = 3500;
const INSTANT_FAIL_MS = 150;
const MASS_FAILURE_MIN = 8;

const RETRY_DELAYS = [600, 2000];
const RETRY_FAIL_LIMIT = 20;
const TRACKED_LIMIT = 200;

const SESSION_KEY = 'cdnDiagSent';

type ProbeResult = { ok: boolean; ms: number };

type Verdict = 'cdn_ok_on_retry' | 'instant_fail' | 'timeout';

type RetryState = { src: string; attempt: number };

let scheduled = false;
let failedCount = 0;
let firstFailedUrl = '';
let pageAtFirstError = '';

let retryOk = 0;
let retryFail = 0;
let retryFailures = 0;

const retryState = new WeakMap<HTMLImageElement, RetryState>();
const trackedElements: HTMLElement[] = [];

const safeSession = {
    get(key: string): string | null {
        try {
            return window.sessionStorage.getItem(key);
        } catch {
            return null;
        }
    },
    set(key: string, value: string): void {
        try {
            window.sessionStorage.setItem(key, value);
        } catch {
            return;
        }
    }
};

const probeImage = (url: string): Promise<ProbeResult> => {
    return new Promise((resolve) => {
        const started = performance.now();
        const img = new Image();
        let done = false;

        const finish = (ok: boolean) => {
            if (done) return;
            done = true;
            img.onload = null;
            img.onerror = null;
            resolve({ ok, ms: Math.round(performance.now() - started) });
        };

        const timer = window.setTimeout(() => finish(false), PROBE_TIMEOUT);

        img.onload = () => {
            window.clearTimeout(timer);
            finish(true);
        };
        img.onerror = () => {
            window.clearTimeout(timer);
            finish(false);
        };

        const separator = url.includes('?') ? '&' : '?';
        img.src = `${url}${separator}probe=${Date.now()}`;
    });
};

const recover = (img: HTMLImageElement): void => {
    if (retryFailures >= RETRY_FAIL_LIMIT) return;

    const state = retryState.get(img) || { src: img.src, attempt: 0 };

    if (state.attempt >= RETRY_DELAYS.length) {
        retryFail += 1;
        return;
    }

    const delay = RETRY_DELAYS[state.attempt];
    state.attempt += 1;
    retryState.set(img, state);

    window.setTimeout(() => {
        if (!document.contains(img)) return;

        img.addEventListener('load', () => {
            retryOk += 1;
        }, { once: true });

        const separator = state.src.includes('?') ? '&' : '?';
        img.src = `${state.src}${separator}r=${state.attempt}`;
    }, delay);
};

const countStillBroken = (): number => {
    return trackedElements.filter((el) => {
        if (!document.contains(el)) return false;
        if (el instanceof HTMLImageElement) return el.naturalWidth === 0;
        return true;
    }).length;
};

const getProtocol = (urlPrefix: string): string => {
    try {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const entry = entries.filter((e) => e.name.startsWith(urlPrefix)).pop();
        return entry?.nextHopProtocol || '';
    } catch {
        return '';
    }
};

const getNavigationProtocol = (): string => {
    try {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return nav?.nextHopProtocol || '';
    } catch {
        return '';
    }
};

const getConnection = () => {
    const c = (navigator as any).connection;
    if (!c) return null;
    return {
        type: c.type || '',
        effectiveType: c.effectiveType || '',
        downlink: c.downlink ?? null,
        rtt: c.rtt ?? null,
        saveData: !!c.saveData
    };
};

const send = (payload: unknown): void => {
    if (!API_URL) return;

    const url = `${API_URL}/cdn-report`;
    const body = new Blob([JSON.stringify(payload)], { type: 'text/plain;charset=UTF-8' });

    let sent = false;
    try {
        sent = !!(navigator.sendBeacon && navigator.sendBeacon(url, body));
    } catch {
        sent = false;
    }
    if (sent) return;

    try {
        fetch(url, { method: 'POST', body, keepalive: true }).catch(() => undefined);
    } catch {
        return;
    }
};

const runDiagnostics = async (): Promise<void> => {
    const control = await probeImage(CONTROL_PROBE);
    if (!control.ok) return;

    const cdn = await probeImage(CDN_PROBE);

    if (cdn.ok && failedCount < MASS_FAILURE_MIN) return;

    let verdict: Verdict;
    if (cdn.ok) {
        verdict = 'cdn_ok_on_retry';
    } else if (cdn.ms < INSTANT_FAIL_MS) {
        verdict = 'instant_fail';
    } else {
        verdict = 'timeout';
    }

    safeSession.set(SESSION_KEY, '1');

    send({
        v: 2,
        verdict,
        failed: failedCount,
        firstUrl: firstFailedUrl.slice(0, 300),
        retryOk,
        retryFail,
        stillBroken: countStillBroken(),
        routeChanged: pageAtFirstError !== window.location.pathname,
        visibility: document.visibilityState,
        control,
        cdn,
        navProto: getNavigationProtocol(),
        cdnProto: getProtocol(CDN_ORIGIN),
        conn: getConnection(),
        ua: navigator.userAgent.slice(0, 300),
        lang: navigator.language || '',
        page: window.location.pathname.slice(0, 120),
        screen: `${window.screen.width}x${window.screen.height}`,
        ts: Date.now()
    });
};

const onResourceError = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const tag = target.tagName;
    if (tag !== 'IMG' && tag !== 'VIDEO' && tag !== 'SOURCE') return;

    const src = (target as HTMLImageElement).currentSrc || (target as HTMLImageElement).src || '';
    if (!src.startsWith(CDN_ORIGIN)) return;

    const isImage = target instanceof HTMLImageElement;
    const isRetry = isImage && retryState.has(target);

    if (isRetry) {
        retryFailures += 1;
    } else {
        failedCount += 1;
        if (!firstFailedUrl) {
            firstFailedUrl = src;
            pageAtFirstError = window.location.pathname;
        }
        if (trackedElements.length < TRACKED_LIMIT) trackedElements.push(target);
    }

    if (isImage) recover(target);

    if (scheduled) return;
    if (safeSession.get(SESSION_KEY)) return;

    scheduled = true;

    window.setTimeout(() => {
        runDiagnostics()
            .catch(() => undefined)
            .finally(() => {
                scheduled = false;
            });
    }, COLLECT_DELAY);
};

export const initCdnDiagnostics = (): (() => void) => {
    window.addEventListener('error', onResourceError, true);
    return () => window.removeEventListener('error', onResourceError, true);
};
