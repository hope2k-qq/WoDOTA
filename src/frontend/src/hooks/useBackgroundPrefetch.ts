import { useEffect } from "react";

const SLOW_TYPES = ["slow-2g", "2g", "3g"];
const ITEM_TIMEOUT = 20000;

const isSlowConnection = (): boolean => {
    const connection = (navigator as any).connection;
    if (!connection) return false;
    if (connection.saveData) return true;
    return SLOW_TYPES.includes(connection.effectiveType);
};

const whenIdle = (fn: () => void): (() => void) => {
    const request = (window as any).requestIdleCallback;

    if (typeof request === "function") {
        const id = request(fn, { timeout: 3000 });
        return () => (window as any).cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(fn, 1000);
    return () => window.clearTimeout(id);
};

const waitForResource = (url: string, signal: AbortSignal): Promise<void> => {
    return new Promise((resolve) => {
        if (signal.aborted || performance.getEntriesByName(url).length > 0) {
            resolve();
            return;
        }

        let observer: PerformanceObserver | null = null;
        let timer = 0;

        const finish = () => {
            observer?.disconnect();
            window.clearTimeout(timer);
            signal.removeEventListener("abort", finish);
            resolve();
        };

        try {
            observer = new PerformanceObserver((list) => {
                if (list.getEntries().some((entry) => entry.name === url)) finish();
            });
            observer.observe({ type: "resource", buffered: true });
        } catch {
            observer = null;
        }

        timer = window.setTimeout(finish, ITEM_TIMEOUT);
        signal.addEventListener("abort", finish, { once: true });
    });
};

export function useBackgroundPrefetch(urls: string[], enabled = true): void {
    useEffect(() => {
        if (!enabled || urls.length === 0 || isSlowConnection()) return;

        let cancelIdle: (() => void) | null = null;
        const controller = new AbortController();

        const run = async () => {
            for (const url of urls) {
                if (controller.signal.aborted) return;

                try {
                    await fetch(url, { mode: "no-cors", signal: controller.signal });
                    await waitForResource(url, controller.signal);
                } catch {
                    if (controller.signal.aborted) return;
                }
            }
        };

        const start = () => {
            cancelIdle = whenIdle(() => {
                if (!controller.signal.aborted) void run();
            });
        };

        if (document.readyState === "complete") {
            start();
        } else {
            window.addEventListener("load", start, { once: true });
        }

        return () => {
            controller.abort();
            cancelIdle?.();
            window.removeEventListener("load", start);
        };
    }, [urls, enabled]);
}
