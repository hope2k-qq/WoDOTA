import React from "react";
import styles from "./hero_section.module.scss";
import { ReactComponent as SteamIcon } from "../../../assets/icons/steam_icon.svg";

export const HeroSection: React.FC = () => {
    return (
        <div className={styles.hero_section}>
            <video autoPlay loop muted playsInline className={styles.background_video}>
                <source src="https://wodota.pro/images/home/wodota.mp4" type="video/mp4"/>
                Ваш браузер не поддерживает видео.
            </video>
            <div className={styles.overlay}></div>
            <div className={styles.shadow_bottom}></div>
            <div className={styles.overlay_content}>
                <h1 className={styles.title}>
                    WORLD OF DOTA<span className={styles.whiteText}><span className={styles.dash}> - </span>
                    <br className={styles.mobileBreak} />ЛУЧШАЯ КАСТОМНАЯ ИГРА</span>
                </h1>

                <p className={styles.description}>
                    «Добро пожаловать в World of Dota – уникальную кастомную игру, вдохновленную {" "}
                    <strong>Dota 2</strong>. Сражайтесь с друзьями, изучайте героев, каждый из которых обладает
                    множеством уникальных талантов!»
                </p>

                <a
                    href="https://steamcommunity.com/sharedfiles/filedetails/?id=2880603428"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.cta_button}
                >
                    <SteamIcon className={styles.icon}/>
                    <div className={styles.text_container}>
                        <span className={styles.main_text}>ИГРАТЬ БЕСПЛАТНО</span>
                        <span className={styles.sub_text}>СКАЧАТЬ В STEAM</span>
                    </div>
                </a>

            </div>
        </div>
    );
};
