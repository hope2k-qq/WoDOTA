import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { getImageUrl } from '../../utils/r2Storage';

interface HeroVote {
    hero_name: string;
    votes: string;
}

export const VotesPage = () => {
    const [votes, setVotes] = useState<HeroVote[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const objectKey = 'images/heroes/heroesPreview/slark.webp';

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchImage = async () => {
            const url = await getImageUrl(objectKey);
            setImageUrl(url);
        };

        fetchImage();
    }, [objectKey]);

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
        return <div>Загрузка...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div style={{background: "yellow", width: "100%", height: "100%"}}>
            <h1>Голосование за героев</h1>
            <ul>
                {votes.map((vote, index) => (
                    <li key={index} style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span>{vote.hero_name}</span>
                        <span>{vote.votes} голосов</span>
                    </li>
                ))}
            </ul>
            <div>
                {imageUrl ? (
                    <img src={imageUrl} alt="Изображение из Cloudflare R2" style={{width: '100%', height: 'auto'}}/>
                ) : (
                    <p>Загрузка изображения...</p>
                )}
            </div>
        </div>
    );
};
