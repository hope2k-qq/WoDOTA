import styles from "./hero_differences.module.scss";
import React from "react";

export const HeroDifferences = () => {
    return (
        <div className={styles.overlay_block_right}>
            <div className={styles.overlay_block_right_title}>Отличия от Dota</div>
            <div className={styles.overlay_block_right_text}>В РАЗРАБОТКЕ...</div>
        </div>
    );
};

export {};
