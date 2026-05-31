import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import styles from "./votes.module.scss";
import {useTranslation} from "react-i18next";
import heroReplacements from '../../data/replacements_heroes.json';
import {getImageUrl} from "../../utils/r2Storage";

interface HeroVote {
    hero_name: string;
    votes: string;
}

export const VotesPage = () => {
    const { t } = useTranslation();
    const [votes, setVotes] = useState<HeroVote[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.REACT_APP_API_URL;

    const maxVotes = 450000;

    const fetchHeroVotes = useCallback(async () => {
        if (!API_URL) {
            setError('API_URL не определен');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/votes`);
            setVotes(response.data);
        } catch (err) {
            console.error('Ошибка при получении голосов за героев:', err);
            setError('Ошибка при получении голосов за героев');
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchHeroVotes().catch(err => console.error('Ошибка при получении голосов за героев:', err));
    }, [fetchHeroVotes]);

    if (loading) {
        return <div></div>;
    }

    if (error) {
        return <div>error</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.title}>{t('voting_heroes')}</div>
            <div className={styles.grid}>
                {votes
                    .slice()
                    .sort((a, b) => parseInt(b.votes, 10) - parseInt(a.votes, 10))
                    .map((vote, index) => {
                        const voteCount = parseInt(vote.votes, 10);
                        const votePercentage = Math.min((voteCount / maxVotes) * 100, 100);
                        const heroNameKey = vote.hero_name as keyof typeof heroReplacements.heroes;
                        const heroName = heroReplacements.heroes[heroNameKey] || vote.hero_name;
                        return (
                            <div key={index} className={styles.card}>
                                <img
                                    src={getImageUrl(`images/heroes/heroesPreview/${heroName}.webp`)}
                                    alt={heroName}
                                    className={styles.image}
                                />
                                <div className={styles.info}>
                                    <div className={styles.voteContainer}>
                                        <div className={styles.progressBarContainer}>
                                            <div
                                                className={styles.progressBar}
                                                style={{
                                                    width: `${votePercentage}%`,
                                                    backgroundColor: voteCount >= 450000 ? '#d9a600' : '#4caf50',
                                                }}
                                            />
                                            <div className={styles.voteText}>
                                                {voteCount >= 450000
                                                    ? t('in_development')
                                                    : `${voteCount} / ${maxVotes}`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};
