import {useParams} from 'react-router-dom';
import styles from './hero_page.module.scss';
import { HeroScenePage } from './components/heroScenePage/HeroScenePage';
import AbilitiesSection from './AbilitiesSection';
import Abilities from './Abilities';
import RenderTalents from './RenderTalents';
import React, {useEffect, useRef, useState} from 'react';
import axios from 'axios';
import {HeroCharacteristics} from "./HeroCharacteristics";
//import {HeroDifferences} from "./HeroDifferences";
import {AbilityData, HeroInformation} from "../../../../types/heroes";
import {fetchAbilityImages} from "../../../../utils/abilityUtils";
import {getImageUrl} from "../../../../utils/r2Storage";
import {
    storeInIndexedDB,
    getFromIndexedDB,
    fetchVideoFromURL,
    cleanExpiredCache,
} from '../../../../utils/indexedDBUtils';
import {useTranslation} from "react-i18next";
import {useMyData} from "../../../../context/HeroesDataContext";

type AttributeType = 'int' | 'str' | 'agi' | 'uni';

interface AttributeData {
    text: string;
    image: string;
}

interface Hero {
    name: string;
    primary_attr: string;
    custom_hero: boolean;
}

const HeroPage: React.FC = () => {
    const { t } = useTranslation();
    const { name } = useParams<{ name: string }>();
    const [heroInformation, setHeroInformation] = useState<HeroInformation | null>(null);
    const [attribute, setAttribute] = useState<AttributeType | null>(null);
    const [isAbilitiesLoaded, setIsAbilitiesLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const API_URL = process.env.REACT_APP_API_URL;
    const abilitiesRef = useRef<HTMLDivElement | null>(null);
    const [abilitiesSrcs, setAbilitiesSrcs] = useState<{ [key: string]: string | null }>({});
    const [heroAbilities, setHeroAbilities] = useState<{
        [key: string]: AbilityData;
    } | null>(null);
    const [imageSrc, setImageSrc] = useState<{ [key: string]: string }>({});
    const [videoSrc, setVideoSrc] = useState<{ [key: string]: string }>({});
    const { heroesData, languageReady } = useMyData();

    useEffect(() => {
        if (name) {
            const formattedName = name
                .split("_") // делим по _
                .map(part =>
                    part
                        .split("-")
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join("-")
                )
                .join(" ");

            document.title = `WoDOTA (World of Dota) – ${formattedName}`;
        }
    }, [name]);

    useEffect(() => {
        if (!name) return;

        const getUpdatedPath = async (src: string, heroName: string, key: string, extension: string): Promise<string[]> => {
            const objectKey = `abilities_preview/${src}/${heroName}/${key}.${extension}`;
            const primaryUrl = await getImageUrl(objectKey);
            return primaryUrl ? [primaryUrl] : [];
        };

        const updatePaths = async () => {
            const keys = Object.keys(heroAbilities || {});

            for (const key of keys) {
                const imagePaths = await getUpdatedPath('images', name, key, "webp");

                let shouldLoadVideo = true;

                // Обработка кэша изображений
                if (imagePaths.length > 0) {
                    const imageUrl = imagePaths[0];
                    let imageBlob = await getFromIndexedDB("images", key);

                    if (!imageBlob) {
                        imageBlob = await fetchImageFromURL(imageUrl);

                        if (!imageBlob) {
                            imageBlob = await fetchImageFromURL('/noFound.png');
                            shouldLoadVideo = false;
                        }

                        await storeInIndexedDB("images", key, imageBlob);
                    }

                    const imageUrlObject = URL.createObjectURL(imageBlob);
                    setImageSrc((prev) => ({ ...prev, [key]: imageUrlObject }));
                } else {
                    const defaultBlob = await fetchImageFromURL('/noFound.png');
                    const imageUrlObject = URL.createObjectURL(defaultBlob);
                    setImageSrc((prev) => ({ ...prev, [key]: imageUrlObject }));
                    shouldLoadVideo = false;
                }

                if (shouldLoadVideo) {
                    const videoPaths = await getUpdatedPath('video', name, key, "webm");

                    if (videoPaths.length > 0) {
                        const videoUrl = videoPaths[0];
                        let videoBlob = await getFromIndexedDB("videos", key);

                        if (!videoBlob) {
                            videoBlob = await fetchVideoFromURL(videoUrl);
                            if (videoBlob) {
                                await storeInIndexedDB("videos", key, videoBlob);
                                const videoUrlObject = URL.createObjectURL(videoBlob);
                                setVideoSrc((prev) => ({ ...prev, [key]: videoUrlObject }));
                            }
                        } else {
                            const videoUrlObject = URL.createObjectURL(videoBlob);
                            setVideoSrc((prev) => ({ ...prev, [key]: videoUrlObject }));
                        }
                    }
                }
            }
        };


        updatePaths();
    }, [name, heroAbilities]);

    useEffect(() => {
        cleanExpiredCache();
    }, []);

    const fetchImageFromURL = async (url: string): Promise<Blob> => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch image');

            return await response.blob();
        } catch (error) {

            const fallbackResponse = await fetch('/noFound.png');
            if (!fallbackResponse.ok) {
                // console.error('Error fetching default image');
                throw new Error('Failed to load default image');
            }
            return await fallbackResponse.blob();
        }
    };



    useEffect(() => {
        if (heroAbilities) {
            const fetchImages = async () => {
                try {
                    const images = await fetchAbilityImages(heroAbilities);
                    setAbilitiesSrcs(images);
                } catch (error) {
                    //console.error('Error fetching ability images:', error);
                }
            };

            fetchImages();
        }
    }, [heroAbilities]);
    useEffect(() => {
        const cachedHeroes = localStorage.getItem("heroes-attributes");

        if (cachedHeroes) {
            const heroesData: Hero[] = JSON.parse(cachedHeroes);
            const hero = heroesData.find(hero => hero.name === name);

            if (hero) {
                setAttribute(hero.primary_attr as AttributeType);
                setIsLoading(false);
                return;
            }
        }

        axios.get<Hero[]>(`${API_URL}/heroes`)
            .then(response => {
                localStorage.setItem("heroes-attributes", JSON.stringify(response.data));

                const hero = response.data.find(hero => hero.name === name);
                if (hero) {
                    setAttribute(hero.primary_attr as AttributeType);
                }
            })
            .catch(error => {
                //console.error("Error fetching heroes data:", error);
            })
            .finally(() => {
                setIsLoading(false);
            });

    }, [API_URL, name]);


    useEffect(() => {
        let data;
        if(name){
            const fetchHeroDataFromCache = (heroName: string) => {
                if (heroesData) {
                    const heroData = heroesData[heroName];
                    if (heroData) {
                        setIsLoading(false);
                        return heroData;
                    } else {
                        return null;
                    }
                }

                return null;
            };
            data = fetchHeroDataFromCache(name);
        }
        if (data) {
            setHeroInformation(data);
            setHeroAbilities(data.abilities);
        }
    }, [name, heroesData]);





    useEffect(() => {
        const abilitiesElement = abilitiesRef.current;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setIsAbilitiesLoaded(true);
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (abilitiesElement) {
            observer.observe(abilitiesElement);
        }

        return () => {
            if (abilitiesElement) {
                observer.unobserve(abilitiesElement);
            }
        };
    }, []);



    const attributeData: Record<AttributeType, AttributeData> = {
        'int': {
            text: t('intelligence').toUpperCase(),
            image: '/int.png'
        },
        'str': {
            text: t('strength').toUpperCase(),
            image: '/str.png'
        },
        'agi': {
            text: t('agility').toUpperCase(),
            image: '/agi.png'
        },
        'uni': {
            text: t('universal').toUpperCase(),
            image: '/uni.png'
        }
    };

    if (!languageReady) return <div></div>;

    const renderAttribute = (attribute: AttributeType) => {
        const attributeInfo = attributeData[attribute];
        return (
            <div className={styles.block_name}>
                <img src={attributeInfo.image} alt={attributeInfo.text}/>
                <div className={styles.text_name_hero}>{attributeInfo.text}</div>
            </div>
        );
    };
    return (
        <div className={styles.div}>
            <div className={styles.heroSceneContainer}>
                <HeroScenePage heroName={name || 'slark'}/>
                <div className={styles.overlayBlock}>
                    {isLoading ? (
                        <div></div>
                    ) : (
                        <div>
                            {attribute ? renderAttribute(attribute) : <p>Атрибут не найден</p>}
                        </div>
                    )}
                    <div className={styles.overlayText}>
                        {name ? name.replace(/_/g, ' ').toUpperCase() : 'SLARK'}
                    </div>
                    <Abilities heroName={name || 'slark'} abilities={heroInformation?.abilities || {}}
                               abilitiesSrcs={abilitiesSrcs} videoSrc={videoSrc} imageSrc={imageSrc}
                               heroAbilities={heroAbilities}/>
                    <HeroCharacteristics heroName={name || 'slark'}
                                         characteristics={heroInformation?.characteristics || {}}/>
                </div>
                {/*<HeroDifferences/>*/}
            </div>
            <div className={styles.render_talents_container}>
                {isLoading ? (
                    <div></div>
                ) : (
                    <RenderTalents
                        hero_name={name || 'slark'}
                        talents_information={heroInformation?.talents_information || {}}
                        talents_description={heroInformation?.talents_description || {}}
                    />
                )}
            </div>
            <div ref={abilitiesRef} className={styles.abilitiesSectionContainer}>
                {isAbilitiesLoaded && <AbilitiesSection heroName={name || 'slark'}
                                                        abilities={heroInformation?.abilities || {}}
                                                        abilitiesSrcs={abilitiesSrcs}
                                                        videoSrc={videoSrc} imageSrc={imageSrc}
                                                        heroAbilities={heroAbilities}/>}

            </div>
        </div>
    );
};

export default HeroPage;