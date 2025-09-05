import React, { useState } from "react";
import styles from './сreators_videos.module.scss'
import { useTranslation } from "react-i18next";
import { useVideos } from "../../../hooks/useVideos";

export const CreatorsVideosPage = () => {
    const { t } = useTranslation();
    const API_URL = process.env.REACT_APP_API_URL;
    const { videos, loading } = useVideos(API_URL);

    const [visibleCount, setVisibleCount] = useState(20);

    if (loading) return <p></p>;

    const visibleVideos = videos.slice(0, visibleCount);

    const handleShowMore = () => {
        setVisibleCount((prev) => prev + 20);
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

    return (
        <main className={styles.container}>
            <h1 className={styles.title}>{t('wodota_content')}</h1>
            <section className={styles.grid}>
                {visibleVideos.map((video) => (
                    <article key={video.videoId} className={styles.card}>
                        <a
                            href={`https://www.youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.imageWrapper}
                        >
                            <img src={video.images} alt={video.title} className={styles.image} loading="lazy"/>
                        </a>
                        <div className={styles.info}>
                            <div>
                                <header className={styles.authorInfo}>
                                    <a href={video.authorUrl} target="_blank" rel="noopener noreferrer" className={styles.imageWrapperAvatar}>
                                        <img
                                            src={`${API_URL}/youtube/image-proxy?url=${encodeURIComponent(video.authorAvatar)}`}
                                            alt={video.authorName}
                                            className={styles.avatar}
                                            loading="lazy"
                                        />
                                    </a>
                                    <div className={styles.authorDetails}>
                                        <p className={styles.authorName}>{video.authorName}</p>
                                        <p className={styles.authorName}>{video.subscriberCount} {t('subscribers')}</p>
                                    </div>
                                </header>
                                <h2 className={styles.videoTitle}>{video.title}</h2>
                            </div>
                            <footer className={styles.videoHeader}>
                                <hr className={styles.divider}/>
                                <time className={styles.publishedAt}>{formatDate(video.publishedAt)}</time>
                            </footer>
                        </div>
                    </article>
                ))}
            </section>

            {visibleCount < videos.length && (
                <button onClick={handleShowMore} className={styles.showMoreBtn}>{t('show_more')}</button>
            )}
        </main>
    );
};
