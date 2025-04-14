import React from "react";
import "swiper/css";
import "swiper/css/pagination";
import styles from "./features_section.module.scss";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";

export const FeaturesSection: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <section className={styles.features_section}>
            <div className={styles.container}>
                <div>
                    <h2 className={styles.title}>{t('game_modes')}</h2>
                    <div className={styles.featureContainer}>
                        <div className={styles.featureItem}>
                            <div className={styles.container_image}>
                                <img src="https://cdn.wodota.pro/home/rating.webp" alt="rating" className={styles.featureImage}/>
                                <div className={styles.overlay}></div>
                                <div className={styles.shadow_bottom}></div>
                            </div>
                            <div className={styles.textBlock}>
                                <h3 className={styles.modeTitle}>{t('ranked_matches')}</h3>
                                <p className={styles.modeDescription}>{t('ranked_matches_description')}</p>
                            </div>
                        </div>
                        <div className={styles.featureItem}>
                            <div className={styles.container_image}>
                                <img src="https://cdn.wodota.pro/home/arena.webp" alt="arena" className={styles.featureImage}/>
                                <div className={styles.overlay}></div>
                                <div className={styles.shadow_bottom}></div>
                            </div>
                            <div className={styles.textBlock}>
                                <h3 className={styles.modeTitle}>{t('arena_mode')}</h3>
                                <p className={styles.modeDescription}>{t('arena_mode_description')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className={styles.title}>{t('deep_heroes')}</h2>
                    <div className={`${styles.featureContainer} ${styles.featureContainerSolo}`}>
                        <div className={styles.container_image}>
                            <img src="https://cdn.wodota.pro/home/talents.webp" alt="talents" className={styles.featureImage}/>
                            <div className={styles.overlay}></div>
                            <div className={styles.shadow_bottom}></div>
                        </div>
                        <div className={styles.textBlockSolo}>
                            <h3 className={styles.modeTitle} style={{marginTop: 0}}>{t('unique_talents')}</h3>
                            <p className={styles.modeDescription}>
                                {t('unique_talents_description1')}{" "}<strong style={{ whiteSpace: "nowrap" }}>Dota 2</strong>{t('unique_talents_description2')}
                            </p>
                            <button className={styles.btn} onClick={() => navigate('/heroes')}>
                                {t('all_heroes')}
                            </button>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className={styles.title}>{t('regular_tournaments')}</h2>
                    <div className={`${styles.featureContainer} ${styles.featureContainerSolo}`}>
                        <div className={styles.textBlockSolo}>
                            <h3 className={styles.modeTitle} style={{marginTop: 0}}>{t('test_strength_tournaments')}</h3>
                            <p className={styles.modeDescription}>{t('strength_tournaments_description')}</p>
                            <button className={styles.btn} onClick={() => navigate('/tournament')}>
                                {t('to_tournaments')}
                            </button>
                        </div>
                        <div className={styles.container_image}>
                            <video autoPlay loop muted playsInline preload={"auto"} poster={"/tournament_poster.jpg"}
                                   className={styles.featureImage}>
                                <source src="https://cdn.wodota.pro/home/tournament.mp4" type="video/mp4"/>
                                Ваш браузер не поддерживает видео.
                            </video>
                            <div className={styles.overlay}></div>
                            <div className={styles.shadow_bottom}></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

    );
};
