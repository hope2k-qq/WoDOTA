import React, {useEffect, useState} from "react";
import styles from "./join.module.scss";
import { ReactComponent as SteamIcon } from "../../../assets/icons/steam_icon.svg";

export const JoinSection: React.FC = () => {
    const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
    const API_URL = process.env.REACT_APP_API_URL;
    useEffect(() => {
        const fetchSubscriberCount = async () => {
            try {
                const response = await fetch(`${API_URL}/subscribers`);
                if (!response.ok) {
                    throw new Error('Failed to fetch subscriber count');
                }
                const data = await response.json();
                setSubscriberCount(data.subscriptions);
            } catch (err) {
                console.error('Error fetching subscriber count', err);
            }
        };

        fetchSubscriberCount();
    }, [API_URL]);

    return (
        <div className={styles.join_section}>
            <img src={"https://cdn.wodota.pro/home/join.webp"} alt={"join"} className={styles.image}/>
            <div className={styles.overlay}></div>
            <div className={styles.shadow_top}></div>
            <div className={styles.shadow_bottom}></div>
            <div className={styles.container}>
                <div className={styles.container}>
                    <div>
                        <span className={styles.text1}>ВСТУПАЙТЕ В</span>
                        <span className={styles.text2}>СООБЩЕСТВО</span>
                        <a
                            href="https://steamcommunity.com/sharedfiles/filedetails/?id=2880603428"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.cta_button}
                        >
                            <SteamIcon className={styles.icon}/>
                            <div className={styles.text_container}>
                                <span className={styles.main_text}>ИГРАТЬ БЕСПЛАТНО</span>
                                <span className={styles.sub_text}>СКАЧАТЬ В STEAM</span>
                            </div>
                        </a>
                    </div>
                    <div className={styles.container_subs}>
                        <div className={styles.subs_icon}>
                            <img src={"/subs_icon.png"} alt={"subs_icon"}/>
                        </div>
                        <span className={styles.count_subs}>{subscriberCount}</span>
                        <span className={styles.title_subs}>КОЛИЧЕСТВО ПОДПИСЧИКОВ</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
