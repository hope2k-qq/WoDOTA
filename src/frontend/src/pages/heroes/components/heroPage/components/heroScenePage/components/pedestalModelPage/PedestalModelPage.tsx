import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Group } from 'three';

interface GLTFResult {
    scene: Group;
}

interface PedestalProps {
    modelUrl: string;
    position?: [number, number, number];
    scale?: [number, number, number];
    rotation?: [number, number, number];  // Теперь только для статического угла
}

export const PedestalModelPage: React.FC<PedestalProps> = ({
                                                               modelUrl,
                                                               position = [0, 0, 0],
                                                               scale = [1, 1, 1],
                                                               rotation = [0, 0, 0]  // Поворот пьедестала теперь полностью передается через пропс
                                                           }) => {
    const gltf = useLoader(GLTFLoader, modelUrl) as GLTFResult;

    return (
        <primitive
            object={gltf.scene}
            position={position}
            scale={scale}
            rotation={rotation}  // Используем переданный пропс для установки угла
        />
    );
};
