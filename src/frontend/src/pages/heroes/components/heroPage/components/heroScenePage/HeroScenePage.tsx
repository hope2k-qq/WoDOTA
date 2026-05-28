import { useRef, useEffect, useState } from 'react';
import styles from './hero_scene_page.module.scss';
import {getImageUrl2, fetchVideoUrl} from '../../../../../../utils/videoUtils';

interface HeroScenePageProps {
    heroName: string;
}

export const HeroScenePage: React.FC<HeroScenePageProps> = ({ heroName }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [currentHero, setCurrentHero] = useState(heroName);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [posterUrl, setPosterUrl] = useState<string | null>(null);

    useEffect(() => {
        setCurrentHero(heroName);
    }, [heroName]);

    useEffect(() => {
        if (!posterUrl) return;
        const img = new Image();
        img.src = posterUrl;
    }, [posterUrl]);

    useEffect(() => {
        const loadPoster = async () => {
            const url = await getImageUrl2(currentHero);
            setPosterUrl(url);
        };

        loadPoster();
    }, [currentHero]);

    useEffect(() => {
        const loadVideo = async () => {
            try {
                const url = await fetchVideoUrl(currentHero);
                setVideoUrl(url);
            } catch (e) {
                console.error(e);
            }
        };

        loadVideo();
    }, [currentHero]);

    useEffect(() => {
        if (!videoUrl) return;

        const video = videoRef.current;
        if (!video) return;

        video.play().catch(() => {});
    }, [videoUrl]);

    // if (!posterUrl) return null;

    return (

        <div className={styles.canvasContainer}>
            <div className={styles.diagonalOverlay}></div>

            <video
                ref={videoRef}
                className={`${styles.heroVideo} ${styles[currentHero.replace(/'/g, '')] || ''}`}
                poster={posterUrl || undefined}
                preload="metadata"
                loop
                muted
                playsInline
                controls={false}
            >
                {videoUrl && (
                    <source src={videoUrl} type="video/webm" />
                )}
            </video>
        </div>
    );
};