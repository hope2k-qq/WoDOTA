import styles from "./not_found.module.scss";
import {useTranslation} from "react-i18next";

export const NotFoundPage = () => {
    const { t } = useTranslation();
    return (
        <div className={styles.div}>
            <div className={styles.main_text}>404 - {t('page_not_found')}</div>
            <div className={styles.text}>{t('wrong_path')}</div>
        </div>
    );
};
