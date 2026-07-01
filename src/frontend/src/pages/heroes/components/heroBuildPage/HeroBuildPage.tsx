
import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {HeroInformation} from "../../../../types/heroes";
import RenderTalents from "../heroPage/RenderTalents";
import {getImageUrl} from "../../../../utils/r2Storage";
import styles from './hero_build_page.module.scss';
import {useTranslation} from "react-i18next";
import {useMyData} from "../../../../context/HeroesDataContext";

export const HeroBuildPage: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const { heroesData } = useMyData();
    const [heroInformation, setHeroInformation] = useState<HeroInformation | null>(null);
    const [heroName, setHeroName] = useState<string | null>(null);
    const [currentTalentLevels, setCurrentTalentLevels] = useState<{ [key: string]: { [key: string]: number } } | null>(null);
    const [upgradeOrder, setUpgradeOrder] = useState<string[] | null>(null);
    const API_URL = process.env.REACT_APP_API_URL;
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

    const fetchHeroDataFromCache = useCallback((heroName: string) => {
        if (heroesData) {
            const heroData = heroesData[heroName];

            if (heroData) {
                return heroData;
            } else {
                return null;
            }
        }

        return null;
    }, [heroesData]);

    useEffect(() => {
        let data;
        if(heroName){
            data = fetchHeroDataFromCache(heroName);
        }
        if (data) {
            setHeroInformation(data);
        } else {
        }
    }, [heroName, heroesData, fetchHeroDataFromCache]);



    return (
        <div>
            <div className={styles.title}>{t('hero_build')}</div>
            {heroName && createdAt &&
                <div className={styles.div_container}>
                    <div className={styles.menu_container}>
                        <div className={styles.hero_container}>
                            <img className={styles.heroImg}
                                 src={getImageUrl(`images/heroes/heroesPreview/${heroName}.webp`)}
                                 alt={heroName}/>
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
