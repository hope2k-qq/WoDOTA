import { useTranslation } from "react-i18next";
import { privacySections } from "./privacy.constants";
import { SUPPORT_EMAIL } from "../../../constants/contacts";
import styles from "./privacy_policy.module.scss";

export const PrivacyPolicyPage = () => {
    const { t } = useTranslation();

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>

                <h1 className={styles.title}>{t("privacy_title")}</h1>
                <p className={styles.updated}>{t("privacy_updated")}</p>

                {privacySections.map((section) => (
                    <section key={section.titleKey} className={styles.section}>
                        <h2>{t(section.titleKey)}</h2>
                        <p>{t(section.textKey).replace("__EMAIL__", SUPPORT_EMAIL)}</p>
                    </section>
                ))}

            </div>
        </div>
    );
};
