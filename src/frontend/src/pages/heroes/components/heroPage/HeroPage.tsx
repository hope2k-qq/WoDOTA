import { useParams } from 'react-router-dom';
import styles from './hero_page.module.scss';
import { HeroScenePage } from './components/heroScenePage/HeroScenePage';
import AbilitiesSection from './AbilitiesSection';
import Abilities from './Abilities';
import RenderTalents from './RenderTalents';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {HeroCharacteristics} from "./HeroCharacteristics";
import {HeroDifferences} from "./HeroDifferences";
import {HeroInformation} from "../../../../types/heroes";

type AttributeType = 'int' | 'str' | 'agi' | 'uni';

interface AttributeData {
    text: string;
    image: string;
}

const HeroPage: React.FC = () => {
    const { name } = useParams<{ name: string }>();
    const [heroInformation, setHeroInformation] = useState<HeroInformation | null>(null);
    const [attribute, setAttribute] = useState<AttributeType | null>(null); // Используем конкретный тип для атрибута
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        axios.get(`${API_URL}/hero-attribute/${name}`)
            .then(response => {
                setAttribute(response.data.primary_attr);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching heroes data:', error);
                setIsLoading(false);
            });
    }, [API_URL, name]);

    useEffect(() => {
        const fetchHeroData = async () => {
            try {
                const response = await axios.get<HeroInformation>(`${API_URL}/hero/${name}`);
                setHeroInformation(response.data);
            } catch (error) {
                console.error('Error fetching hero data:', error);
            }
        };

        fetchHeroData();
    }, [API_URL, name]);

    const attributeData: Record<AttributeType, AttributeData> = {
        'int': {
            text: 'ИНТЕЛЛЕКТ',
            image: '/int.png'
        },
        'str': {
            text: 'СИЛА',
            image: '/str.png'
        },
        'agi': {
            text: 'ЛОВКОСТЬ',
            image: '/agi.png'
        },
        'uni': {
            text: 'УНИВЕРСАЛЬНЫЙ',
            image: '/uni.png'
        }
    };

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
                        <div>Загрузка...</div>
                    ) : (
                        <div>
                            {attribute ? renderAttribute(attribute) : <p>Атрибут не найден</p>}
                        </div>
                    )}
                    <div className={styles.overlayText}>
                        {name ? name.replace(/_/g, ' ').toUpperCase() : 'SLARK'}
                    </div>
                    <Abilities heroName={name || 'slark'}/>
                    <HeroCharacteristics heroName={name || 'slark'}/>
                </div>
                <HeroDifferences/>
            </div>
            <div className={styles.render_talents_container}>
                <RenderTalents hero_name={name || 'slark'}
                               talents_information={heroInformation?.talents_information || {}}
                               talents_description={heroInformation?.talents_description || {}}/>
            </div>
            <AbilitiesSection heroName={name || 'slark'}/>
        </div>
    );
};

export default HeroPage;
