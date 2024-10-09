import React, { useState, CSSProperties } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {Hero} from "./components/hero/Hero";
import {Pet} from "./components/pet/Pet";
import {HighFive} from "./components/highFive/HighFive";
import {Pedestal} from "./components/pedestal/Pedestal";

export const Scene: React.FC = () => {
    const [selectedHeroAnimation, setSelectedHeroAnimation] = useState<string>('Idle'); // Анимация героя
    const [selectedPetAnimation, setSelectedPetAnimation] = useState<string>('Idle'); // Анимация питомца

    const handleHeroAnimationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedHeroAnimation(event.target.value);
    };

    const handlePetAnimationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPetAnimation(event.target.value);
    };

    return (
        <div style={styles.canvasContainer}>
            <div>
                <label>Hero Animation:</label>
                <select onChange={handleHeroAnimationChange} value={selectedHeroAnimation}>
                    <option value="idle">Idle</option>
                    <option value="run">Run</option>
                </select>
            </div>

            <div>
                <label>Pet Animation:</label>
                <select onChange={handlePetAnimationChange} value={selectedPetAnimation}>
                    <option value="idle">Idle</option>
                    <option value="run">Run</option>
                </select>
            </div>

            <Canvas>
                <ambientLight intensity={0.8} />
                <OrbitControls
                    minDistance={2}
                    maxDistance={10}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 2}
                />
                <Pedestal />
                <Hero animationName={selectedHeroAnimation} />
                <Pet animationName={selectedPetAnimation} />
                <HighFive position={[0, 2, 0]} />
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
