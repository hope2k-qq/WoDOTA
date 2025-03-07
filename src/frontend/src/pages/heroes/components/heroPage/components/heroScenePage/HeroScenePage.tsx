import { useRef, useEffect, useState, useCallback } from 'react';
import styles from './hero_scene_page.module.scss';
import { fetchAndCacheVideo, getImageUrl } from '../../../../../../utils/videoUtils';

interface HeroScenePageProps {
    heroName: string;
}

const replacements_heroes: { [key: string]: string } = {
    roshan: 'arc_warden',
    creep: 'chen',
    aghanim: 'meepo',
    wraith_king: 'skeleton_king',
    shadow_fiend: 'nevermore',
    necrophos: 'necrolyte',
    "nature's_prophet": 'furion',
    vengeful_spirit: 'vengefulspirit',
    'anti-mage': 'antimage',
    zeus: 'zuus',
};

export const HeroScenePage: React.FC<HeroScenePageProps> = ({ heroName }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [currentHero, setCurrentHero] = useState(heroName);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [videoLoaded, setVideoLoaded] = useState(false);

    const handleVideoError = useCallback(() => {
        console.log(`Error loading video for hero: ${currentHero}`);
        const replacementHero = replacements_heroes[currentHero];
        if (replacementHero && replacementHero !== currentHero) {
            console.log(`Switching to replacement hero: ${replacementHero}`);
            setCurrentHero(replacementHero);
            fetchAndCacheVideo(replacementHero, setVideoBlob, setVideoLoaded, handleVideoError);
        }
    }, [currentHero]);

    useEffect(() => {
        console.log(`Hero name changed to: ${heroName}`);
        setCurrentHero(heroName);
        fetchAndCacheVideo(heroName, setVideoBlob, setVideoLoaded, handleVideoError);
    }, [heroName, handleVideoError]);

    const handleLoadedData = () => {
        console.log('Video loaded successfully');
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
        }
    };

    return (
        <div className={styles.canvasContainer}>
            <div className={styles.diagonalOverlay}></div>
            {videoLoaded ? (
                <video
                    ref={videoRef}
                    className={`${styles.heroVideo} ${styles[currentHero.replace(/'/g, '')] || ''}`}
                    onLoadedData={handleLoadedData}
                    onError={handleVideoError} // Используем handleVideoError здесь
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
            ) : (
                <img
                    src={getImageUrl(currentHero)}
                    alt={`${currentHero}`}
                    className={`${styles.heroVideo} ${styles[currentHero] || ''}`}
                />
            )}
        </div>
    );
};
