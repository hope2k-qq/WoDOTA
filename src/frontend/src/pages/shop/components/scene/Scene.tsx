import React, { useState, useEffect, CSSProperties, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Hero } from "./components/hero/Hero";
import { Pet } from "./components/pet/Pet";
import { HighFive } from "./components/highFive/HighFive";
import { Pedestal } from "./components/pedestal/Pedestal";
import { getImageUrl } from '../../../../utils/r2Storage';

export const Scene: React.FC = () => {
    const [selectedHero, setSelectedHero] = useState<string>('');
    const [selectedHeroAnimation, setSelectedHeroAnimation] = useState<string>('idle');
    const [selectedPetAnimation, setSelectedPetAnimation] = useState<string>('idle');
    const [heroes, setHeroes] = useState<string[]>([]);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [pedestalUrl, setPedestalUrl] = useState<string | null>(null);
    const [heroUrl, setHeroUrl] = useState<string | null>(null);
    const objectKeyPedestal = 'models/pedestal/pedestal.glb';
    const objectKeyHero = 'models/heroes/hero.glb';

    const API_URL = process.env.REACT_APP_API_URL;

    const fetchHeroes = useCallback(async () => {
        if (!API_URL) {
            setError('API_URL is not defined');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/heroes`);
            if (!response.ok) {
                throw new Error('Failed to fetch heroes');
            }
            const data = await response.json();
            setHeroes(data);
            if (data.length > 0) {
                setSelectedHero(data[0]);
            }
        } catch (error: unknown) {
            console.error('Error fetching heroes:', error);
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchHeroes().catch((err) => {
            console.error('Error during fetching heroes:', err);
        });
    }, [fetchHeroes]);

    const fetchModelUrl = async (objectKey: string, setModelUrl: React.Dispatch<React.SetStateAction<string | null>>) => {
        const url = await getImageUrl(objectKey);
        if (url) {
            setModelUrl(url);
        } else {
            setError(`Не удалось загрузить модель по ключу: ${objectKey}`);
        }
    };


    useEffect(() => {
        fetchModelUrl(objectKeyPedestal, setPedestalUrl);
    }, [objectKeyPedestal]);

    useEffect(() => {
        fetchModelUrl(objectKeyHero, setHeroUrl);
    }, [objectKeyHero]);

    const handleHeroAnimationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedHeroAnimation(event.target.value);
        setSelectedPetAnimation(event.target.value);
    };

    const handleHeroChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedHero(event.target.value);
    };

    const togglePause = () => {
        setIsPaused(!isPaused);
    };

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div style={styles.canvasContainer}>
            {loading && <p>Loading heroes...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

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
                <Hero heroName={selectedHero} animationName={selectedHeroAnimation} isPaused={isPaused} />
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
