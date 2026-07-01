export interface AboutIntroSectionProps {
    lang: string;
}

export interface SiteStats {
    players: string;
    authorized: number;
}

export interface HistoryTimelineItem {
    progress: number;
    date?: string;
    isCurrent?: boolean;
}

export interface HistoryItem extends HistoryTimelineItem {
    year: string;
    title: string;
    text: string;
}
