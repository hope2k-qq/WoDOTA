import { useTranslation } from "react-i18next";
import { TG_URL } from "./news.constants";
import { ReactComponent as CheckIcon } from "../../../../../assets/icons/CheckIcon.svg";
import { ReactComponent as TelegramIcon } from "../../../../../assets/icons/TelegramIcon.svg";
import styles from "./about_news.module.scss";
import common from "../about_common.module.scss";

export const NewsSection = () => {
    const { t } = useTranslation();

    const newsPoints = [1, 2, 3].map((n) => t(`about_news_point${n}`));

    return (
        <section className={common.section}>
            <div className={styles.news_card}>
                <div className={styles.news_info}>
                    <div className={common.header}>
                        <p className={common.eyebrow}>{t("about_news_eyebrow")}</p>
                        <h2>{t("about_news_title")}</h2>
                        <p>{t("about_news_subtitle")}</p>
                    </div>

                    <p className={styles.news_list_label}>{t("about_news_list_label")}</p>
                    <ul className={styles.news_list}>
                        {newsPoints.map((point) => (
                            <li key={point}>
                                <span className={styles.news_list_icon} aria-hidden="true">
                                    <CheckIcon />
                                </span>
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={styles.news_qr}>
                    <div className={styles.news_qr_frame}>
                        <img
                            className={styles.news_qr_img}
                            src="/wodota-tg-qr.svg"
                            alt={t("about_news_qr_alt")}
                            width={160}
                            height={160}
                        />
                    </div>

                    <p className={styles.news_qr_hint}>{t("about_news_qr_hint")}</p>

                    <a
                        className={styles.news_subscribe}
                        href={TG_URL}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <TelegramIcon />
                        {t("about_news_subscribe")}
                    </a>
                </div>
            </div>
        </section>
    );
};
