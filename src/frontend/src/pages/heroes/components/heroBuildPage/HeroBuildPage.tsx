
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {HeroInformation} from "../../../../types/heroes";
import RenderTalents from "../heroPage/RenderTalents";
import {openDB} from "idb";
import {getImageUrl} from "../../../../utils/r2Storage";
import styles from './hero_build_page.module.scss';
import {useTranslation} from "react-i18next";

export const HeroBuildPage: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const [heroInformation, setHeroInformation] = useState<HeroInformation | null>(null);
    const [heroName, setHeroName] = useState<string | null>(null);
    const [currentTalentLevels, setCurrentTalentLevels] = useState<{ [key: string]: { [key: string]: number } } | null>(null);
    const [upgradeOrder, setUpgradeOrder] = useState<string[] | null>(null);
    const API_URL = process.env.REACT_APP_API_URL;
    const [heroImage, setHeroImage] = useState<string | null>(null);
    const [createdAt, setCreatedAt] = useState<Date | null>(null);
    const [buildName, setBuildName] = useState('');
    const [buildDescription, setBuildDescription] = useState('');

    useEffect(() => {
        const fetchHeroBuild = async () => {
            try {
                const response = await fetch(`${API_URL}/hero-build/${id}`);
                if (response.ok) {
                    const data = await response.json();

                    setHeroName(data.heroName);
                    setCurrentTalentLevels(data.currentTalentLevels);
                    setUpgradeOrder(data.upgradeOrder);
                    setBuildName(data.buildName);
                    setBuildDescription(data.buildDescription || '');
                    setCreatedAt(new Date(data.createdAt));
                } else {
                    console.error('Error fetching hero build');
                }
            } catch (error) {
                console.error('Error fetching hero build:', error);
            }
        };

        if (id) {
            fetchHeroBuild();
        }
    }, [API_URL,id]);

    const fetchHeroDataFromCache = (heroName: string) => {
        const cachedData = localStorage.getItem('heroesData');

        if (cachedData) {
            const heroesData = JSON.parse(cachedData);

            const heroData = heroesData[heroName];

            if (heroData) {
                return heroData;
            } else {
                return null;
            }
        }

        return null;
    };

    const fetchHeroImageFromCache = async (heroName: string) => {
        try {
            // Открываем базу данных heroes-db и доступ к хранилищу heroes
            const db = await openDB('heroes-db', 4, {
                upgrade(db) {
                    // Убедитесь, что хранилище heroes существует
                    if (!db.objectStoreNames.contains('heroes')) {
                        db.createObjectStore('heroes');
                    }
                }
            });

            // Получаем данные героя из хранилища heroes по ключу (имя героя)
            const heroImageBlob = await db.get('heroes', heroName);

            if (heroImageBlob) {
                // Если картинка найдена, устанавливаем ее
                const imageUrl = URL.createObjectURL(heroImageBlob); // Преобразуем Blob в URL
                setHeroImage(imageUrl); // Устанавливаем изображение
            } else {
                console.log(`No image found for hero ${heroName} in the cache`);

                // Если изображения нет в базе, загрузим его из сети и сохраним в базу данных
                const imageUrl = await getImageUrl(`images/heroes/heroesPreview/${heroName}.webp`);

                if (imageUrl) {
                    // Загружаем изображение как Blob
                    const response = await fetch(imageUrl);
                    const imageBlob = await response.blob();

                    // Сохраняем изображение в IndexedDB
                    await db.put('heroes', imageBlob, heroName);

                    // Устанавливаем изображение
                    const imageUrlFromBlob = URL.createObjectURL(imageBlob);
                    setHeroImage(imageUrlFromBlob);
                } else {
                    // Если не удается загрузить изображение, установим изображение по умолчанию
                    setHeroImage(null);
                }
            }

            db.close();
        } catch (error) {
            console.error('Error fetching hero image from IndexedDB:', error);
        }
    };


    useEffect(() => {
        if (heroName) {
            fetchHeroImageFromCache(heroName);
        }
    }, [heroName]);

    useEffect(() => {
        let data;
        if(heroName){
            data = fetchHeroDataFromCache(heroName);
        }
        if (data) {
            setHeroInformation(data);
        } else {
        }
    }, [heroName]);



    return (
        <div>
            <div className={styles.title}>{t('hero_build')}</div>
            {heroImage && heroName && createdAt &&
                <div className={styles.div_container}>
                    <div className={styles.menu_container}>
                        <div className={styles.hero_container}>
                            <img className={styles.heroImg} src={heroImage} alt={heroName}/>
                            <div className={styles.heroNameContainer}>
                                <div className={styles.heroName}>{heroName
                                    .split(" ")
                                    .map((word, index) => (
                                        <div key={index}>
                                            {word.charAt(0).toUpperCase() + word.slice(1)}
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.data}>{createdAt.toLocaleDateString("ru-RU", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                })}</div>
                            </div>
                        </div>
                        <div className={styles.nameBuild}>{buildName}</div>
                        {buildDescription && (
                            <div className={styles.nameDescription}>{buildDescription}</div>
                        )}
                    </div>
                </div>
            }
            <RenderTalents
                hero_name={heroName || 'slark'}
                talents_information={heroInformation?.talents_information || {}}
                talents_description={heroInformation?.talents_description || {}}
                buildCurrentTalentLevels={currentTalentLevels ?? {}}
                buildUpgradeOrder={upgradeOrder ?? []}
                isBuild={true}
            />
        </div>
    );
};
