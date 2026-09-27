
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import RenderTalents from "../heroPage/RenderTalents";
import {getImageUrl} from "../../../../utils/r2Storage";
import styles from './hero_build_page.module.scss';
import {useTranslation} from "react-i18next";
import {useHeroData} from "../../../../hooks/useHeroData";
import {useLang} from "../../../../hooks/useLang";

export const HeroBuildPage: React.FC = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const lang = useLang();
    const [heroName, setHeroName] = useState<string | null>(null);
    const { heroData } = useHeroData(heroName, lang);
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
                talents_information={heroData?.talents_information || {}}
                talents_description={heroData?.talents_description || {}}
                buildCurrentTalentLevels={currentTalentLevels ?? {}}
                buildUpgradeOrder={upgradeOrder ?? []}
                isBuild={true}
            />
        </div>
    );
};
