import React from "react";
import styles from "./heroes_stats_table.module.scss";
import { ReactComponent as ArrowIcon } from "../../../../../../assets/icons/ArrowIcon.svg";
import {LoyaltyBar} from "../loyaltyBar/LoyaltyBar";

interface HeroMeta {
    hero: string;
    games: number;
    winRate: number;
    pickRate: number;
    avgKDA: number;
    score?: number;
    avgKills?: number;
    avgDeaths?: number;
    avgAssists?: number;
    loyaltyScore?: number;
    loyaltyColor?: string;
}

interface MiniTableData {
    top: HeroMeta[];
    worst: HeroMeta[];
}

interface StatsTableProps {
    data: MiniTableData | null;
    metricKey: keyof HeroMeta;
    metricLabel: string;
    precision?: number;
    invertBetter?: boolean;
    imageUrl: Record<string, string | null>;
}

export const HeroesStatsTable: React.FC<StatsTableProps> = ({
                                                                data,
                                                                metricKey,
                                                                metricLabel,
                                                                imageUrl
                                                            }) => {
    if (!data) return null;

    const formatVal = (v: any) => {
        if (typeof v === 'number') {
            const fixed = Number(v.toFixed(2));
            return fixed.toLocaleString("ru-RU", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        }
        return v ?? '-';
    };



    const formatHeroName = (raw: string): string => {
        const cap = (w: string) =>
            w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w;

        return raw
            .replace(/_/g, ' ')
            .split(' ')
            .map(seg => seg
                .split('-')
                .map(cap)
                .join('-')
            )
            .join(' ');
    };


    return (
        <div className={styles.miniTableWrapper}>
            <div className={styles.miniSection}>
                <table className={styles.miniTable}>
                    <thead>
                    <tr>
                        <th className={styles.th}>Hero</th>
                        <th className={styles.th}>{metricLabel}</th>
                        <th className={styles.th}>Loyalty</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.top.map((h) => (
                        <tr>
                            <td className={styles.td}>
                                <div className={styles.td_hero}>
                                    <img src={imageUrl[h.hero] || ''} alt={h.hero} className={styles.td_img}/>
                                    <div>{formatHeroName(h.hero)}</div>
                                </div>
                            </td>
                            <td className={styles.td}>
                                <div className={styles.td_value}>
                                    <ArrowIcon className={`${styles.icon} ${styles.icon_top}`} />
                                    {formatVal(h[metricKey])}
                                </div>
                            </td>
                            <td className={styles.td}>
                                <LoyaltyBar
                                    pct={h.loyaltyScore ?? 0}
                                    label={formatVal(h.loyaltyScore ?? 0)}
                                    color={h.loyaltyColor ?? "red"}
                                />
                            </td>
                        </tr>
                    ))}
                    {data.worst.map((h) => (
                        <tr key={h.hero + '_worst'}>
                            <td className={styles.td}>
                                <div className={styles.td_hero}>
                                    <img src={imageUrl[h.hero] || ''} alt={h.hero} className={styles.td_img}/>
                                    <div>{formatHeroName(h.hero)}</div>
                                </div>
                            </td>
                            <td className={styles.td}>
                                <div className={styles.td_value}>
                                    <ArrowIcon className={`${styles.icon} ${styles.icon_worst}`} />
                                    <div className={styles.value_text}>{formatVal(h[metricKey])}</div>
                                </div>
                            </td>
                            <td className={styles.td}>
                                <LoyaltyBar
                                    pct={h.loyaltyScore ?? 0}
                                    label={formatVal(h.loyaltyScore ?? 0)}
                                    color={h.loyaltyColor ?? "red"}
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
