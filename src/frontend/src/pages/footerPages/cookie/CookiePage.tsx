import { useTranslation } from "react-i18next";
import { cookieSections } from "./cookie.constants";
import { SUPPORT_EMAIL } from "../../../constants/contacts";
import styles from "./cookie.module.scss";

export const CookiePage = () => {
    const { t } = useTranslation();

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>

                <h1 className={styles.title}>{t("cookie_title")}</h1>
                <p className={styles.updated}>{t("cookie_updated")}</p>

                {cookieSections.map((section) => (
                    <section key={section.num} className={styles.section}>
                        <h2 className={styles.item}>
                            <span className={styles.num}>{section.num}</span>
                            <span className={styles.text}>{t(section.titleKey)}</span>
                        </h2>

                        {section.clauses.map((clause) => (
                            <p key={clause.num} className={`${styles.item} ${styles.sub_item}`}>
                                <span className={styles.num}>{clause.num}</span>
                                {clause.definitions ? (
                                    <div>
                                        <span className={styles.text}>{t(clause.introKey!)}</span>
                                        <ul className={styles.list}>
                                            {clause.definitions.map((def) => (
                                                <li key={def.termKey} className={`${styles.sub_item} ${styles.list_item}`}>
                                                    <span className={styles.num}>{t(def.termKey)}</span>
                                                    {t(def.descKey)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <span className={styles.text}>{t(clause.textKey!).replace("__EMAIL__", SUPPORT_EMAIL)}</span>
                                )}
                            </p>
                        ))}
                    </section>
                ))}

            </div>
        </div>
    );
};
