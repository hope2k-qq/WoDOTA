import React, { useEffect, useRef } from 'react';
import {useFrame, useLoader} from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { AnimationMixer, Group, AnimationAction } from 'three';
import * as THREE from 'three';

interface GLTFResult {
    scene: Group;
    animations: any[];
}

export const Hero: React.FC<{ animationName: string }> = ({ animationName }) => {
    const gltf = useLoader(GLTFLoader, '/abaddon.glb') as GLTFResult; // Загрузка модели героя
    const mixer = useRef<AnimationMixer | null>(null);
    const actions = useRef<{ [key: string]: AnimationAction }>({});

    useEffect(() => {
        mixer.current = new AnimationMixer(gltf.scene);

        gltf.animations.forEach((clip) => {
            const action = mixer.current!.clipAction(clip);
            action.loop = THREE.LoopRepeat; // Зацикливание анимации
            actions.current[clip.name] = action; // Сохраняем действие
        });

        if (actions.current[animationName]) {
            actions.current[animationName].play();
        }

        return () => {
            if (mixer.current) {
                mixer.current.stopAllAction();
            }
        };
    }, [gltf, animationName]);

    useFrame((state, delta) => {
        if (mixer.current) mixer.current.update(delta);
    });

    useEffect(() => {
        Object.values(actions.current).forEach(action => action.stop());
        if (actions.current[animationName]) {
            actions.current[animationName].play();
        }
    }, [animationName]);

    return <primitive object={gltf.scene} />;
};
