import { useTranslation } from "react-i18next";
import { roleIcons } from "./author.constants";
import { ReactComponent as UserIcon } from "../../../../../assets/icons/UserIcon.svg";
import styles from "./about_author.module.scss";
import common from "../about_common.module.scss";

export const AuthorSection = () => {
    const { t } = useTranslation();

    const roles = roleIcons.map((icon, index) => ({
        icon,
        title: t(`about_author_role${index + 1}_title`),
        text: t(`about_author_role${index + 1}_text`),
    }));

    return (
        <section className={`${common.section} ${styles.author}`}>
            <div className={common.header}>
                <p className={common.eyebrow}>{t("about_author_eyebrow")}</p>
                <h2>{t("about_author_title")}</h2>
                <p>{t("about_author_subtitle")}</p>
            </div>

            <div className={styles.author_roles}>
                {roles.map((role) => (
                    <article className={styles.author_role} key={role.title}>
                        <span className={styles.author_role_icon}>{role.icon}</span>
                        <div className={styles.author_role_body}>
                            <h3>{role.title}</h3>
                            <p>{role.text}</p>
                        </div>
                    </article>
                ))}
            </div>

            <p className={styles.author_byline}>
                <span className={styles.author_byline_avatar}>
                    <UserIcon />
                </span>
                <span>
                    <b>hope2k</b> — {t("about_author_byline")}
                </span>
            </p>
        </section>
    );
};
