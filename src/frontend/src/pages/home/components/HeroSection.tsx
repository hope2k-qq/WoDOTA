import React, {useEffect, useState} from "react";
import styles from "./hero_section.module.scss";
import { ReactComponent as SteamIcon } from "../../../assets/icons/steam_icon.svg";
import { ReactComponent as ArrowRightIcon } from "../../../assets/icons/ArrowRightIcon.svg";
import {useTranslation} from "react-i18next";
import axios from "axios";
import {useLocation, useNavigate} from "react-router-dom";

type Video = {
    title: string;
    videoId: string;
    publishedAt: string;
    images: string;
    authorName: string;
    authorAvatar: string;
    subscriberCount: number;
    authorUrl: string;
};

const localeMap: Record<string, string> = {
    ru: 'ru-RU',
    en: 'en-US',
    uk: 'uk-UA',
    cs: 'cs-CZ',
};

export const HeroSection: React.FC = () => {
    const { t } = useTranslation();
    const [videos, setVideos] = useState<Video[]>([]);
    const API_URL = process.env.REACT_APP_API_URL;
    const [videosToShow, setVideosToShow] = useState(3);
    const navigate = useNavigate();
    const location = useLocation();
    const lang = location.pathname.split('/')[1];
    useEffect(() => {
        const updateVideoCount = () => {
            if (window.innerWidth <= 800) {
                setVideosToShow(4);
            } else {
                setVideosToShow(3);
            }
        };

        updateVideoCount();

        window.addEventListener("resize", updateVideoCount);
        return () => window.removeEventListener("resize", updateVideoCount);
    }, []);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await axios.get(`${API_URL}/youtube`);
                const videoData = res.data;

                videoData.forEach((video: Video) => {
                    const img = new Image();
                    img.src = video.authorAvatar;
                });

                setVideos(res.data);
            } catch (error) {
                console.error("Ошибка при загрузке видео:", error);
            }
        };

        fetchVideos();
    }, [API_URL]);
    return (
        <div className={styles.hero_section}>
            <video autoPlay loop muted playsInline poster={"/wodota_poster.jpg"} preload={"auto"} className={styles.background_video}>
                <source src="https://cdn.wodota.pro/home/wodota.mp4" type="video/mp4"/>
                Ваш браузер не поддерживает видео.
            </video>
            <div className={styles.overlay}></div>
            <div className={styles.grid_container}>
                <div className={styles.container_news}>
                    <div className={styles.title_news}>{t('latest_videos')}</div>
                    <div className={styles.actions_news}>
                        <div className={styles.show_all_news} onClick={() => navigate(`/${lang}/creators/videos`)}>
                            {t('show_all')}
                        </div>
                        <ArrowRightIcon className={styles.icon_news}/>
                    </div>
                </div>
                <div className={styles.grid}>
                    {videos.slice(0, videosToShow).map((video) => (
                        <div key={video.videoId} className={styles.card}>
                            <a
                                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.imageWrapper}
                            >
                                <img src={video.images} alt={video.title} className={styles.image}/>
                                <div className={styles.shadow_bottom_2}></div>
                                {/*<div className={styles.overlay2}></div>*/}
                                <div className={styles.info}>
                                    <div className={styles.info_container}>
                                        <div className={styles.authorInfo}>
                                            <a href={video.authorUrl} target="_blank" rel="noopener noreferrer"
                                               className={styles.imageWrapper}>
                                                <img
                                                    src={`${API_URL}/youtube/image-proxy?url=${encodeURIComponent(video.authorAvatar)}`}
                                                    alt={video.authorName}
                                                    className={styles.avatar}
                                                />
                                            </a>
                                            <div className={styles.authorDetails}>
                                                <p className={styles.authorName}>{video.authorName}</p>
                                                <p className={styles.authorName}>{video.subscriberCount} {t('subscribers')}</p>
                                            </div>
                                        </div>
                                        <p className={styles.publishedAt}>
                                            {new Date(video.publishedAt).toLocaleDateString(localeMap[lang], {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>

                                    <h2 className={styles.videoTitle}>{video.title}</h2>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.shadow_bottom}></div>
            <div className={styles.overlay_content}>
                <h1 className={styles.title}>
                    WORLD OF DOTA<span className={styles.whiteText}><span className={styles.dash}> - </span>
                    <br className={styles.mobileBreak}/>{t('best_custom_game')}</span>
                </h1>
                <p className={styles.description}>
                    {t('description_part1')} {" "}
                    <strong style={{whiteSpace: "nowrap"}}>Dota 2</strong>{t('description_part2')}
                </p>
                <a
                    href="https://steamcommunity.com/sharedfiles/filedetails/?id=2880603428"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cta_button}
                >
                    <SteamIcon className={styles.icon}/>
                    <div className={styles.text_container}>
                        <span className={styles.main_text}>{t('play_for_free')}</span>
                        <span className={styles.sub_text}>{t('download_steam')}</span>
                    </div>
                </a>

            </div>
        </div>
    );
};
