import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import type { AboutIntroSectionProps, SiteStats } from "../../../../../types/about";
import { ReactComponent as SteamIcon } from "../../../../../assets/icons/steam_icon.svg";
import { ReactComponent as UsersIcon } from "../../../../../assets/icons/UsersIcon.svg";
import styles from "./about_intro.module.scss";

export const AboutIntroSection = ({ lang }: AboutIntroSectionProps) => {
    const { t } = useTranslation();
    const [stats, setStats] = useState<SiteStats>({ players: "0+", authorized: 0 });

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        if (!API_URL) {
            return;
        }

        axios
            .get<SiteStats>(`${API_URL}/site_stats`)
            .then((response) => setStats(response.data))
            .catch((err) => console.error("Error get stats:", err));
    }, [API_URL]);

    return (
        <section className={styles.about}>
            <h1 className={styles.about_title}>{t("about_title")}</h1>

            <div className={styles.about_wrapper}>
                <div className={styles.about_info}>
                    <div className={styles.about_content}>
                        <p className={styles.about_text}>{t("about_intro_text")}</p>
                        <div className={styles.about_badges}>
                            <Link to={`/${lang}/heroes`}>{t("about_badge_heroes")}</Link>
                            <Link to={`/${lang}/tournament`}>{t("about_badge_tournaments")}</Link>
                            <Link to={`/${lang}/votes`}>{t("about_badge_votes")}</Link>
                        </div>
                    </div>


                    <div className={styles.about_stats}>
                        <div className={styles.about_stat}>
                            <span className={styles.about_stat_icon}>
                                <UsersIcon />
                            </span>
                            <div className={styles.about_stat_body}>
                                <span>{stats.players}</span>
                                <span>{t("about_stat_players")}</span>
                            </div>
                        </div>
                        <div className={styles.about_stat}>
                            <span className={styles.about_stat_icon}>
                                <SteamIcon />
                            </span>
                            <div className={styles.about_stat_body}>
                                <span>{stats.authorized}</span>
                                <span>{t("about_stat_authorized")}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <img
                    className={styles.devices_mockup}
                    src="/about-devices.webp"
                    alt={t("about_devices_alt")}
                />
            </div>
        </section>
    );
};
