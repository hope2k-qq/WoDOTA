import React from "react";
import styles from "./hero_section.module.scss";
import { ReactComponent as SteamIcon } from "../../../assets/icons/steam_icon.svg";
import {useTranslation} from "react-i18next";

export const HeroSection: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className={styles.hero_section}>
            <video autoPlay loop muted playsInline poster={"/wodota_poster.jpg"} preload={"auto"} className={styles.background_video}>
                <source src="https://cdn.wodota.pro/home/wodota.mp4" type="video/mp4"/>
                Ваш браузер не поддерживает видео.
            </video>
            <div className={styles.overlay}></div>
            <div className={styles.shadow_bottom}></div>
            <div className={styles.overlay_content}>
                <h1 className={styles.title}>
                    WORLD OF DOTA<span className={styles.whiteText}><span className={styles.dash}> - </span>
                    <br className={styles.mobileBreak} />{t('best_custom_game')}</span>
                </h1>
                <p className={styles.description}>
                    {t('description_part1')} {" "}
                    <strong style={{ whiteSpace: "nowrap" }}>Dota 2</strong>{t('description_part2')}
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
