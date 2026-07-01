import type { HistoryTimelineItem } from "../../../../../types/about";

export const TIMELINE_PATH_D = "M90 420 C210 210 360 610 520 390 S790 120 1070 285";

export const historyTimeline: HistoryTimelineItem[] = [
    { progress: 0.1, date: "2024-04-01" },
    { progress: 0.34, date: "2024-05-12" },
    { progress: 0.58, date: "2025-03-12" },
    { progress: 0.84, isCurrent: true },
];
