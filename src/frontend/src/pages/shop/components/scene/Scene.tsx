import React, { useState, useEffect, CSSProperties } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Hero } from "./components/hero/Hero";
import { Pet } from "./components/pet/Pet";
import { HighFive } from "./components/highFive/HighFive";
import { Pedestal } from "./components/pedestal/Pedestal";

export const Scene: React.FC = () => {
    const [selectedHero, setSelectedHero] = useState<string>(''); // Состояние для выбранного героя
    const [selectedHeroAnimation, setSelectedHeroAnimation] = useState<string>('idle'); // Анимация героя
    const [selectedPetAnimation, setSelectedPetAnimation] = useState<string>('idle'); // Анимация питомца
    const [heroes, setHeroes] = useState<string[]>([]); // Состояние для списка героев
    const [isPaused, setIsPaused] = useState<boolean>(false); // Состояние для паузы анимации

    const API_URL = process.env.REACT_APP_API_URL;

    const fetchHeroes = async () => {
        try {
            const response = await fetch(`${API_URL}/api/heroes`);
            if (!response.ok) {
                throw new Error('Failed to fetch heroes');
            }
            const data = await response.json();
            setHeroes(data);
            if (data.length > 0) {
                setSelectedHero(data[0]);
            }
        } catch (error) {
            console.error('Error fetching heroes:', error);
        }
    };

    useEffect(() => {
        fetchHeroes();
    }, []);

    const handleHeroAnimationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedHeroAnimation(event.target.value);
        setSelectedPetAnimation(event.target.value);
    };

    const handleHeroChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedHero(event.target.value); // Обновляем выбранного героя
    };

    const togglePause = () => {
        setIsPaused(!isPaused);
    };

    return (
        <div style={styles.canvasContainer}>
            <div>
                <label>Hero:</label>
                <select onChange={handleHeroChange} value={selectedHero}>
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
                <Pedestal />
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
        flexDirection: 'column' as 'column',
        alignItems: 'center',
    },
};
