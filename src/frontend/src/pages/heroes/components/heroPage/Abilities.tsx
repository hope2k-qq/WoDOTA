import React, { useEffect, useState } from 'react';
import styles from "./abilities.module.scss";
import axios from "axios";
import { formatAbilityDescription } from '../../../../utils/formatAbilityDescription';
import { handleAbilitiesData } from '../../../../utils/handleAbilitiesData';
import {fetchAbilityImages} from "../../../../utils/abilityUtils";
import { AbilityData, AbilitiesProps } from '../../../../types/heroes';

const replacements_heroes: { [key: string]: string } = {
    'roshan': 'arc_warden',
    'creep': 'chen',
    'aghanim': 'meepo',
    'wraith_king': 'skeleton_king',
    'shadow_fiend': 'nevermore',
    'necrophos': 'necrolyte',
    'nature\'s_prophet': 'furion',
    'vengeful_spirit': 'vengefulspirit',
    'anti-mage': 'antimage',
    'zeus': 'zuus',
};

const Abilities: React.FC<AbilitiesProps> = ({ heroName }) => {
    const [heroAbilities, setHeroAbilities] = useState<{
        [key: string]: AbilityData;
    } | null>(null);
    const [abilitiesSrcs, setAbilitiesSrcs] = useState<{ [key: string]: string | null }>({});
    const [videoLoaded, setVideoLoaded] = useState<{ [key: string]: boolean }>({});

    const API_URL = process.env.REACT_APP_API_URL;


    useEffect(() => {
        if (heroAbilities) {
            const fetchImages = async () => {
                try {
                    const images = await fetchAbilityImages(heroAbilities);
                    setAbilitiesSrcs(images);
                } catch (error) {
                    console.error('Error fetching ability images:', error);
                }
            };

            fetchImages();
        }
    }, [heroAbilities]);


    useEffect(() => {
        axios.get(`${API_URL}/hero/${heroName}`)
            .then(response => {
                handleAbilitiesData(response.data.abilities, setHeroAbilities);
            })
            .catch(error => {
                console.error('Error fetching hero data:', error);
            });
    }, [API_URL, heroName]);

    const getAlternativeHeroName = (heroName: string) => {
        return replacements_heroes[heroName] || heroName;
    };

    const getUpdatedPath = (heroName: string, key: string, extension: string): string[] => {
        let path = `https://cdn.akamai.steamstatic.com/apps/dota2/videos/dota_react/abilities/${heroName}/${key}.${extension}`;
        let altHeroName = getAlternativeHeroName(heroName);

        if (heroName !== altHeroName) {
            let altKey = key.replace(heroName, altHeroName);
            let altPath = `https://cdn.akamai.steamstatic.com/apps/dota2/videos/dota_react/abilities/${altHeroName}/${altKey}.${extension}`;
            return [path, altPath];
        }

        return [path];
    };
    const renderAbilities = () => {
        if (!heroAbilities || Object.keys(heroAbilities).length === 0) {
            return <div></div>;
        }

        return (
            <div className={styles.abilitiesContainer}>
                {Object.keys(heroAbilities).map((key, index) => {
                    const ability = heroAbilities[key];
                    const imageUrl = abilitiesSrcs[key];

                    const videoPaths = getUpdatedPath(heroName, key, 'webm');
                    const imagePaths = getUpdatedPath(heroName, key, 'jpg');
                    const formattedDescription = formatAbilityDescription(ability.description, ability.values as Record<string, string>);

                    return (
                        <div key={index} className={styles.ability}>
                            {imageUrl ? (
                                <img src={imageUrl} alt={ability.name} className={styles.abilityImage} />
                            ) : (
                                <span></span>
                            )}
                            <div className={styles.abilityDetails}>
                                <div className={styles.mediaContainer}>
                                    {!videoLoaded[key] && (
                                        <img
                                            src={imagePaths[0]}
                                            onError={(e) => {
                                                e.currentTarget.src = "/noFound.png";
                                            }}
                                            alt={ability.name}
                                            className={styles.abilityImage}
                                        />
                                    )}
                                    <video
                                        className={styles.abilityVideo}
                                        src={videoPaths[0]}
                                        onError={(e) => {
                                            if (videoPaths[1]) {
                                                e.currentTarget.src = videoPaths[1];
                                            } else {
                                                setVideoLoaded((prevState) => ({
                                                    ...prevState,
                                                    [key]: false
                                                }));
                                            }
                                        }}
                                        autoPlay
                                        loop
                                        muted
                                        onLoadedData={() => setVideoLoaded((prevState) => ({
                                            ...prevState,
                                            [key]: true
                                        }))}
                                        style={{display: videoLoaded[key] ? "block" : "none"}}
                                    ></video>
                                </div>
                                <div className={styles.ability_content}>
                                    <div className={styles.ability_title}>{ability.name}</div>
                                    <div className={styles.ability_description}
                                         dangerouslySetInnerHTML={{__html: formattedDescription}}></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        renderAbilities()
    );
};

export default Abilities;
