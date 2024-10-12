import React, { useEffect, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { AnimationMixer, Group, AnimationAction } from 'three';
import * as THREE from 'three';

interface GLTFResult {
    scene: Group;
    animations: any[];
}

interface PetProps {
    animationName: string;
    isPaused: boolean;
}

export const Pet: React.FC<PetProps> = ({ animationName, isPaused }) => {
    const gltf = useLoader(GLTFLoader, '/shroomy.glb') as GLTFResult;
    const mixer = useRef<AnimationMixer | null>(null);
    const actions = useRef<{ [key: string]: AnimationAction }>({});

    useEffect(() => {
        mixer.current = new AnimationMixer(gltf.scene);

        gltf.animations.forEach((clip) => {
            const action = mixer.current!.clipAction(clip);
            action.loop = THREE.LoopRepeat;
            actions.current[clip.name] = action;
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
        if (mixer.current && !isPaused) {
            mixer.current.update(delta);
        }
    });

    useEffect(() => {
        Object.values(actions.current).forEach(action => action.stop());
        if (actions.current[animationName]) {
            actions.current[animationName].play();
        }
    }, [animationName]);

    useEffect(() => {
        Object.values(actions.current).forEach(action => {
            action.paused = isPaused;
        });
    }, [isPaused]);

    return <primitive object={gltf.scene} position={[2, 0, -1]} />;
};
