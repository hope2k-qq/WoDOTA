import { useRef, useEffect, useState } from 'react';
import styles from './hero_scene_page.module.scss';
import {fetchAndCacheVideo, getImageUrl2, getVideoFromIndexedDB} from '../../../../../../utils/videoUtils';

interface HeroScenePageProps {
    heroName: string;
}

export const HeroScenePage: React.FC<HeroScenePageProps> = ({ heroName }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [currentHero, setCurrentHero] = useState(heroName);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [cache, setCache] = useState(true);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchImage = async () => {
            const url = await getImageUrl2(currentHero);
            setImageUrl(url);
        };

        fetchImage();
    }, [currentHero]);
    useEffect(() => {
        setCurrentHero(heroName);
    }, [heroName]);

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    useEffect(() => {
        const loadVideoFromCache = async () => {
            const cachedVideoBlob = await getVideoFromIndexedDB(currentHero);

            if (cachedVideoBlob) {
                setVideoBlob(cachedVideoBlob);
                setVideoLoaded(true);
                setCache(true);
                setImageLoaded(true);
            } else {
                setCache(false);
            }
        };

        loadVideoFromCache();
    }, [currentHero]);

    useEffect(() => {
        const loadVideoFromNetwork = async () => {
            if (imageLoaded && !cache) { // Загружаем только если изображение загружено
                await fetchAndCacheVideo(currentHero, setVideoBlob);
                setVideoLoaded(true);
            }
        };

        loadVideoFromNetwork();
    }, [imageLoaded, cache, currentHero]);



    const handleLoadedData = () => {
        if (videoRef.current) {
            videoRef.current.play();
        }
    };

    return (
        <div className={styles.canvasContainer}>
            <div className={styles.diagonalOverlay}></div>
            {!(imageLoaded && videoLoaded) && !cache && (
                <img
                    src={imageUrl || ""}
                    alt={`${currentHero}`}
                    className={`${styles.heroVideo} ${styles[currentHero] || ''}`}
                    onLoad={handleImageLoad}
                />
            )}
            {imageLoaded && videoLoaded && (
                <video
                    ref={videoRef}
                    className={`${styles.heroVideo} ${styles[currentHero.replace(/'/g, '')] || ''}`}
                    onCanPlayThrough={handleLoadedData}
                    autoPlay
                    preload="auto"
                    loop
                    playsInline
                    muted
                >
                    <source
                        key={videoBlob ? URL.createObjectURL(videoBlob) : ''}
                        src={videoBlob ? URL.createObjectURL(videoBlob) : ''}
                        type="video/webm"
                    />
                </video>
            )}
        </div>
    );
};
