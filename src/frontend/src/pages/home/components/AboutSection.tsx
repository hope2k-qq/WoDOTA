import React from "react";
import styles from "./about_section.module.scss";
import {useTranslation} from "react-i18next";
import {getImageUrl} from "../../../utils/r2Storage";

export const AboutSection: React.FC = () => {
    const { t } = useTranslation();
    return (
        <section className={styles.about_section}>
            <div className={styles.image_container}>
                <img src={getImageUrl("home/background_about.webp")} alt="about" className={styles.background_image}/>
                <div className={styles.shadow_top}></div>
                <div className={styles.shadow_bottom}></div>
                <div className={styles.overlay}>
                    <div className={styles.container}>
                        <h2 className={styles.title}>
                            {t('what_is')}<span className={styles.worldOfDota}>WORLD OF DOTA?</span>
                        </h2>
                        <p className={styles.text}>
                            {t('favorite_game_part1')}{" "}<strong style={{whiteSpace: "nowrap"}}>Dota
                            2</strong>{t('favorite_game_part2')}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
