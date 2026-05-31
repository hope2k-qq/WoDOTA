import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from "./heroes_section.module.scss";
import {useLocation, useNavigate} from "react-router-dom";
import {getImageUrl} from "../../../utils/r2Storage";
import {useTranslation} from "react-i18next";


const HeroCard: React.FC<{ hero: any; imageUrl: string | null }> = ({ hero, imageUrl }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const lang = location.pathname.split('/')[1];
    const getAttributeImage = (attr: string) => {
        switch (attr) {
            case 'str':
                return '/str.png';
            case 'agi':
                return '/agi.png';
            case 'int':
                return '/int.png';
            case 'uni':
                return '/uni.png';
            default:
                return '';
        }
    };
    return (
        <div
            onClick={() => navigate(`/${lang}/hero/${hero.name}`)}
            className={styles['hero-card']}
        >
            <img
                src={imageUrl || ''}
                alt={hero.name}
                className={styles['hero-image']}
            />
            <div className={styles['hero-info']}>
                <img
                    src={getAttributeImage(hero.primary_attr)}
                    alt={hero.primary_attr}
                    className={styles['attribute-image']}
                />
                <span className={styles['hero-name']}>
                    {hero.name.replace(/_/g, ' ')}
                </span>
            </div>
        </div>
    );
};


const HeroesSection: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const lang = location.pathname.split('/')[1];
    const [imageUrl, setImageUrl] = useState<{ [key: string]: string | null }>({});
    const [groupedHeroes, setGroupedHeroes] = useState<any[][]>([]);

    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchHeroesData = async () => {
            try {
                const response = await axios.get(`${API_URL}/heroes`);
                const data = response.data;

                // сразу сетим картинки без кеша
                const urls: { [key: string]: string | null } = {};

                for (const hero of data) {
                    const url = await getImageUrl(
                        `images/heroes/heroesPreview/${hero.name}.webp`
                    );

                    urls[hero.name] = url || null;
                }

                setImageUrl(urls);

                // группировка
                const shuffledHeroes = [...data].sort(() => Math.random() - 0.5);

                const groupSize = Math.ceil(shuffledHeroes.length / 5);
                const groups: any[][] = [];

                for (let i = 0; i < 5; i++) {
                    groups.push(shuffledHeroes.splice(0, groupSize));
                }

                setGroupedHeroes(groups);
            } catch (error) {
                console.error('Error fetching hero data:', error);
            }
        };

        fetchHeroesData();
    }, [API_URL]);


    return (
        <section className={styles.heroes_section}>
            <div className={styles.container_video}>
                <video autoPlay loop muted playsInline preload={"auto"} poster={"/wodota_heroes_poster.webp"} className={styles.background_video}>
                    <source src={getImageUrl("home/wodota_heroes.webm")} type="video/webm"/>
                    Ваш браузер не поддерживает видео.
                </video>
                <div className={styles.shadow_top}></div>
                <div className={styles.shadow_bottom}></div>
                <div className={styles.overlay}></div>
                <div className={styles.container_text}>
                    <span className={styles.text1}>{t('who_choose_part1')}</span>
                    <span className={styles.text2}>{t('who_choose_part2')}</span>
                    <p className={styles.description}>{t('who_choose_description')}</p>
                    <button className={styles.btn} onClick={() => navigate(`/${lang}/heroes`)}>
                        {t('all_heroes')}
                    </button>
                </div>
            </div>
            <div className={styles.works}>
                {groupedHeroes.map((group, groupIndex) => (
                    <div
                        className={`${styles.wrapper__works} ${[1, 3].includes(groupIndex) ? styles.reverse : styles.normal}`}
                        key={groupIndex}
                        // style={{width: `calc(200px * ${group.length * 5})`}}
                    >
                        {Array.from({ length: 5 }).map((_, index) => (
                            group.map((hero) => (
                                <HeroCard key={`${hero.name}-${index}`} hero={hero} imageUrl={imageUrl[hero.name]} />
                            ))
                        ))}

                    </div>
                ))}
            </div>
        </section>
    );
};

export default HeroesSection;
