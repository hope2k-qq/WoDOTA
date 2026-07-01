import styles from "./contacts.module.scss";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { channels, documents } from "./contacts.constants";
import { ReactComponent as ChevronRightIcon } from "../../../assets/icons/ChevronRightIcon.svg";
import { ReactComponent as HelpCircleIcon } from "../../../assets/icons/HelpCircleIcon.svg";

export const ContactsPage = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const currentLang = location.pathname.split("/")[1];
    const domain = process.env.REACT_APP_DOMEN_URL;

    const buildPath = (path: string) => {
        const normalizedPath = path === "/" ? "" : path;
        return `/${currentLang}${normalizedPath}`;
    };

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{t("contacts_title")}</h1>
                </header>

                <section className={styles.section}>
                    <h2 className={styles.section_title}>{t("contacts_docs_title")}</h2>
                    <p className={styles.section_desc}>{t("contacts_docs_desc")}</p>

                    <div className={styles.documents}>
                        {documents.map((document) => (
                            <Link
                                key={document.path}
                                className={styles.document_card}
                                to={buildPath(document.path)}
                            >
                                <span className={styles.document_icon}>{document.icon}</span>
                                <span className={styles.document_body}>
                                    <span className={styles.document_title}>{t(document.titleKey)}</span>
                                    <span className={styles.document_url}>{`${domain}${document.path}`}</span>
                                </span>
                                <span className={styles.document_chevron}>
                                    <ChevronRightIcon />
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.section_title}>{t("contacts_questions_title")}</h2>
                    <p className={styles.section_desc}>{t("contacts_questions_desc")}</p>

                    <Link
                        className={`${styles.document_card} ${styles.faq_card}`}
                        to={buildPath("/faq")}
                    >
                        <span className={styles.document_icon}>
                            <HelpCircleIcon />
                        </span>
                        <span className={styles.document_body}>
                            <span className={styles.document_title}>{t("contacts_faq_card_title")}</span>
                            <span className={styles.document_url}>{`${domain}/faq`}</span>
                        </span>
                        <span className={styles.document_chevron}>
                            <ChevronRightIcon />
                        </span>
                    </Link>

                    <p className={`${styles.section_desc} ${styles.channels_desc}`}>
                        {t("contacts_channels_desc")}
                    </p>

                    <div className={styles.channels}>
                        {channels.map((channel) => (
                            <a
                                key={channel.label}
                                className={styles.channel_card}
                                href={channel.href}
                                {...(channel.external ? { target: "_blank", rel: "noreferrer" } : {})}
                            >
                                <span className={styles.channel_icon}>{channel.icon}</span>
                                <span className={styles.channel_body}>
                                    <span className={styles.channel_label}>{channel.label}</span>
                                    <span className={styles.channel_value}>{channel.value}</span>
                                </span>
                            </a>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};
