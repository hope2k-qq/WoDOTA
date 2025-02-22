import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import styles from "./votes.module.scss";

interface HeroVote {
    hero_name: string;
    votes: string;  // Голоса приходят как строка, нужно будет преобразовать в число
}

export const VotesPage = () => {
    const [votes, setVotes] = useState<HeroVote[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.REACT_APP_API_URL;

    const maxVotes = 500000;

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
            <div className={styles.title}>Голосование за героев</div>
            <div className={styles.grid}>
                {votes.map((vote, index) => {
                    const voteCount = parseInt(vote.votes, 10);
                    const votePercentage = Math.min((voteCount / maxVotes) * 100, 100);

                    return (
                        <div key={index} className={styles.card}>
                            <img
                                src={`https://cdn.akamai.steamstatic.com/apps/dota2/images/dota_react/heroes/${vote.hero_name}.png`}
                                alt={vote.hero_name}
                                className={styles.image}
                            />
                            <div className={styles.info}>
                                {/*<div className={styles.heroName}>{vote.hero_name.toUpperCase()}</div>*/}
                                <div className={styles.voteContainer}>
                                    <div className={styles.progressBarContainer}>
                                        <div
                                            className={styles.progressBar}
                                            style={{ width: `${votePercentage}%` }}
                                        />
                                        <div className={styles.voteText}>
                                            {voteCount} / {maxVotes}
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
