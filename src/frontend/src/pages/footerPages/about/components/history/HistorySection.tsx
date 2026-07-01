import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TIMELINE_PATH_D, historyTimeline } from "./history.constants";
import type { HistoryItem } from "../../../../../types/about";
import styles from "./about_history.module.scss";
import common from "../about_common.module.scss";

const getDaysAgo = (date: string) => {
    const start = new Date(`${date}T00:00:00`);
    const now = new Date();
    const diff = now.getTime() - start.getTime();

    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

export const HistorySection = () => {
    const { t } = useTranslation();
    const pathRef = useRef<SVGPathElement | null>(null);
    const runnerRef = useRef<SVGGElement | null>(null);
    const totalLengthRef = useRef(0);
    const currentLengthRef = useRef(0);
    const targetLengthRef = useRef(0);
    const pointsRef = useRef<{ x: number; y: number }[]>([]);
    const animationRef = useRef<number | null>(null);
    const [activeHistoryIndex, setActiveHistoryIndex] = useState(0);
    const [timelineReady, setTimelineReady] = useState(false);
    const historyItems = useMemo<HistoryItem[]>(
        () =>
            historyTimeline.map((item, index) => ({
                ...item,
                year: t(`about_history${index + 1}_year`),
                title: t(`about_history${index + 1}_title`),
                text: t(`about_history${index + 1}_text`),
            })),
        [t]
    );

    const activeHistory = useMemo(
        () => historyItems[activeHistoryIndex],
        [historyItems, activeHistoryIndex]
    );

    const activeHistoryMeta = useMemo(() => {
        if (activeHistory.isCurrent) {
            return t("about_history_future");
        }

        if (!activeHistory.date) {
            return "";
        }

        return `${getDaysAgo(activeHistory.date)} ${t("about_history_days_ago")}`;
    }, [activeHistory, t]);

    useEffect(() => {
        const path = pathRef.current;
        if (!path) return;

        const total = path.getTotalLength();
        const start = total * historyTimeline[0].progress;

        totalLengthRef.current = total;
        currentLengthRef.current = start;
        targetLengthRef.current = start;
        pointsRef.current = historyTimeline.map((item) =>
            path.getPointAtLength(total * item.progress)
        );

        const setRunnerPosition = (length: number) => {
            const node = runnerRef.current;
            if (!node) return;

            const point = path.getPointAtLength(length);
            const nextPoint = path.getPointAtLength(Math.min(length + 2, total));
            const angle =
                (Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180) /
                Math.PI;

            node.style.transform = `translate(${point.x}px, ${point.y}px) rotate(${angle}deg)`;
        };

        const animate = () => {
            const current = currentLengthRef.current;
            const target = targetLengthRef.current;
            const next = current + (target - current) * 0.01;

            currentLengthRef.current = Math.abs(target - next) < 0.2 ? target : next;
            setRunnerPosition(currentLengthRef.current);
            animationRef.current = requestAnimationFrame(animate);
        };

        setRunnerPosition(start);
        setTimelineReady(true);
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const handleHistoryClick = (index: number) => {
        setActiveHistoryIndex(index);
        targetLengthRef.current = totalLengthRef.current * historyTimeline[index].progress;
    };

    return (
        <section className={common.section}>
            <div className={common.header}>
                <p className={common.eyebrow}>{t("about_history_eyebrow")}</p>
                <h2>{t("about_history_title")}</h2>
                <p>{t("about_history_subtitle")}</p>
            </div>

            <div className={styles.timeline_history}>
                <div className={styles.timeline_canvas}>
                    <svg
                        className={styles.timeline_svg}
                        viewBox="0 0 1160 560"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <text className={styles.timeline_history_mark} x="580" y="80">
                            WoDOTA HISTORY
                        </text>
                        <g transform="translate(0 34)">
                            <g className={styles.timeline_decor}>
                                <path d="M70 120 H1090" />
                                <path d="M70 280 H1090" />
                                <path d="M70 440 H1090" />
                                <path d="M190 86 V478" />
                                <path d="M520 86 V478" />
                                <path d="M850 86 V478" />
                                <circle cx="190" cy="120" r="5" />
                                <circle cx="520" cy="280" r="5" />
                                <circle cx="850" cy="440" r="5" />
                                <circle cx="1090" cy="280" r="5" />
                            </g>
                            <path
                                className={styles.timeline_shadow}
                                d={TIMELINE_PATH_D}
                                fill="none"
                            />
                            <path
                                ref={pathRef}
                                className={styles.timeline_path}
                                d={TIMELINE_PATH_D}
                                fill="none"
                            />

                            {timelineReady &&
                                historyItems.map((item, index) => {
                                    const point = pointsRef.current[index];
                                    if (!point) return null;

                                    return (
                                        <g
                                            key={item.year}
                                            className={styles.timeline_point}
                                            onClick={() => handleHistoryClick(index)}
                                        >
                                            <circle
                                                cx={point.x}
                                                cy={point.y}
                                                r={activeHistoryIndex === index ? 20 : 15}
                                                className={
                                                    activeHistoryIndex === index
                                                        ? styles.timeline_dot_active
                                                        : styles.timeline_dot
                                                }
                                            />
                                            <text
                                                x={point.x}
                                                y={point.y - 36}
                                                textAnchor="middle"
                                            >
                                                {item.year}
                                            </text>
                                        </g>
                                    );
                                })}

                            <g ref={runnerRef} className={styles.timeline_runner}>
                                <circle r="22" />
                                <image href="/favicon.ico" x="-15" y="-15" width="30" height="30" />
                            </g>
                        </g>
                    </svg>
                </div>

                <article className={styles.history_card}>
                    <div className={styles.history_card_container}>
                        <span>{activeHistory.year}</span>
                        <h3>{activeHistory.title}</h3>
                        <p>{activeHistory.text}</p>
                    </div>
                    <div className={styles.history_meta}>{activeHistoryMeta}</div>
                </article>
            </div>
        </section>
    );
};
