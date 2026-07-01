import { useTranslation } from "react-i18next";
import { termsSections } from "./terms.constants";
import { SUPPORT_EMAIL } from "../../../constants/contacts";
import styles from "./terms_of_service.module.scss";

export const TermsOfService = () => {
    const { t } = useTranslation();

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>

                <h1 className={styles.title}>{t("terms_title")}</h1>
                <p className={styles.updated}>{t("terms_updated")}</p>

                {termsSections.map((section) => (
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
