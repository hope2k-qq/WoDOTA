import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
//import { HeroModelPage } from "./components/heroModelPage/HeroModelPage";
//import { PedestalModelPage } from "./components/pedestalModelPage/PedestalModelPage";
//import { getImageUrl } from '../../../../../../utils/r2Storage';
// import axios from "axios";
import { Group } from 'three';
import styles from './hero_scene_page.module.scss';

interface HeroScenePageProps {
    heroName: string;
}

export const HeroScenePage: React.FC<HeroScenePageProps> = ({ heroName }) => {
    // const [selectedHeroAnimation, setSelectedHeroAnimation] = useState<string>('idle');
    //const [heroes, setHeroes] = useState<string[]>([]);
    // const [isPaused, setIsPaused] = useState<boolean>(false);
    // const [loading, setLoading] = useState<boolean>(true);
    // const [error, setError] = useState<string | null>(null);

    //const [pedestalUrl, setPedestalUrl] = useState<string | null>(null);
    //const [pedestalRotation, setPedestalRotation] = useState<number>(0); // Состояние для угла поворота пьедестала
    // const objectKeyPedestal = 'models/pedestal/pedestal_2023.glb';

    //const API_URL = process.env.REACT_APP_API_URL;

    const lightTargetRef = useRef<Group>(null); // Ссылка на объект цели для света

    //const mouseDownRef = useRef<boolean>(false);
    //const initialMouseXRef = useRef<number>(0);

    //const [isMouseInsideCanvas, setIsMouseInsideCanvas] = useState<boolean>(false);
    //const [canvasPosition, setCanvasPosition] = useState<[number, number, number]>([0, -0.9, 0]);


    // const handleMouseEnterCanvas = () => {
    //     setIsMouseInsideCanvas(true);
    // };
    //
    // const handleMouseLeaveCanvas = () => {
    //     setIsMouseInsideCanvas(false);
    // };

    // useEffect(() => {
    //     const handleResize = () => {
    //         if (window.innerWidth < 1200 && window.innerWidth > 768) {
    //             setCanvasPosition([0.3, -0.9, 0]);
    //             // setHeroScale([0.6, 0.6, 0.6]);
    //         } else{
    //             setCanvasPosition([0, -0.9, 0]);
    //         }
    //         // if (window.innerWidth < 768) {
    //         //     setHeroScale([0.5, 0.5, 0.5]);
    //         // } else if (window.innerWidth > 1200) {
    //         //     setHeroScale([0.66, 0.66, 0.66]);
    //         // }
    //
    //     };
    //
    //     handleResize();
    //
    //     window.addEventListener('resize', handleResize);
    //
    //     // Cleanup on component unmount
    //     return () => {
    //         window.removeEventListener('resize', handleResize);
    //     };
    // }, []);
    //
    // useEffect(() => {
    //     // const fetchHeroesData = async () => {
    //     //     try {
    //     //         const response = await axios.get(`${API_URL}/heroes`);
    //     //         const data = response.data;
    //     //         const heroNames = data.map((hero: { name: string }) => hero.name);
    //     //         setHeroes(heroNames);
    //     //     } catch (error) {
    //     //         console.error('Error fetching hero data:', error);
    //     //         setError('Failed to fetch hero data.');
    //     //     } finally {
    //     //         setLoading(false);
    //     //     }
    //     // };
    //     //
    //     // fetchHeroesData().catch(err => {
    //     //     console.error('Error in fetchHeroesData:', err);
    //     // });
    //
    //     const handleMouseMove = (event: MouseEvent) => {
    //         if (isMouseInsideCanvas && mouseDownRef.current && event.button === 0) {
    //             const deltaX = event.clientX - initialMouseXRef.current;
    //             setPedestalRotation((prevRotation) => prevRotation + deltaX * 0.007);
    //             initialMouseXRef.current = event.clientX;
    //         }
    //     };
    //
    //     const handleMouseDown = (event: MouseEvent) => {
    //         if (event.button === 0) {
    //             mouseDownRef.current = true;
    //             initialMouseXRef.current = event.clientX;
    //         }
    //     };
    //
    //     const handleMouseUp = () => {
    //         mouseDownRef.current = false;
    //     };
    //
    //     window.addEventListener('mousemove', handleMouseMove);
    //     window.addEventListener('mousedown', handleMouseDown);
    //     window.addEventListener('mouseup', handleMouseUp);
    //
    //     return () => {
    //         window.removeEventListener('mousemove', handleMouseMove);
    //         window.removeEventListener('mousedown', handleMouseDown);
    //         window.removeEventListener('mouseup', handleMouseUp);
    //     };
    // }, [isMouseInsideCanvas]);

    // const fetchModelUrl = async (objectKey: string, setModelUrl: React.Dispatch<React.SetStateAction<string | null>>) => {
    //     try {
    //         const url = await getImageUrl(objectKey);
    //         if (url) {
    //             setModelUrl(url);
    //         } else {
    //             setError(`Не удалось загрузить модель по ключу: ${objectKey}`);
    //         }
    //     } catch (err) {
    //         setError('Failed to fetch model URL');
    //     }
    // };

    // useEffect(() => {
    //     fetchModelUrl(objectKeyPedestal, setPedestalUrl);
    // }, [objectKeyPedestal]);

    // const handleHeroAnimationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    //     setSelectedHeroAnimation(event.target.value);
    // };

    // const togglePause = () => {
    //     setIsPaused(!isPaused);
    // };

    // if (loading) {
    //     return <div style={{ color: 'blue' }}>Loading heroes...</div>;
    // }

    // if (error) {
    //     return <div style={{ color: 'red' }}>Error: {error}</div>;
    // }

    return (
        <div className={styles.canvasContainer}>
            <Canvas
                // onMouseEnter={handleMouseEnterCanvas}
                // onMouseLeave={handleMouseLeaveCanvas}
            >
                <PerspectiveCamera makeDefault fov={26} near={0.1} far={10} position={[0, 4.1, 0]}/>

                <ambientLight intensity={3}/>

                <directionalLight
                    intensity={1.8}
                    position={[0, 2, 0]}
                    castShadow
                    target={lightTargetRef.current || undefined}
                />

                <pointLight intensity={7} position={[0, 5, 0]} color="green"/>

                <OrbitControls
                    enableZoom={false}
                    enableRotate={false}
                    enablePan={false}
                    minPolarAngle={Math.PI / 2}
                    maxPolarAngle={Math.PI / 2}
                    target={[0, -0.1, 0]}
                />

                {/*{pedestalUrl && (*/}
                {/*    <PedestalModelPage*/}
                {/*        modelUrl={pedestalUrl}*/}
                {/*        position={[0, -0.9, 0]}*/}
                {/*        scale={[0.6, 0.3, 0.6]}*/}
                {/*        rotation={[0, pedestalRotation, 0]}*/}
                {/*    />*/}
                {/*)}*/}

                {/*{heroName && (*/}
                {/*    <HeroModelPage*/}
                {/*        heroName={heroName}*/}
                {/*        animationName={'idle'}*/}
                {/*        isPaused={false}*/}
                {/*        scale={[0.66, 0.66, 0.66]}*/}
                {/*        rotation={[0, pedestalRotation, 0]}*/}
                {/*        position={canvasPosition}*/}
                {/*    />*/}
                {/*)}*/}

                <group ref={lightTargetRef} position={[0, -2, 0]}/>
            </Canvas>
        </div>
    );
};
