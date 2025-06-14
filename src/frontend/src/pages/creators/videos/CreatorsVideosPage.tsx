import React, { useEffect, useState } from "react";
import styles from './сreators_videos.module.scss'
import axios from "axios";
import {useTranslation} from "react-i18next";

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

export const CreatorsVideosPage = () => {
    const { t } = useTranslation();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(20);
    const API_URL = process.env.REACT_APP_API_URL;

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
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, [API_URL]);

    if (loading) return <p></p>;

    const visibleVideos = videos.slice(0, visibleCount);

    const handleShowMore = () => {
        setVisibleCount((prev) => prev + 20);
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{t('wodota_content')}</h1>
            <div className={styles.grid}>
                {visibleVideos.map((video) => (
                    <div key={video.videoId} className={styles.card}>
                        <a
                            href={`https://www.youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.imageWrapper}
                        >
                            <img src={video.images} alt={video.title} className={styles.image}/>

                        </a>
                        <div className={styles.info}>
                        <div>
                                <div className={styles.authorInfo}>
                                    <a href={video.authorUrl} target="_blank" rel="noopener noreferrer">
                                        <img
                                            // src={video.authorAvatar}
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
                                <h2 className={styles.videoTitle}>{video.title}</h2>
                            </div>
                            <div className={styles.videoHeader}>
                                <hr className={styles.divider}/>
                                <p className={styles.publishedAt}>
                                    {new Date(video.publishedAt).toLocaleString(undefined, {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                    })
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {visibleCount < videos.length && (
                <button onClick={handleShowMore} className={styles.showMoreBtn}>{t('show_more')}</button>
            )}
        </div>
    );
};
