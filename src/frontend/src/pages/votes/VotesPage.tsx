import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';

interface HeroVote {
    hero_name: string;
    votes: string;
}

export const VotesPage = () => {
    const [votes, setVotes] = useState<HeroVote[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.REACT_APP_API_URL;

    const fetchHeroVotes = useCallback(async () => {
        if (!API_URL) {
            setError('API_URL is not defined');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/api/votes`);
            setVotes(response.data);
        } catch (err) {
            console.error('Error fetching hero votes:', err);
            setError('Error fetching hero votes');
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchHeroVotes()
            .catch(err => {
                console.error('Error during fetching hero votes:', err);
            });
    }, [fetchHeroVotes]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div style={{ background: "yellow", width: "100%", height: "100%" }}>
            <h1>Hero Votes</h1>
            <ul>
                {votes.map((vote, index) => (
                    <li key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{vote.hero_name}</span>
                        <span>{vote.votes} votes</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
