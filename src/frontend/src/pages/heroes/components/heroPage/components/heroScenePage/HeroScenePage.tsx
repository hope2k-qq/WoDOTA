import styles from './hero_scene_page.module.scss';
// {getImageUrl2, fetchVideoUrl} from '../../../../../../utils/videoUtils';
import replacements_heroes from '../../../../../../data/replacements_heroes.json';
import {getImageUrl} from "../../../../../../utils/r2Storage";
interface HeroScenePageProps {
    heroName: string;
}

export const HeroScenePage: React.FC<HeroScenePageProps> = ({ heroName }) => {

    const heroes: Record<string, string> = replacements_heroes.heroes;
    const displayHeroName = heroes[heroName] || heroName;
    // const videoRef = useRef<HTMLVideoElement | null>(null);
    // const [currentHero, setCurrentHero] = useState(heroName);
    // const [videoUrl, setVideoUrl] = useState<string | null>(null);
    // const [posterUrl, setPosterUrl] = useState<string | null>(null);
    //
    // useEffect(() => {
    //     setCurrentHero(heroName);
    // }, [heroName]);
    //
    // useEffect(() => {
    //     if (!posterUrl) return;
    //     const img = new Image();
    //     img.src = posterUrl;
    // }, [posterUrl]);
    //
    // useEffect(() => {
    //     const loadPoster = async () => {
    //         const url = await getImageUrl2(currentHero);
    //         setPosterUrl(url);
    //     };
    //
    //     loadPoster();
    // }, [currentHero]);
    //
    // useEffect(() => {
    //     const loadVideo = async () => {
    //         try {
    //             const url = await fetchVideoUrl(currentHero);
    //             setVideoUrl(url);
    //         } catch (e) {
    //             console.error(e);
    //         }
    //     };
    //
    //     loadVideo();
    // }, [currentHero]);
    //
    // useEffect(() => {
    //     if (!videoUrl) return;
    //
    //     const video = videoRef.current;
    //     if (!video) return;
    //
    //     video.play().catch(() => {});
    // }, [videoUrl]);

    // if (!posterUrl) return null;

    return (

        <div className={styles.canvasContainer}>
            <div className={styles.diagonalOverlay}></div>
            <video
                preload="auto"
                loop
                poster={getImageUrl(`heroes/renders/images/${displayHeroName}.webp`)}
                className={`${styles.heroVideo} ${styles[displayHeroName.replace(/'/g, '')] || ''}`}
                autoPlay
                muted
                playsInline
            >
                <source src={`https://cdn.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/${displayHeroName}.mov`} type='video/mp4; codecs="hvc1"'/>
                <source src={`https://cdn.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/${displayHeroName}.webm`} type='video/webm'/>
            </video>
            {/*<video*/}
            {/*    ref={videoRef}*/}
            {/*    className={`${styles.heroVideo} ${styles[currentHero.replace(/'/g, '')] || ''}`}*/}
            {/*    poster={posterUrl || undefined}*/}
            {/*    preload="metadata"*/}
            {/*    loop*/}
            {/*    muted*/}
            {/*    playsInline*/}
            {/*    controls={false}*/}
            {/*>*/}
            {/*    {videoUrl && (*/}
            {/*        // <source src={videoUrl} type="video/webm" />*/}
            {/*        <>*/}
            {/*            <source src={`https://cdn.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/${heroName}.mov`} type='video/mp4; codecs="hvc1"'/>*/}
            {/*            <source src={`https://cdn.steamstatic.com/apps/dota2/videos/dota_react/heroes/renders/${heroName}.webm`} type='video/webm'/>*/}
            {/*        </>*/}
            {/*    )}*/}
            {/*</video>*/}
        </div>
    );
};