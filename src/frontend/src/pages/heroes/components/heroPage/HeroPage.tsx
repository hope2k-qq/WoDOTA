import {useParams} from 'react-router-dom';
import styles from './hero_page.module.scss';
import { HeroScenePage } from './components/heroScenePage/HeroScenePage';
import AbilitiesSection from './AbilitiesSection';
import Abilities from './Abilities';
import RenderTalents from './RenderTalents';
import React, {useEffect, useState} from 'react';
import {HeroCharacteristics} from "./HeroCharacteristics";
//import {HeroDifferences} from "./HeroDifferences";
import {AbilityData, HeroInformation} from "../../../../types/heroes";
import {useTranslation} from "react-i18next";
import {useMyData} from "../../../../context/HeroesDataContext";
import {NotFoundPage} from "../../../notFound/NotFoundPage";

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
    const [heroAbilities, setHeroAbilities] = useState<{
        [key: string]: AbilityData;
    } | null>(null);
    const [heroInnate, setHeroInnate] = useState<{
        [key: string]: AbilityData;
    } | null>(null);
    const { heroesData, languageReady, heroesAttributes } = useMyData();
    const hero = React.useMemo(() => {
        if (!heroesAttributes || !name) return null;
        return heroesAttributes.find((h: Hero) => h.name === name) || null;
    }, [heroesAttributes, name]);

    const isDataLoading =
        !languageReady ||
        !heroesAttributes ||
        !heroesData;

    const isHeroLoading =
        isDataLoading ||
        !heroInformation ||
        !heroAbilities ||
        !heroInnate;

    const isNotFound =
        !isDataLoading &&
        !!name &&
        Array.isArray(heroesAttributes) &&
        hero === null;
    useEffect(() => {
        if (name) {
            const formattedName = name
                .split("_")
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

        if (!heroesAttributes) {
            return;
        }

        const hero = heroesAttributes.find(
            (h: Hero) => h.name === name
        );

        if (hero) {
            setAttribute(hero.primary_attr as AttributeType);
        } else {
        }

    }, [heroesAttributes, name]);


    useEffect(() => {
        let data;
        if(name){
            const fetchHeroDataFromCache = (heroName: string) => {
                if (heroesData) {
                    const heroData = heroesData[heroName];
                    if (heroData) {
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
            setHeroInnate(data.innate);
        }
    }, [name, heroesData]);






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


    if (isDataLoading) {
        return <div className={styles.loadingScreen} />;
    }

    if (isNotFound) {
        return <NotFoundPage />;
    }

    if (isHeroLoading) {
        return <div className={styles.loadingScreen} />;
    }

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
                <HeroScenePage heroName={name!}/>
                <div className={styles.overlayBlock}>
                    {attribute && renderAttribute(attribute)}
                    <div className={styles.overlayText}>
                        {name ? name.replace(/_/g, ' ').toUpperCase() : 'SLARK'}
                    </div>
                    <Abilities heroName={name!} heroAbilities={heroAbilities} heroInnate={heroInnate}/>
                    <HeroCharacteristics
                        heroName={name!}
                        characteristics={heroInformation?.characteristics}
                    />
                </div>
                {/*<HeroDifferences/>*/}
            </div>
            <div className={styles.render_talents_container}>
                <RenderTalents
                    hero_name={name!}
                    talents_information={heroInformation?.talents_information || {}}
                    talents_description={heroInformation?.talents_description || {}}
                />
            </div>
            <div className={styles.abilitiesSectionContainer}>
                <AbilitiesSection heroName={name!} heroAbilities={heroAbilities} heroInnate={heroInnate}/>
            </div>
        </div>
    );
};

export default HeroPage;