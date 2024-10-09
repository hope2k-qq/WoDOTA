import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Group } from 'three';

interface GLTFResult {
    scene: Group;
}

export const Pedestal: React.FC = () => {
    const gltf = useLoader(GLTFLoader, '/pedestal.glb') as GLTFResult;

    return (
        <primitive object={gltf.scene} scale={[1.8, 1, 1.8]} />
    );
};
