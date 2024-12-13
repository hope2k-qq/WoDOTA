import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Group } from 'three';

interface GLTFResult {
    scene: Group;
}

interface PedestalProps {
    modelUrl: string;
}

export const Pedestal: React.FC<PedestalProps> = ({ modelUrl }) => {
    const gltf = useLoader(GLTFLoader, modelUrl) as GLTFResult;
    return <primitive object={gltf.scene} scale={[1.8, 1, 1.8]} />;
};
