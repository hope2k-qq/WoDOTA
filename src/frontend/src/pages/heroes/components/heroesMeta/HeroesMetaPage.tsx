import React, { useEffect, useMemo, useState } from 'react';
import styles from './heroes_meta.module.scss';
import {getImageUrl} from "../../../../utils/r2Storage";
import {HeroesStatsTable} from "./components/heroesStatsTable/HeroesStatsTable";
import {LoyaltyBar} from "./components/loyaltyBar/LoyaltyBar";
import { ReactComponent as ArrowDescIcon } from "../../../../assets/icons/ArrowDescIcon.svg";
import { ReactComponent as ArrowAscIcon } from "../../../../assets/icons/ArrowAscIcon.svg";

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

interface MetaResponse {
    heroes: HeroMeta[];
    scoreTable?: MiniTableData;
    killsTable?: MiniTableData;
    deathsTable?: MiniTableData;
    assistsTable?: MiniTableData;
}

interface MiniTableData {
    top: HeroMeta[];
    worst: HeroMeta[]
}

export const HeroesMetaPage: React.FC = () => {
    const [heroes, setHeroes] = useState<HeroMeta[]>([]);
    const [scoreTable, setScoreTable] = useState<MiniTableData | null>(null);
    const [killsTable, setKillsTable] = useState<MiniTableData | null>(null);
    const [deathsTable, setDeathsTable] = useState<MiniTableData | null>(null);
    const [assistsTable, setAssistsTable] = useState<MiniTableData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<'winRate' | 'pickRate' | 'avgKDA' | 'loyaltyScore' | 'hero'>('winRate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const API_URL = process.env.REACT_APP_API_URL;

    const imageUrl = useMemo<Record<string, string>>(() => {
        const urls: Record<string, string> = {};
        for (const h of heroes) {
            urls[h.hero] = getImageUrl(`images/heroes/heroesPreview/${h.hero}.webp`);
        }
        return urls;
    }, [heroes]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/meta`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data: MetaResponse = await response.json();
                setHeroes(data.heroes || []);
                setScoreTable(data.scoreTable || null);
                setKillsTable(data.killsTable || null);
                setDeathsTable(data.deathsTable || null);
                setAssistsTable(data.assistsTable || null);
                setError(null);
            } catch (e: any) {
                setError(e.message || 'Ошибка загрузки');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [API_URL]);

    const formatHeroName = (raw: string) =>
        raw.replace(/_/g, ' ')
            .split(' ')
            .map(seg =>
                seg.split('-')
                    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
                    .join('-')
            )
            .join(' ');

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

    const handleSort = (key: typeof sortKey) => {
        if (sortKey === key) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    const sortedHeroes = [...heroes].sort((a, b) => {
        if (sortKey === 'hero') {
            const nameA = formatHeroName(a.hero).toLowerCase();
            const nameB = formatHeroName(b.hero).toLowerCase();
            return sortOrder === 'asc'
                ? nameB.localeCompare(nameA)
                : nameA.localeCompare(nameB);
        } else {
            const aVal = a[sortKey] ?? 0;
            const bVal = b[sortKey] ?? 0;
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }
    });





    if (loading) {
        return <div className={styles.root}><p className={styles.loading}>Loading...</p></div>;
    }

    if (error) {
        return <div className={styles.root}><p className={styles.error}>Ошибка: {error}</p></div>;
    }

    const maxWinRate = Math.max(...heroes.map(h => h.winRate ?? 0));
    const maxPickRate = Math.max(...heroes.map(h => h.pickRate ?? 0));
    const maxKDA = Math.max(...heroes.map(h => h.avgKDA ?? 0));


    return (
        <div className={styles.div}>
            <div className={styles.mainColumn}>
                <table className={styles.table}>
                    <thead className={styles.thead}>
                    <tr className={styles.headRow}>
                        <th className={styles.th} onClick={() => handleSort('hero')}>
                            <div className={styles.thContent}>
                                <div>Hero</div>
                                {sortKey === 'hero' && (
                                    <div
                                        className={styles.sortWrapper}
                                    >
                                        {sortOrder === 'desc' ? (
                                            <ArrowDescIcon className={styles.sortIcon}/>
                                        ) : (
                                            <ArrowAscIcon className={styles.sortIcon}/>
                                        )}
                                    </div>
                                )}
                            </div>
                        </th>
                        <th className={styles.th} onClick={() => handleSort('winRate')}>
                            <div className={styles.thContent}>
                                <div>Win rate</div>
                                {sortKey === 'winRate' && (
                                    <div
                                        className={styles.sortWrapper}
                                    >
                                        {sortOrder === 'desc' ? (
                                            <ArrowDescIcon className={styles.sortIcon}/>
                                        ) : (
                                            <ArrowAscIcon className={styles.sortIcon}/>
                                        )}
                                    </div>
                                )}
                            </div>
                        </th>
                        <th className={styles.th} onClick={() => handleSort('pickRate')}>
                            <div className={styles.thContent}>
                                <div>Pick rate</div>
                                {sortKey === 'pickRate' && (
                                    <div
                                        className={styles.sortWrapper}
                                    >
                                        {sortOrder === 'desc' ? (
                                            <ArrowDescIcon className={styles.sortIcon} />
                                        ) : (
                                            <ArrowAscIcon className={styles.sortIcon} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </th>
                        <th className={styles.th} onClick={() => handleSort('avgKDA')}>
                            <div className={styles.thContent}>
                                <div>Avg KDA</div>
                                {sortKey === 'avgKDA' && (
                                    <div
                                        className={styles.sortWrapper}
                                    >
                                        {sortOrder === 'desc' ? (
                                            <ArrowDescIcon className={styles.sortIcon} />
                                        ) : (
                                            <ArrowAscIcon className={styles.sortIcon} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </th>
                        <th className={styles.th} onClick={() => handleSort('loyaltyScore')}>
                            <div className={styles.thContent}>
                                <div>Loyalty</div>
                                {sortKey === 'loyaltyScore' && (
                                    <div
                                        className={styles.sortWrapper}
                                    >
                                        {sortOrder === 'desc' ? (
                                            <ArrowDescIcon className={styles.sortIcon} />
                                        ) : (
                                            <ArrowAscIcon className={styles.sortIcon} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </th>
                    </tr>
                    </thead>
                    <tbody className={styles.tbody}>
                    {sortedHeroes.map(h => (
                        <tr key={h.hero} className={styles.row}>
                            <td className={styles.td}>
                                <div className={styles.td_hero}>
                                    <img src={imageUrl[h.hero] || ''} alt={h.hero} className={styles.td_img}/>
                                    <div>{formatHeroName(h.hero)}</div>
                                </div>
                            </td>
                            <td className={styles.td}>
                                <LoyaltyBar
                                    pct={maxWinRate ? (h.winRate / maxWinRate) * 100 : 0}
                                    label={formatVal(h.winRate)}
                                    color={"#4ade80"}
                                />
                            </td>
                            <td className={styles.td}>
                                <LoyaltyBar
                                    pct={maxPickRate ? (h.pickRate / maxPickRate) * 100 : 0}
                                    label={formatVal(h.pickRate)}
                                    color={"#fbbf24"}
                                />
                            </td>
                            <td className={styles.td}>
                                <LoyaltyBar
                                    pct={maxKDA ? (h.avgKDA / maxKDA) * 100 : 0}
                                    label={formatVal(h.avgKDA)}
                                    color={"#fb923c"}
                                    showPercent={false}
                                />
                            </td>
                            <td className={styles.td}>
                                <LoyaltyBar
                                    pct={h.loyaltyScore ?? 0}
                                    label={formatVal(h.loyaltyScore)}
                                    color={h.loyaltyColor ?? "red"}
                                />
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <aside className={styles.sideColumn}>
                <HeroesStatsTable
                    data={scoreTable}
                    metricKey="score"
                    metricLabel="Score"
                    imageUrl={imageUrl}
                />
                <HeroesStatsTable
                    data={killsTable}
                    metricKey="avgKills"
                    metricLabel="Avg Kills"
                    imageUrl={imageUrl}
                />
                <HeroesStatsTable
                    data={deathsTable}
                    metricKey="avgDeaths"
                    metricLabel="Avg Deaths"
                    invertBetter
                    imageUrl={imageUrl}
                />
                <HeroesStatsTable
                    data={assistsTable}
                    metricKey="avgAssists"
                    metricLabel="Avg Assists"
                    imageUrl={imageUrl}
                />
            </aside>
        </div>
    );
};
