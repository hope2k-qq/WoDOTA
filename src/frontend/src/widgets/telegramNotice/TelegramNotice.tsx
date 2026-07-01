import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ReactComponent as TelegramIcon } from "../../assets/icons/TelegramIcon.svg";
import styles from "./telegram_notice.module.scss";

const STORAGE_KEY = "wodota_tg_notice";
const USAGE_THRESHOLD_MS = 2 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TICK_MS = 5000;
const MAX_COUNT = 2;
const DISPLAY_MS = 15000;
const EXIT_MS = 360;
const TG_URL = "https://t.me/wodota_q";

interface NoticeState {
    shownCount: number;
    lastShownAt: number | null;
    usageMs: number;
}

const readState = (): NoticeState => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                shownCount: Number(parsed.shownCount) || 0,
                lastShownAt: parsed.lastShownAt ?? null,
                usageMs: Number(parsed.usageMs) || 0,
            };
        }
    } catch {
        /* empty */
    }
    return { shownCount: 0, lastShownAt: null, usageMs: 0 };
};

const writeState = (state: NoticeState) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        /* empty */
    }
};

const isEligible = (state: NoticeState): boolean => {
    if (state.shownCount >= MAX_COUNT) return false;
    if (state.lastShownAt === null) return true;
    return Date.now() - state.lastShownAt >= WEEK_MS;
};

let sharedCtx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
    try {
        const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        if (!sharedCtx) sharedCtx = new AudioCtx();
        return sharedCtx;
    } catch {
        return null;
    }
};

const unlockAudio = () => {
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
    }
};

const playNoticeSound = () => {
    const ctx = getCtx();
    if (!ctx) return;

    const start = () => {
        const now = ctx.currentTime;

        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(990, now + 0.14);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.4);
    };

    if (ctx.state === "suspended") {
        ctx.resume().then(start).catch(() => {});
    } else {
        start();
    }
};

export const TelegramNotice = () => {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [open, setOpen] = useState(false);
    const stateRef = useRef<NoticeState>(readState());
    const closedRef = useRef(false);
    const autoTimerRef = useRef<number | null>(null);
    const exitTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const handler = () => unlockAudio();
        window.addEventListener("pointerdown", handler, { passive: true });
        window.addEventListener("keydown", handler);
        window.addEventListener("touchstart", handler, { passive: true });
        return () => {
            window.removeEventListener("pointerdown", handler);
            window.removeEventListener("keydown", handler);
            window.removeEventListener("touchstart", handler);
        };
    }, []);

    const requestClose = (amount: number) => {
        if (closedRef.current) return;
        closedRef.current = true;

        const updated: NoticeState = {
            ...stateRef.current,
            shownCount: Math.min(MAX_COUNT, stateRef.current.shownCount + amount),
        };
        stateRef.current = updated;
        writeState(updated);

        if (autoTimerRef.current) {
            clearTimeout(autoTimerRef.current);
            autoTimerRef.current = null;
        }

        setOpen(false);
        exitTimerRef.current = window.setTimeout(() => setVisible(false), EXIT_MS);
    };

    useEffect(() => {
        if (!isEligible(stateRef.current)) return;

        const show = () => {
            const updated: NoticeState = {
                ...stateRef.current,
                lastShownAt: Date.now(),
                usageMs: 0,
            };
            stateRef.current = updated;
            writeState(updated);
            setVisible(true);
            playNoticeSound();

            autoTimerRef.current = window.setTimeout(() => requestClose(1), DISPLAY_MS);
        };

        if (stateRef.current.usageMs >= USAGE_THRESHOLD_MS) {
            const timeout = window.setTimeout(show, 800);
            return () => clearTimeout(timeout);
        }

        const interval = window.setInterval(() => {
            if (document.visibilityState !== "visible") return;

            const usageMs = stateRef.current.usageMs + TICK_MS;
            const next: NoticeState = { ...stateRef.current, usageMs };
            stateRef.current = next;
            writeState(next);

            if (usageMs >= USAGE_THRESHOLD_MS) {
                clearInterval(interval);
                show();
            }
        }, TICK_MS);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!visible) return;
        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setOpen(true));
        });
        return () => {
            cancelAnimationFrame(raf1);
            cancelAnimationFrame(raf2);
        };
    }, [visible]);

    useEffect(() => {
        return () => {
            if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
            if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        };
    }, []);

    if (!visible) return null;

    return (
        <div className={styles.viewport}>
            <div
                className={`${styles.frame} ${open ? styles.open : ""}`}
                role="alert"
            >
                <div className={styles.panel}>
                <div className={styles.header}>
                    <span className={styles.badge}>
                        <TelegramIcon className={styles.badge_icon} />
                    </span>
                    <div className={styles.heading}>
                        <h3 className={styles.title}>{t("tg_notice_title")}</h3>
                        <span className={styles.handle}>@wodota_q</span>
                    </div>
                    <div
                        className={styles.close}
                        onClick={() => requestClose(1)}
                        role="button"
                        aria-label={t("tg_notice_close")}
                    >
                        <img src="/close.svg" alt="close" />
                    </div>
                </div>

                <p className={styles.text}>
                    {t("tg_notice_text")}
                </p>

                <div className={styles.actions}>
                    <a
                        className={styles.subscribe}
                        href={TG_URL}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => requestClose(MAX_COUNT)}
                    >
                        {t("tg_notice_subscribe")}
                    </a>
                    <button
                        type="button"
                        className={styles.decline}
                        onClick={() => requestClose(MAX_COUNT)}
                    >
                        {t("tg_notice_decline")}
                    </button>
                </div>

                <div className={styles.progress}>
                    <span
                        className={styles.progress_fill}
                        style={{ animationDuration: `${DISPLAY_MS}ms` }}
                    />
                </div>
                </div>
            </div>
        </div>
    );
};
