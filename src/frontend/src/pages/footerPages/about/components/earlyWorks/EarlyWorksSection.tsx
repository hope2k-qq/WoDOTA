import { useTranslation } from "react-i18next";
import { ReactComponent as ArrowDownIcon } from "../../../../../assets/icons/ArrowDownIcon.svg";
import styles from "./about_early.module.scss";
import common from "../about_common.module.scss";

export const EarlyWorksSection = () => {
    const { t } = useTranslation();

    const earlyWorks = [1, 2].map((n) => ({
        title: t(`about_early${n}_title`),
        before: t(`about_early${n}_before`),
        after: t(`about_early${n}_after`),
    }));

    return (
        <section className={common.section}>
            <div className={common.header}>
                <p className={common.eyebrow}>{t("about_early_eyebrow")}</p>
                <h2>{t("about_early_title")}</h2>
                <p>{t("about_early_subtitle")}</p>
            </div>

            <div className={styles.early_flex}>
                {earlyWorks.map((item) => (
                    <article className={styles.early_card} key={item.title}>
                        <h3>{item.title}</h3>

                        <div className={styles.early_row}>
                            <span className={`${styles.early_label} ${styles.early_label_before}`}>
                                {t("about_early_before")}
                            </span>
                            <p>{item.before}</p>
                        </div>

                        <div className={styles.early_arrow} aria-hidden="true">
                            <ArrowDownIcon />
                        </div>

                        <div className={styles.early_row}>
                            <span className={`${styles.early_label} ${styles.early_label_after}`}>
                                {t("about_early_after")}
                            </span>
                            <p>{item.after}</p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};
