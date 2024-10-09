import React, { useEffect, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { AnimationMixer, Group, AnimationAction } from 'three';
import * as THREE from 'three';

interface GLTFResult {
    scene: Group;
    animations: any[];
}

export const Pet: React.FC<{ animationName: string }> = ({ animationName }) => {
    const gltf = useLoader(GLTFLoader, '/shroomy.glb') as GLTFResult; // Загрузка модели питомца
    const mixer = useRef<AnimationMixer | null>(null);
    const actions = useRef<{ [key: string]: AnimationAction }>({});

    useEffect(() => {
        mixer.current = new AnimationMixer(gltf.scene);

        // Создание действий для всех анимаций
        gltf.animations.forEach((clip) => {
            const action = mixer.current!.clipAction(clip);
            action.loop = THREE.LoopRepeat; // Зацикливание анимации
            actions.current[clip.name] = action; // Сохраняем действия для каждой анимации
        });

        // Запуск текущей анимации питомца
        if (actions.current[animationName]) {
            actions.current[animationName].play();
        }

        // Очистка действий при размонтировании компонента
        return () => {
            if (mixer.current) {
                mixer.current.stopAllAction();
            }
        };
    }, [gltf, animationName]);

    useFrame((state, delta) => {
        if (mixer.current) mixer.current.update(delta); // Обновление анимации каждый кадр
    });

    // Эффект для смены анимации, при изменении пропса animationName
    useEffect(() => {
        Object.values(actions.current).forEach(action => action.stop()); // Остановить все анимации
        if (actions.current[animationName]) {
            actions.current[animationName].play(); // Воспроизвести новую анимацию
        }
    }, [animationName]);

    return <primitive object={gltf.scene} position={[2, 0, -1]} />; // Смещение питомца по оси x
};

