import React from "react";
import "swiper/css";
import "swiper/css/pagination";
import styles from "./features_section.module.scss";
import {useNavigate} from "react-router-dom";

export const FeaturesSection: React.FC = () => {
    const navigate = useNavigate();

    return (
        <section className={styles.features_section}>
            <div className={styles.container}>
                <div>
                    <h2 className={styles.title}>РАЗНЫЕ РЕЖИМЫ ИГРЫ</h2>
                    <div className={styles.featureContainer}>
                        <div className={styles.featureItem}>
                            <div className={styles.container_image}>
                                <img src="https://wodota.pro/images/home/rating.webp" alt="rating" className={styles.featureImage}/>
                                <div className={styles.overlay}></div>
                                <div className={styles.shadow_bottom}></div>
                            </div>
                            <div className={styles.textBlock}>
                                <h3 className={styles.modeTitle}>РЕЙТИНГОВЫЕ МАТЧИ</h3>
                                <p className={styles.modeDescription}>Соревнуйтесь с другими игроками, повышайте свой
                                    рейтинг и становитесь чемпионом, играя в одиночку или в дуо.</p>
                            </div>
                        </div>
                        <div className={styles.featureItem}>
                            <div className={styles.container_image}>
                                <img src="https://wodota.pro/images/home/arena.webp" alt="arena" className={styles.featureImage}/>
                                <div className={styles.overlay}></div>
                                <div className={styles.shadow_bottom}></div>
                            </div>
                            <div className={styles.textBlock}>
                                <h3 className={styles.modeTitle}>АРЕНА МОД</h3>
                                <p className={styles.modeDescription}>Хотите поиграть в одиночку или в команде, фармя
                                    крипов? Тогда режим «Арена» идеально вам подойдёт! В этом режиме вы будете фармить
                                    волны крипов, стремясь занять место в топе.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className={styles.title}>ГЛУБОКАЯ ПРОРАБОТКА ГЕРОЕВ</h2>
                    <div className={`${styles.featureContainer} ${styles.featureContainerSolo}`}>
                        <div className={styles.container_image}>
                            <img src="https://wodota.pro/images/home/talents.webp" alt="talents" className={styles.featureImage}/>
                            <div className={styles.overlay}></div>
                            <div className={styles.shadow_bottom}></div>
                        </div>
                        <div className={styles.textBlockSolo}>
                            <h3 className={styles.modeTitle} style={{marginTop: 0}}>УНИКАЛЬНЫЕ ТАЛАНТЫ И ГЕРОИ</h3>
                            <p className={styles.modeDescription}>
                                Каждый герой обладает особыми талантами, а некоторые — уникальными способностями,
                                которых нет в <strong>Dota 2</strong>.
                                Более того, в игре представлены кастомные персонажи, полностью отсутствующие в
                                оригинале!
                                Это открывает безграничные возможности для тактики и новых игровых стилей, делая каждую
                                битву по-настоящему уникальной.
                            </p>
                            <button className={styles.btn} onClick={() => navigate('/heroes')}>
                                ВСЕ ГЕРОИ
                            </button>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className={styles.title}>РЕГУЛЯРНЫЕ ТУРНИРЫ</h2>
                    <div className={`${styles.featureContainer} ${styles.featureContainerSolo}`}>
                        <div className={styles.textBlockSolo}>
                            <h3 className={styles.modeTitle} style={{marginTop: 0}}>ПРОВЕРЬ СВОИ СИЛЫ В ТУРНИРАХ</h3>
                            <p className={styles.modeDescription}>Принимайте участие в регулярных турнирах, соревнуйтесь
                                с сильнейшими и
                                завоевывайте призы. Покажите свои навыки в одиночных и командных соревнованиях!</p>
                            <button className={styles.btn} onClick={() => navigate('/tournament')}>
                                К ТУРНИРАМ
                            </button>
                        </div>
                        <div className={styles.container_image}>
                            <video autoPlay loop muted playsInline className={styles.featureImage}>
                                <source src="/tournament.mp4" type="video/mp4"/>
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
