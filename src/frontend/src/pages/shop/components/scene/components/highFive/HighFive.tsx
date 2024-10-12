import React, { useEffect, useRef } from 'react';
import {useFrame, useLoader} from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { AnimationMixer, Group, AnimationAction } from 'three';
import * as THREE from 'three';

interface GLTFResult {
    scene: Group;
    animations: any[];
}

export const HighFive: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const gltf = useLoader(GLTFLoader, '/1.glb') as GLTFResult; // Загрузка модели для "дай пять"
    const mixer = useRef<AnimationMixer | null>(null);
    const actions = useRef<{ [key: string]: AnimationAction }>({});

    useEffect(() => {
        mixer.current = new AnimationMixer(gltf.scene);

        gltf.animations.forEach((clip) => {
            const action = mixer.current!.clipAction(clip);
            action.loop = THREE.LoopRepeat;
            actions.current[clip.name] = action;
        });

        if (actions.current['wave']) {
            actions.current['wave'].play();
        }

        return () => {
            if (mixer.current) {
                mixer.current.stopAllAction();
            }
        };
    }, [gltf]);

    useFrame((state, delta) => {
        if (mixer.current) mixer.current.update(delta);
    });

    return <primitive object={gltf.scene} position={position} />;
};
