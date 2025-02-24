import React, {useEffect, useMemo} from "react";
import styles from "./footer.module.scss";
import { ReactComponent as MessageIcon1 } from "../../assets/icons/MessageIcon1.svg";
import { ReactComponent as MessageIcon2 } from "../../assets/icons/MessageIcon2.svg";
import { ReactComponent as DiscrordIcon } from "../../assets/icons/DiscordIcon.svg";
import {EmailLink} from "./components/emailLink/EmailLink";


export const Footer: React.FC = () => {

    const handleEmailClick = () => {
        const emailPart1 = "wodota.help";
        const emailPart2 = "gmail";
        const emailPart3 = "com";
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
                <div className={styles.discord_container} onClick={() => window.open("https://discordapp.com/users/554572803580624897", "_blank")}>
                    <DiscrordIcon className={styles.discord}/>
                </div>
            </div>
            <div className={styles.text}>©{currentYear} WoDOTA.pro. Все права защищены.</div>
        </footer>
    );
};
