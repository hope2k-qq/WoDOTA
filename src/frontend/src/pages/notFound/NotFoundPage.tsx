import styles from "./not_found.module.scss";

export const NotFoundPage = () => {
    return (
        <div className={styles.div}>
            <div className={styles.main_text}>404 - Страница не найдена</div>
            <div className={styles.text}>Упс! Кажется, вы перешли по неверному пути.</div>
        </div>
    );
};
