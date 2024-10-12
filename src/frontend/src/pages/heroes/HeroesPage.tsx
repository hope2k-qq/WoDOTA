import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const heroesWithLocalAssets = ['aghanim', 'creep','roshan','legion_commander', 'wraith_king'];

const localAssetHeroes: Set<string> = new Set(Object.values(heroesWithLocalAssets));

export const HeroesPage: React.FC = () => {
    const navigate = useNavigate();
    const [heroNames, setHeroNames] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        axios.get(`${API_URL}/api/heroes`)
            .then(response => {
                const data = response.data;
                const names = data.map((name: string) => heroesWithLocalAssets.includes(name) ? name : name);
                setHeroNames(names);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching talents data:', error);
                setError('Failed to fetch hero data.');
                setLoading(false);
            });
    }, []);

    const getHeroImageSrc = (name: string) => {
        if (localAssetHeroes.has(name)) {
            return require(`../../assets/images/heroes/heroesPreview/${name}.png`);
        }
        return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${name}.png`;
    };

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
                            src={getHeroImageSrc(name)}
                            alt={name}
                        />
                        <span>{name}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
