import React, { useEffect, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { AnimationMixer, Group, AnimationAction } from 'three';
import * as THREE from 'three';

interface GLTFResult {
    scene: Group;
    animations: any[];
}

interface HeroProps {
    heroName: string;
    animationName: string;
    isPaused: boolean;
    position?: [number, number, number];  // Добавлено свойство position
    scale?: [number, number, number];     // Добавлено свойство scale
    rotation?: [number, number, number];  // Добавлено свойство rotation
}

export const HeroModelPage: React.FC<HeroProps> = ({
                                                       heroName,
                                                       animationName,
                                                       isPaused,
                                                       position = [0, 0, 0],
                                                       scale = [1, 1, 1],
                                                       rotation = [0, 0, 0]  // Дефолтное значение для rotation
                                                   }) => {
    // const gltf = useLoader(GLTFLoader, `/${heroName}.glb`) as GLTFResult;
    const gltf = useLoader(GLTFLoader, `/ancient_apparition.glb`) as GLTFResult;
    const mixer = useRef<AnimationMixer | null>(null);
    const actions = useRef<{ [key: string]: AnimationAction }>({});
    const prevAnimationName = useRef<string | null>(null);

    useEffect(() => {
        mixer.current = new AnimationMixer(gltf.scene);

        gltf.animations.forEach((clip) => {
            const action = mixer.current!.clipAction(clip);
            action.loop = THREE.LoopRepeat;
            actions.current[clip.name] = action;
        });

        return () => {
            if (mixer.current) {
                mixer.current.stopAllAction();
            }
        };
    }, [gltf]);

    useFrame((state, delta) => {
        if (mixer.current && !isPaused) {
            mixer.current.update(delta);
        }
    });

    useEffect(() => {
        if (actions.current[animationName]) {
            const currentAction = actions.current[animationName];

            if (prevAnimationName.current && actions.current[prevAnimationName.current]) {
                const previousAction = actions.current[prevAnimationName.current];
                previousAction.fadeOut(0.1);
            }

            currentAction.reset().fadeIn(0.1).play();
        }

        prevAnimationName.current = animationName;
    }, [animationName]);

    useEffect(() => {
        Object.values(actions.current).forEach(action => action.paused = isPaused);
    }, [isPaused]);

    return (
        <primitive
            object={gltf.scene}
            position={position}
            scale={scale}
            rotation={rotation}  // Применяем поворот к модели
        />
    );
};
