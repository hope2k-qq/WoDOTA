import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { openDB } from 'idb';
import styles from "./heroes_section.module.scss";
import {useNavigate} from "react-router-dom";
import {getImageUrl} from "../../../utils/r2Storage";


const HeroCard: React.FC<{ hero: any; imageUrl: string | null }> = ({ hero, imageUrl }) => {
    const navigate = useNavigate();
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
            onClick={() => navigate(`/hero/${hero.name}`)}
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
    const navigate = useNavigate();
    const [imageUrl, setImageUrl] = useState<{ [key: string]: string | null }>({});
    // const [heroes, setHeroes] = useState<any[]>([]); // Store all heroes
    const [groupedHeroes, setGroupedHeroes] = useState<any[][]>([]); // Store groups of heroes
    // const [loading, setLoading] = useState(true);
    // const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.REACT_APP_API_URL;
    const CACHE_VERSION = 4;

    useEffect(() => {
        const cachedVersion = localStorage.getItem('cache-version');

        if (cachedVersion !== CACHE_VERSION.toString()) {
            localStorage.clear();

            openDB('heroes-db', CACHE_VERSION, {
                upgrade(db, oldVersion, newVersion) {
                    if (newVersion !== null && newVersion > oldVersion) {
                        if (!db.objectStoreNames.contains('heroes')) {
                            db.createObjectStore('heroes');
                        }
                    }
                }
            }).then(() => {
                localStorage.setItem('cache-version', CACHE_VERSION.toString());
            }).catch(err => {
                console.error('Error during DB upgrade:', err);
            });
        }

        const dbPromise = openDB('heroes-db', CACHE_VERSION, {
            upgrade(db, oldVersion, newVersion) {
                if (newVersion !== null && newVersion > oldVersion) {
                    if (!db.objectStoreNames.contains('heroes')) {
                        db.createObjectStore('heroes');
                    }
                }
            }
        });

        const fetchHeroesData = async () => {
            try {
                const response = await axios.get(`${API_URL}/heroes`);
                const data = response.data;
                // setHeroes(data);

                const db = await dbPromise;
                const updatedUrls: { [key: string]: string | null } = {};
                const imagePromises: Promise<void>[] = [];

                const imagesStore = db.transaction('heroes', 'readonly').objectStore('heroes');
                for (const hero of data) {
                    const cachedImage = await imagesStore.get(hero.name);
                    if (cachedImage) {
                        updatedUrls[hero.name] = URL.createObjectURL(cachedImage);
                    } else {
                        updatedUrls[hero.name] = null;
                    }
                }

                // setLoading(false);
                setImageUrl(updatedUrls);

                for (const hero of data) {
                    if (!updatedUrls[hero.name]) {
                        imagePromises.push(
                            (async () => {
                                const url = await getImageUrl(`images/heroes/heroesPreview/${hero.name}.webp`);
                                if (url) {
                                    const response = await fetch(url);
                                    const imageBlob = await response.blob();

                                    const imagesStore = db.transaction('heroes', 'readwrite').objectStore('heroes');
                                    await imagesStore.put(imageBlob, hero.name);

                                    updatedUrls[hero.name] = URL.createObjectURL(imageBlob);

                                    setImageUrl(prevState => ({
                                        ...prevState,
                                        [hero.name]: updatedUrls[hero.name],
                                    }));
                                } else {
                                    console.error(`Image URL for hero ${hero.name} not found.`);
                                }
                            })()
                        );
                    }
                }

                await Promise.all(imagePromises);

                // After data fetch, split heroes into 5 random groups
                const shuffledHeroes = data.sort(() => Math.random() - 0.5); // Shuffle heroes randomly
                const groups: any[][] = [];
                const groupSize = Math.ceil(shuffledHeroes.length / 5);

                for (let i = 0; i < 5; i++) {
                    groups.push(shuffledHeroes.splice(0, groupSize));
                }

                setGroupedHeroes(groups); // Set the groups of heroes

            } catch (error) {
                console.error('Error fetching hero data:', error);
                // setError('Failed to fetch hero data.');
            } finally {
                // setLoading(false);
            }
        };

        fetchHeroesData().catch(err => {
            console.error('Error in fetchHeroesData:', err);
        });
    }, [API_URL]);


    return (
        <section className={styles.heroes_section}>
            <div className={styles.container_video}>
                <video autoPlay loop muted playsInline className={styles.background_video}>
                    <source src="/wodota_heroes.mp4" type="video/mp4"/>
                    Ваш браузер не поддерживает видео.
                </video>
                <div className={styles.shadow_top}></div>
                <div className={styles.shadow_bottom}></div>
                <div className={styles.overlay}></div>
                <div className={styles.container_text}>
                    <span className={styles.text1}>КОГО ВЫ</span>
                    <span className={styles.text2}>ВЫБЕРИТЕ?</span>
                    <p className={styles.description}>Во вселенной World of Dota (основанной на Dota 2) представлено
                        множество разнообразных героев, каждый из которых
                        обладает уникальными способностями и игровым стилем.
                        Игровой стиль может изменяться в зависимости от того,
                        как вы решите прокачать таланты и какие предметы выберете
                        для своего героя. Это позволяет игрокам адаптировать персонажей
                        под свою стратегию или же нужду команды, что делает каждый матч
                        уникальным и непредсказуемым.</p>
                    <button className={styles.btn} onClick={() => navigate('/heroes')}>
                        ВСЕ ГЕРОИ
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
