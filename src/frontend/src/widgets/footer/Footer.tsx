import React, {useMemo} from "react";
import { ReactComponent as MessageIcon1 } from "../../assets/icons/MessageIcon1.svg";
import { ReactComponent as TelegramIcon } from "../../assets/icons/TelegramIcon.svg";
import {EmailLink} from "./components/emailLink/EmailLink";
import {useTranslation} from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { SUPPORT_EMAIL_HREF } from "../../constants/contacts";
import styles from "./footer.module.scss";


export const Footer: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const currentLang = location.pathname.split('/')[1];

    const buildPath = (path: string) => {
        const normalizedPath = path === '/' ? '' : path;
        return `/${currentLang}${normalizedPath}`;
    };

    const handleEmailClick = () => {
        window.location.href = SUPPORT_EMAIL_HREF;
    };

    const currentYear = useMemo(() => new Date().getFullYear(), []);

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.footer_logo}>
                    <img src={"/logo1.png"} alt="logo"/>
                </div>
                <div className={styles.text}>©2024-{currentYear} WoDOTA</div>
                <div className={styles.text}>{t('all_rights_reserved')}</div>
                <div className={styles.text}>{t('copying_prohibited')}</div>
            </div>
            <div className={styles.container}>
                <Link className={`${styles.text} ${styles.text_hover}`} to={buildPath('/terms')}>{t('footer_nav_terms')}</Link>
                <Link className={`${styles.text} ${styles.text_hover}`} to={buildPath('/privacy')}>{t('footer_nav_privacy')}</Link>
                <Link className={`${styles.text} ${styles.text_hover}`} to={buildPath('/contacts')}>{t('footer_nav_contacts')}</Link>
                <Link className={`${styles.text} ${styles.text_hover}`} to={buildPath('/cookies')}>{t('footer_nav_cookies')}</Link>
                <Link className={`${styles.text} ${styles.text_hover}`} to={buildPath('/faq')}>{t('footer_nav_faq')}</Link>
                <Link className={`${styles.text} ${styles.text_hover}`} to={buildPath('/about')}>{t('footer_nav_about')}</Link>
            </div>
            <div className={styles.container}>
                <div className={styles.email_container}>
                    <div className={styles.text}>{t('footer_email_label')}</div>
                    <div className={styles.email_text_container} onClick={handleEmailClick}>
                        <MessageIcon1 className={styles.icon1}/>
                        <EmailLink/>
                    </div>
                </div>
                <div  className={styles.icons_main_container}>
                    <div className={styles.text}>{t('footer_socials')}</div>
                    <div className={styles.icons_container}>
                        <div className={styles.icon_container} onClick={() => window.open("https://t.me/wodota_q", "_blank")}>
                            <TelegramIcon className={styles.telegram}/>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
