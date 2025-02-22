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
}

export const Hero: React.FC<HeroProps> = ({ heroName, animationName, isPaused }) => {
    const gltf = useLoader(GLTFLoader, `/${heroName}.glb`) as GLTFResult;
    console.log(heroName);
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
        console.log(`Switching from ${prevAnimationName.current} to ${animationName}`);

        if (actions.current[animationName]) {
            const currentAction = actions.current[animationName];

            if (prevAnimationName.current && actions.current[prevAnimationName.current]) {
                const previousAction = actions.current[prevAnimationName.current];
                previousAction.fadeOut(0.1);
            }

            currentAction.reset().fadeIn(0.1).play();
            console.log(`Started animation: ${animationName}`);
        } else {
            console.warn(`Animation ${animationName} not found`);
        }

        prevAnimationName.current = animationName;
    }, [animationName]);

    useEffect(() => {
        Object.values(actions.current).forEach(action => action.paused = isPaused);
    }, [isPaused]);

    return <primitive object={gltf.scene} />;
};
