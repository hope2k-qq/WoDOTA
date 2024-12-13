import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../utils/r2Storage';

export const HeroesPage: React.FC = () => {
    const navigate = useNavigate();
    const [heroNames, setHeroNames] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<{ [key: string]: string | null }>({}); // Состояние для хранения URL изображений

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchHeroNames = async () => {
            try {
                const response = await axios.get(`${API_URL}/heroes`);
                const data = response.data;
                setHeroNames(data);

                const urls: { [key: string]: string | null } = {};
                for (const name of data) {
                    const url = await getImageUrl(`images/heroes/heroesPreview/${name}.webp`);
                    urls[name] = url;
                }
                setImageUrl(urls);
            } catch (error) {
                console.error('Error fetching hero data:', error);
                setError('Failed to fetch hero data.');
            } finally {
                setLoading(false);
            }
        };

        fetchHeroNames().catch(err => {
            console.error('Error in fetchHeroNames:', err);
        });
    }, [API_URL]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>Hero Names</h1>
            <ul>
                {heroNames.map((name, index) => (
                    <li key={index} onClick={() => navigate(`/hero/${name}`)}>
                        <img
                            src={imageUrl[name] || ''}
                            alt={name}
                        />
                        <span>{name}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
