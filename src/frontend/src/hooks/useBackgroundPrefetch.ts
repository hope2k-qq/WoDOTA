import { useEffect } from "react";

const SLOW_TYPES = ["slow-2g", "2g", "3g"];

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

export function useBackgroundPrefetch(urls: string[], enabled = true): void {
    useEffect(() => {
        if (!enabled || urls.length === 0 || isSlowConnection()) return;

        let cancelled = false;
        let cancelIdle: (() => void) | null = null;
        const links: HTMLLinkElement[] = [];

        const run = () => {
            for (const url of urls) {
                if (cancelled) return;

                const link = document.createElement("link");
                link.rel = "prefetch";
                link.href = url;
                document.head.appendChild(link);
                links.push(link);
            }
        };

        const start = () => {
            cancelIdle = whenIdle(() => {
                if (!cancelled) run();
            });
        };

        if (document.readyState === "complete") {
            start();
        } else {
            window.addEventListener("load", start, { once: true });
        }

        return () => {
            cancelled = true;
            cancelIdle?.();
            window.removeEventListener("load", start);
            links.forEach(link => link.remove());
        };
    }, [urls, enabled]);
}
