import React from "react";
import styles from "./about_section.module.scss";

export const AboutSection: React.FC = () => {
    return (
        <section className={styles.about_section}>
            <div className={styles.image_container}>
                <img src={"https://wodota.pro/images/home/background_about.webp"} alt="about" className={styles.background_image}/>
                <div className={styles.shadow_top}></div>
                <div className={styles.shadow_bottom}></div>
                <div className={styles.overlay}>
                    <div className={styles.container}>
                        <h2 className={styles.title}>
                            ЧТО ТАКОЕ <span className={styles.worldOfDota}>WORLD OF DOTA?</span>
                        </h2>
                        <p className={styles.text}>
                            World of Dota – это кастомная игра на всеми любимую игру <strong>Dota 2</strong>.
                            Мы взяли все самое лучшее из Dota 2 и добавили уникальные механики, чтобы
                            создать незабываемые моменты для игроков. Если вы любите стратегии и
                            командные игры, World of Dota – для вас! Испытайте новые тактики и билды, исследуйте
                            свежие возможности и докажите своё мастерство в World of Dota.
                            Готовы ли вы войти в бой и стать легендой?
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
