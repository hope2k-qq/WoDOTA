import React, { useState, useEffect, CSSProperties, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Hero } from "./components/hero/Hero";
import { Pet } from "./components/pet/Pet";
import { HighFive } from "./components/highFive/HighFive";
import { Pedestal } from "./components/pedestal/Pedestal";
import { getImageUrl } from '../../../../utils/r2Storage';
import axios from "axios";
import {log} from "node:util";

export const Scene: React.FC = () => {
    const [selectedHero, setSelectedHero] = useState<string>('');
    const [selectedHeroAnimation, setSelectedHeroAnimation] = useState<string>('idle');
    const [selectedPetAnimation, setSelectedPetAnimation] = useState<string>('idle');
    const [heroes, setHeroes] = useState<string[]>([]);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [pedestalUrl, setPedestalUrl] = useState<string | null>(null);
    const objectKeyPedestal = 'models/pedestal/pedestal.glb';

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchHeroesData = async () => {
            try {
                const response = await axios.get(`${API_URL}/heroes`);
                const data = response.data;

                const heroNames = data.map((hero: { name: string }) => hero.name);

                setHeroes(heroNames);
            } catch (error) {
                console.error('Error fetching hero data:', error);
                setError('Failed to fetch hero data.');
            } finally {
                setLoading(false);
            }
        };

        fetchHeroesData().catch(err => {
            console.error('Error in fetchHeroesData:', err);
        });
    }, [API_URL]);

    const fetchModelUrl = async (objectKey: string, setModelUrl: React.Dispatch<React.SetStateAction<string | null>>) => {
        try {
            const url = await getImageUrl(objectKey);
            if (url) {
                setModelUrl(url);
            } else {
                setError(`Не удалось загрузить модель по ключу: ${objectKey}`);
            }
        } catch (err) {
            setError('Failed to fetch model URL');
        }
    };

    useEffect(() => {
        fetchModelUrl(objectKeyPedestal, setPedestalUrl);
    }, [objectKeyPedestal]);

    // Обработчик изменения анимации героя
    const handleHeroAnimationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedHeroAnimation(event.target.value);
        setSelectedPetAnimation(event.target.value); // Синхронизация с питомцем
    };

    // Обработчик изменения героя
    const handleHeroChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedHero(event.target.value);
    };

    // Переключение паузы анимации
    const togglePause = () => {
        setIsPaused(!isPaused);
    };

    if (loading) {
        return <div style={{ color: 'blue' }}>Loading heroes...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={styles.canvasContainer}>
            <div>
                <label>Hero:</label>
                <select onChange={handleHeroChange} value={selectedHero} disabled={loading}>
                    {heroes.map((hero) => (
                        <option key={hero} value={hero}>
                            {hero.replace(/_/g, ' ')}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label>Hero Animation:</label>
                <select onChange={handleHeroAnimationChange} value={selectedHeroAnimation}>
                    <option value="idle">Idle</option>
                    <option value="run">Run</option>
                </select>
            </div>

            <button onClick={togglePause}>
                {isPaused ? 'Resume Animations' : 'Pause Animations'}
            </button>

            <Canvas>
                <ambientLight intensity={0.8} />
                <OrbitControls
                    minDistance={2}
                    maxDistance={10}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 2}
                />
                {pedestalUrl && <Pedestal modelUrl={pedestalUrl} />}
                {selectedHero && <Hero heroName={selectedHero} animationName={selectedHeroAnimation} isPaused={isPaused} />}
                <Pet animationName={selectedPetAnimation} isPaused={isPaused} />
                <HighFive position={[0, 3, 0]} />
            </Canvas>
        </div>
    );
};

const styles: { [key: string]: CSSProperties } = {
    canvasContainer: {
        width: '80vw',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
};
