import React, {useMemo} from "react";
import styles from "./footer.module.scss";
import { ReactComponent as MessageIcon1 } from "../../assets/icons/MessageIcon1.svg";
import { ReactComponent as MessageIcon2 } from "../../assets/icons/MessageIcon2.svg";
import { ReactComponent as DiscrordIcon } from "../../assets/icons/DiscordIcon.svg";
import {EmailLink} from "./components/emailLink/EmailLink";
import {useTranslation} from "react-i18next";


export const Footer: React.FC = () => {
    const { t } = useTranslation();
    const handleEmailClick = () => {
        const emailPart1 = "support";
        const emailPart2 = "wodota";
        const emailPart3 = "pro";
        const email = `${emailPart1}@${emailPart2}.${emailPart3}`;
        window.location.href = `mailto:${email}`;
    };

    const currentYear = useMemo(() => new Date().getFullYear(), []);

    return (
        <footer className={styles.footer}>
            <div className={styles.footer_logo}>
                <img src={"/logo1.png"} alt="logo"/>
            </div>
            <div className={styles.container_icons}>
                <div className={styles.email_container} onClick={handleEmailClick}>
                    <MessageIcon1 className={styles.icon1}/>
                    <MessageIcon2 className={styles.icon2}/>
                    <EmailLink/>
                </div>
                <div className={styles.discord_container}
                     onClick={() => window.open("https://discordapp.com/users/554572803580624897", "_blank")}>
                    <DiscrordIcon className={styles.discord}/>
                </div>
            </div>
            <div className={styles.text}>©{currentYear} WoDOTA. {t('all_rights_reserved')}</div>
            <div className={styles.text}>{t('copying_prohibited')}</div>
        </footer>
    );
};
